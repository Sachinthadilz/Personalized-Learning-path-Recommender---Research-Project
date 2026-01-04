"""
FastAPI application for Course Knowledge Graph
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn

from config import settings
from models import (
    Course, CourseDetail, SearchQuery, RecommendationRequest,
    LearningPathRequest, Skill, University, StatsResponse,
    AISearchQuery, AISearchResult, LearningPathResponse
)
from services import CourseService, RecommendationService, StatsService
from services.ai_search_service import AISearchService
from services.learning_path_service import LearningPathService
from services.cross_domain_service import CrossDomainService

# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    """Generate a learning path to acquire a target skill"""
    try:
        return RecommendationService.get_learning_path(
            target_skill=request.target_skill,
            start_course_id=request.start_course_id,
            max_courses=request.max_courses
        )
    except Exception as e:
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
