"""
FastAPI application for Course Knowledge Graph
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional
import uvicorn
import logging

from config import settings
from models import (
    Course, CourseDetail, SearchQuery, RecommendationRequest,
    LearningPathRequest, Skill, University, StatsResponse,
    AISearchQuery, AISearchResult, LearningPathResponse,
    LearnerProfileRequest, LearnerProfileResponse, AutoLearnerProfileRequest
)
from services import CourseService, RecommendationService, StatsService
from services.ai_search_service import AISearchService
from services.learning_path_service import LearningPathService
from services.cross_domain_service import CrossDomainService
from services.ai_learning_path_service import ai_learning_path_service
from services.learner_profile_service import LearnerProfileService
from services.student_data_service import StudentDataService
from services.activity_log_service import ActivityLogService
from services.engagement_feature_service import EngagementFeatureService
from activity_log_routes import activity_log_router
from mongo_activity import ensure_indexes, close_client
from services.redis_queue import connect_redis, close_redis

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle handler."""
    await ensure_indexes()   # create MongoDB indexes once at startup
    await connect_redis()    # open Redis connection for the event queue
    yield
    await close_redis()              # close Redis connection
    close_client()                   # clean up Motor connection on shutdown

# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(activity_log_router)


@app.get("/")
def root():
    """API root endpoint"""
    return {
        "message": "Course Knowledge Graph API",
        "version": settings.API_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# ============= COURSE ENDPOINTS =============

@app.get("/courses", response_model=List[Course])
def get_courses(
    skip: int = Query(0, ge=0, description="Number of courses to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of courses")
):
    """Get all courses with pagination"""
    try:
        return CourseService.get_all_courses(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/courses/{course_id}", response_model=CourseDetail)
def get_course(course_id: str):
    """Get detailed information about a specific course"""
    try:
        course = CourseService.get_course_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Add similar courses
        course.similar_courses = RecommendationService.get_similar_courses(
            course_id, limit=5
        )
        
        return course
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/courses/search", response_model=List[Course])
def search_courses(search_query: SearchQuery):
    """Search courses with filters"""
    try:
        return CourseService.search_courses(
            query=search_query.query,
            skills=search_query.skills,
            difficulty=search_query.difficulty,
            min_rating=search_query.min_rating,
            limit=search_query.limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/courses/by-skill/{skill_name}", response_model=List[Course])
def get_courses_by_skill(
    skill_name: str,
    limit: int = Query(10, ge=1, le=50)
):
    """Get courses that teach a specific skill"""
    try:
        return CourseService.get_courses_by_skill(skill_name, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= RECOMMENDATION ENDPOINTS =============

@app.get("/recommendations/similar/{course_id}", response_model=List[Course])
def get_similar_courses(
    course_id: str,
    limit: int = Query(10, ge=1, le=50)
):
    """Get courses similar to a given course"""
    try:
        return RecommendationService.get_similar_courses(course_id, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommendations", response_model=List[Course])
def get_recommendations(request: RecommendationRequest):
    """Get personalized course recommendations"""
    try:
        if request.course_id:
            return RecommendationService.get_similar_courses(
                request.course_id, limit=request.limit
            )
        elif request.skills:
            return RecommendationService.get_courses_by_skills(
                request.skills,
                difficulty=request.difficulty,
                limit=request.limit
            )
        else:
            return RecommendationService.get_popular_courses(limit=request.limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/recommendations/popular", response_model=List[Course])
def get_popular_courses(
    limit: int = Query(10, ge=1, le=50)
):
    """Get most popular courses"""
    try:
        return RecommendationService.get_popular_courses(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/learning-path", response_model=List[Course])
def get_learning_path(request: LearningPathRequest):
    """
    Generate an AI-powered learning path to acquire a target skill
    
    Uses Groq AI to intelligently curate the optimal course sequence
    based on difficulty progression, ratings, and skill prerequisites.
    """
    try:
        # Use AI service to generate intelligent learning path
        courses = ai_learning_path_service.generate_ai_learning_path(
            target_skill=request.target_skill,
            start_course_id=request.start_course_id,
            max_courses=request.max_courses
        )
        
        if not courses:
            # Fallback to traditional method if AI fails or no courses found
            courses = RecommendationService.get_learning_path(
                target_skill=request.target_skill,
                start_course_id=request.start_course_id,
                max_courses=request.max_courses
            )
        
        return courses
    except Exception as e:
        logger.error(f"Error generating learning path: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= SKILL ENDPOINTS =============

@app.get("/skills", response_model=List[Skill])
def get_all_skills(
    limit: int = Query(100, ge=1, le=500)
):
    """Get all skills sorted by popularity"""
    try:
        return StatsService.get_all_skills(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/skills/{skill_name}/related", response_model=List[str])
def get_related_skills(
    skill_name: str,
    limit: int = Query(10, ge=1, le=50)
):
    """Get skills related to a given skill"""
    try:
        return StatsService.get_related_skills(skill_name, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= UNIVERSITY ENDPOINTS =============

@app.get("/universities", response_model=List[University])
def get_all_universities(
    limit: int = Query(100, ge=1, le=500)
):
    """Get all universities with course counts"""
    try:
        return StatsService.get_all_universities(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= AI SEARCH ENDPOINTS =============

@app.post("/ai-search", response_model=LearningPathResponse)
def ai_semantic_search(search_query: AISearchQuery):
    """
    AI-powered semantic search with structured learning path
    
    Returns courses organized by difficulty (Beginner → Intermediate → Advanced)
    plus cross-domain recommendations for broader learning opportunities.
    """
    try:
        # Step 1: Get semantic search results
        results = AISearchService.semantic_search(
            query=search_query.query,
            limit=search_query.limit
        )
        
        # Step 2: Build structured learning path
        learning_path = LearningPathService.build_learning_path(results)
        
        # Step 3: Get top courses from learning path for cross-domain analysis
        # Use top 5 courses (mix of beginner + intermediate)
        core_courses = (
            learning_path['beginner'][:3] + 
            learning_path['intermediate'][:2]
        )
        
        # Step 4: Find cross-domain courses
        cross_domain = CrossDomainService.get_cross_domain_courses(
            core_courses=core_courses,
            all_search_results=results,
            limit=3
        )
        
        # Step 5: Get summary statistics
        summary = LearningPathService.get_learning_path_summary(learning_path)
        summary['cross_domain_count'] = len(cross_domain)
        
        return LearningPathResponse(
            learning_path=learning_path,
            cross_domain_courses=cross_domain,
            summary=summary
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= LEARNER PROFILE PREDICTION ENDPOINT =============

@app.post("/predict-learner-profile", response_model=LearnerProfileResponse)
def predict_learner_profile(request: LearnerProfileRequest):
    """
    Predict learner profile, academic outcome, and early-warning risk.

    Runs a three-stage ML pipeline on 19 OULAD student features:

    1. **Learner profile classification** – clusters the student into one of:
       *Balanced learners*, *Disengaged learners*, *Fast learners*,
       *Struggling learners*.
    2. **Academic outcome prediction** – forecasts the final result:
       *Distinction*, *Pass*, *Fail*, or *Withdrawn*.
    3. **Early warning detection** – flags the student as *At-Risk* or
       *Not At-Risk* and provides a risk score (0–1).

    The response also includes a recommended learning track and
    action plan mapped to the predicted outcome.
    """
    try:
        features = request.model_dump()
        result = LearnerProfileService.predict(features)
        return LearnerProfileResponse(**result.to_dict())
    except Exception as e:
        logger.error("Error in learner profile prediction: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-learner-profile/auto", response_model=LearnerProfileResponse)
async def predict_learner_profile_auto(request: AutoLearnerProfileRequest):
    """
    **Automatic learner profile prediction** based on logged-in student ID.

    This endpoint automatically fetches:
    - Student demographics from OULAD CSV files
    - Engagement features from activity log database
    - Assessment scores from OULAD data
    - Registration information

    **Input Options:**
    
    1. **Browser Extension Mode** (Recommended):
       ```json
       {
         "student_id": "student_123",
         "course_id": "ml-fundamentals"
       }
       ```
       The `course_id` is automatically mapped to OULAD `code_module` and `code_presentation`.
    
    2. **Direct OULAD Mode**:
       ```json
       {
         "student_id": "student_123",
         "code_module": "DDD",
         "code_presentation": "2014J"
       }
       ```

    The system builds the full 19-feature input internally and runs the
    same 3-stage ML pipeline as the manual endpoint.
    """
    try:
        student_id = request.student_id
        
        # Resolve course identifiers (support both modes)
        if request.course_id:
            # Mode 1: Browser extension — map course_id to OULAD fields
            from services.course_mapping_service import CourseMappingService, CourseMappingError
            try:
                mapping = CourseMappingService.map_course(request.course_id)
                code_module = mapping["code_module"]
                code_presentation = mapping["code_presentation"]
                logger.info(
                    "Mapped course_id '%s' → %s / %s",
                    request.course_id, code_module, code_presentation
                )
            except CourseMappingError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid course_id: {e}"
                )
        elif request.code_module and request.code_presentation:
            # Mode 2: Direct OULAD fields
            code_module = request.code_module
            code_presentation = request.code_presentation
        else:
            # Neither mode specified
            raise HTTPException(
                status_code=400,
                detail="Must provide either 'course_id' OR both 'code_module' and 'code_presentation'"
            )

        # 1. Fetch student background data (11 fields)
        student_features = StudentDataService.build_student_features(
            student_id=student_id,
            code_module=code_module,
            code_presentation=code_presentation,
        )

        # 2. Fetch engagement features from activity logs (8 fields)
        # Uses optimized MongoDB aggregation pipelines
        # CRITICAL: Must pass course_id (not code_module) to filter MongoDB logs correctly
        # MongoDB stores logs with course_id field, not OULAD code_module
        if not request.course_id:
            raise HTTPException(
                status_code=400,
                detail="course_id is required for engagement feature computation from activity logs"
            )
        
        engagement_features = await EngagementFeatureService.generate_engagement_features_as_model(
            student_id=student_id,
            course_id=request.course_id,
        )

        # 3. Merge into full 19-feature dict
        features = {
            # Demographics (8)
            "gender": student_features["gender"],
            "region": student_features["region"],
            "highest_education": student_features["highest_education"],
            "imd_band": student_features["imd_band"],
            "age_band": student_features["age_band"],
            "disability": student_features["disability"],
            "code_module": student_features["code_module"],
            "code_presentation": student_features["code_presentation"],
            # Engagement (7)
            "total_clicks": engagement_features.total_clicks,
            "days_active": engagement_features.days_active,
            "max_daily_clicks": engagement_features.max_daily_clicks,
            "mean_daily_clicks": engagement_features.mean_daily_clicks,
            "early_clicks": engagement_features.early_clicks,
            "num_assessments": engagement_features.num_assessments,
            "first_reg_before_start": student_features["first_reg_before_start"],
            # Academic (4)
            "mean_score": student_features["mean_score"],
            "ever_unregistered": student_features["ever_unregistered"],
            "num_of_prev_attempts": student_features["num_of_prev_attempts"],
            "studied_credits": student_features["studied_credits"],
        }

        # 4. Run ML prediction pipeline
        result = LearnerProfileService.predict(features)
        return LearnerProfileResponse(**result.to_dict())

    except ValueError as e:
        logger.error("Student data not found: %s", e)
        raise HTTPException(
            status_code=404,
            detail=f"Student not found: {e}"
        )
    except Exception as e:
        logger.error("Error in automatic learner profile prediction: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ============= STATISTICS ENDPOINTS =============

@app.get("/stats", response_model=StatsResponse)
def get_statistics():
    """Get database statistics"""
    try:
        stats = StatsService.get_database_stats()
        return StatsResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def main():
    """Run the FastAPI application"""
    uvicorn.run(
        app,  # Pass app object directly instead of string (disables reload)
        host="127.0.0.1",  # Localhost only to avoid firewall issues
        port=settings.API_PORT
    )


if __name__ == "__main__":
    main()
