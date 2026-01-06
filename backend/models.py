"""
Pydantic models for API request/response schemas
"""
from pydantic import BaseModel, Field, HttpUrl, ConfigDict
from typing import List, Optional, Dict, Any
from enum import Enum
from learner_models import (
    StudentDataInput, ProfileClassification, OutcomePrediction,
    StudentAnalysis, BatchAnalysisRequest, BatchAnalysisResponse,
    SimilarStudent, CourseRecommendationForProfile,
    ProfileBasedRecommendationRequest, ProfileBasedRecommendationResponse,
    LearnerProfileStats, Recommendation
)


class DifficultyLevel(str, Enum):
    """Course difficulty levels"""
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"
    CONVERSANT = "Conversant"


class SkillBase(BaseModel):
    """Base skill model"""
    model_config = ConfigDict(from_attributes=True)
    
    name: str


class Skill(SkillBase):
    """Skill with additional information"""
    course_count: Optional[int] = None
    related_skills: Optional[List[str]] = []


class UniversityBase(BaseModel):
    """Base university model"""
    model_config = ConfigDict(from_attributes=True)
    
    name: str


class University(UniversityBase):
    """University with additional information"""
    course_count: Optional[int] = None
    avg_rating: Optional[float] = None


class CourseBase(BaseModel):
    """Base course model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    name: str
    description: str
    rating: float
    url: HttpUrl


class Course(CourseBase):
    """Full course model with relationships"""
    university: Optional[str] = None
    difficulty: Optional[str] = None
    skills: List[str] = []


class CourseDetail(Course):
    """Detailed course with recommendations"""
    similar_courses: Optional[List['Course']] = []
    prerequisite_courses: Optional[List['Course']] = []


class LearningPath(BaseModel):
    """A sequence of courses forming a learning path"""
    path_id: str
    courses: List[Course]
    total_courses: int
    target_skill: str
    estimated_duration: Optional[str] = None


class SearchQuery(BaseModel):
    """Search query parameters"""
    query: str = Field(..., min_length=1, description="Search query text")
    skills: Optional[List[str]] = Field(None, description="Filter by skills")
    difficulty: Optional[DifficultyLevel] = Field(None, description="Filter by difficulty")
    min_rating: Optional[float] = Field(None, ge=0, le=5, description="Minimum rating")
    limit: int = Field(10, ge=1, le=100, description="Maximum results")


class RecommendationRequest(BaseModel):
    """Request for course recommendations"""
    course_id: Optional[str] = Field(None, description="Base course for similarity")
    skills: Optional[List[str]] = Field(None, description="Desired skills")
    difficulty: Optional[DifficultyLevel] = Field(None, description="Preferred difficulty")
    limit: int = Field(10, ge=1, le=50, description="Maximum recommendations")


class LearningPathRequest(BaseModel):
    """Request for learning path generation"""
    start_course_id: Optional[str] = None
    target_skill: str
    difficulty_progression: bool = Field(True, description="Progress from easy to hard")
    max_courses: int = Field(5, ge=1, le=10, description="Maximum courses in path")


class AISearchQuery(BaseModel):
    """AI semantic search query"""
    query: str = Field(..., min_length=1, description="Natural language search query")
    limit: int = Field(10, ge=1, le=50, description="Maximum results")


class AISearchResult(Course):
    """AI search result with similarity score"""
    similarity_score: float = Field(..., description="Cosine similarity score (0-1)")


class CrossDomainCourse(BaseModel):
    """Cross-domain course recommendation"""
    course: str = Field(..., description="Course name")
    id: str = Field(..., description="Course ID")
    url: HttpUrl = Field(..., description="Course URL")
    domain: str = Field(..., description="Inferred domain")
    rating: float = Field(..., description="Course rating")
    difficulty: str = Field(..., description="Difficulty level")
    similarity_score: float = Field(..., description="Semantic similarity (0-1)")
    skill_overlap: float = Field(..., description="Skill overlap ratio (0-1)")
    reason: str = Field(..., description="Explanation for cross-domain relevance")


class LearningPathResponse(BaseModel):
    """Structured learning path with cross-domain recommendations"""
    learning_path: Dict[str, List[AISearchResult]] = Field(
        ..., 
        description="Courses organized by difficulty: beginner, intermediate, advanced"
    )
    cross_domain_courses: List[CrossDomainCourse] = Field(
        default=[],
        description="Cross-domain courses that complement the learning path"
    )
    summary: Optional[Dict[str, Any]] = Field(
        None,
        description="Summary statistics about the learning path"
    )


class StatsResponse(BaseModel):
    """Database statistics"""
    total_courses: int
    total_universities: int
    total_skills: int
    total_relationships: int
    avg_rating: float
    top_skills: Optional[List[dict]] = []
    top_universities: Optional[List[dict]] = []
