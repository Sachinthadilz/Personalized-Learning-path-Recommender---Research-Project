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
    LearnerProfileRequest, LearnerProfileResponse, AutoLearnerProfileRequest,
    TimetableGenerateRequest,
)
from services import CourseService, RecommendationService, StatsService
from services.ai_search_service import AISearchService
from services.learning_path_service import LearningPathService
from services.cross_domain_service import CrossDomainService
from services.ai_learning_path_service import ai_learning_path_service
from services.learner_profile_service import LearnerProfileService
from services.student_data_service import StudentDataService
from services.timetable_service import timetable_service

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle handler."""
    # No MongoDB or Redis connections needed — ML only
    yield

# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    lifespan=lifespan,
)

# Add CORS middleware
# allow_origins must list explicit origins (not "*") when allow_credentials=True,
# because browsers block wildcard + credentialed requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    except ValueError as e:
        logger.warning("Invalid learner profile request: %s", e)
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in learner profile prediction: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-learner-profile/auto", response_model=LearnerProfileResponse)
async def predict_learner_profile_auto(request: AutoLearnerProfileRequest):
    """
    **Automatic learner profile prediction** based on logged-in student ID.

    This endpoint automatically fetches:
    - Student demographics from OULAD CSV files
    - Engagement features from activity log database (or uses pre-computed values)
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
       
    3. **Pre-computed Features Mode** (from Node.js proxy):
       ```json
       {
         "student_id": "student_123",
         "course_id": "ml-fundamentals",
         "total_clicks": 450,
         "days_active": 24,
         "max_daily_clicks": 63,
         "mean_daily_clicks": 18.75,
         "early_clicks": 120,
         "num_assessments": 5
       }
       ```
       When engagement features are provided (non-zero), skips MongoDB query.

    The system builds the full 19-feature input internally and runs the
    same 3-stage ML pipeline as the manual endpoint.
    """
    try:
        student_id = request.student_id
        
        # Resolve course identifiers (all optional — student_id alone is enough)
        code_module = None
        code_presentation = None

        if request.course_id:
            # Browser extension mode — map course_id to OULAD fields
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
                    detail=f"Could not map course_id '{request.course_id}': {e}",
                )
        elif request.code_module and request.code_presentation:
            # Direct OULAD mode
            code_module = request.code_module
            code_presentation = request.code_presentation

        # 1. Fetch student background data (11 fields)
        student_features = StudentDataService.build_student_features(
            student_id=student_id,
            code_module=code_module,
            code_presentation=code_presentation,
        )

        # 2. Fetch OR use pre-computed engagement features
        # Check if engagement features are pre-computed (at least one non-zero value)
        has_precomputed = any([
            request.total_clicks,
            request.days_active,
            request.max_daily_clicks,
            request.mean_daily_clicks,
            request.early_clicks,
            request.num_assessments,
        ])
        
        if has_precomputed:
            # Use pre-computed engagement features from Node.js proxy
            logger.info(
                "Using pre-computed engagement features for student_id=%s",
                student_id
            )
            engagement_features = {
                "total_clicks": request.total_clicks,
                "days_active": request.days_active,
                "max_daily_clicks": request.max_daily_clicks,
                "mean_daily_clicks": request.mean_daily_clicks,
                "early_clicks": request.early_clicks,
                "num_assessments": request.num_assessments,
            }
        else:
            # No pre-computed features and no MongoDB access
            # This endpoint should be called via Node.js proxy which provides pre-computed features
            logger.info(
                "No pre-computed engagement features provided for student_id=%s. "
                "Using default values (all zeros). "
                "For accurate predictions, call this endpoint via Node.js proxy at /predict/auto",
                student_id
            )
            engagement_features = {
                "total_clicks": 0,
                "days_active": 0,
                "max_daily_clicks": 0,
                "mean_daily_clicks": 0.0,
                "early_clicks": 0,
                "num_assessments": 0,
            }

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
            "total_clicks": engagement_features["total_clicks"],
            "days_active": engagement_features["days_active"],
            "max_daily_clicks": engagement_features["max_daily_clicks"],
            "mean_daily_clicks": engagement_features["mean_daily_clicks"],
            "early_clicks": engagement_features["early_clicks"],
            "num_assessments": engagement_features["num_assessments"],
            "first_reg_before_start": student_features["first_reg_before_start"],
            # Academic (4)
            "mean_score": student_features["mean_score"],
            "ever_unregistered": student_features["ever_unregistered"],
            "num_of_prev_attempts": student_features["num_of_prev_attempts"],
            "studied_credits": student_features["studied_credits"],
        }

        # 4. Validate sufficient activity data before prediction
        has_activity = (
            engagement_features["total_clicks"] > 0 
            or engagement_features["days_active"] > 0 
            or engagement_features["num_assessments"] > 0
        )
        
        if not has_activity:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "insufficient_data",
                    "message": "Cannot generate learner profile prediction: no learning activity data found for this student. "
                               "Please complete at least one learning activity (watch a video, click a resource, or submit an assessment) to enable predictions.",
                    "student_id": student_id,
                    "suggestion": "Start learning to unlock your personalized profile analysis!"
                }
            )

        # 5. Run ML prediction pipeline
        result = LearnerProfileService.predict(features)
        return LearnerProfileResponse(**result.to_dict())

    except ValueError as e:
        logger.error("Student data not found: %s", e)
        raise HTTPException(
            status_code=404,
            detail=f"Student not found: {e}"
        )
    except HTTPException:
        raise
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


# ============= TIMETABLE PLANNER ENDPOINTS =============

@app.post("/timetable/generate")
def timetable_generate(request: TimetableGenerateRequest):
    """
    Generate a full AI-powered timetable for a student.
    Uses the trained ML model (or proportional fallback).
    Returns the full timetable data — saving is done by the Node.js auth backend.
    """
    try:
        result = timetable_service.generate_timetable(request.model_dump())
        return result
    except Exception as e:
        logger.error(f"Timetable generate error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


def main():
    """Run the FastAPI application"""
    uvicorn.run(
        app,  # Pass app object directly instead of string (disables reload)
        host="127.0.0.1",  # Localhost only to avoid firewall issues
        port=settings.API_PORT
    )


if __name__ == "__main__":
    main()
