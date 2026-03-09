"""
Pydantic models for API request/response schemas
"""
from pydantic import BaseModel, Field, HttpUrl, ConfigDict
from typing import List, Optional, Dict, Any
from enum import Enum


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
    max_courses: int = Field(5, ge=1, le=100, description="Maximum courses in path")


class AISearchQuery(BaseModel):
    """AI semantic search query"""
    query: str = Field(..., min_length=1, description="Natural language search query")
    limit: int = Field(10, ge=1, le=200, description="Maximum results")


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


# ============================================================================
# TIMETABLE PLANNER MODELS
# ============================================================================

from datetime import datetime
from pydantic import validator


class TimetableDailyAllocation(BaseModel):
    """Single subject allocation within a day"""
    subject_id: str
    subject_name: str
    planned_hours: float = Field(ge=0)
    completed_hours: float = Field(default=0.0, ge=0)
    status: str = Field(default="planned")  # planned | in_progress | completed | missed


class TimetableDay(BaseModel):
    """One day in a student's timetable"""
    student_id: str
    date: str                           # YYYY-MM-DD
    day_of_week: str
    total_hours_available: float = Field(ge=0, le=12)
    allocations: List[TimetableDailyAllocation]
    total_planned: float = Field(ge=0)
    total_completed: float = Field(default=0.0, ge=0)
    is_locked: bool = Field(default=False)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TimetableSubjectInput(BaseModel):
    """Subject supplied during timetable setup"""
    subject_id: str
    name: str
    credits: int = Field(ge=1, le=4)
    remaining_needed: float = Field(ge=0)


class TimetableGenerateRequest(BaseModel):
    """Body for POST /timetable/generate"""
    student_id: str
    name: str
    start_date: str
    end_date: str
    subjects: List[TimetableSubjectInput]
    hours_per_day: Dict[str, float] = Field(
        default_factory=lambda: {
            "Monday": 4, "Tuesday": 4, "Wednesday": 4,
            "Thursday": 4, "Friday": 3, "Saturday": 6, "Sunday": 6,
        }
    )


class TimetableCompletionUpdate(BaseModel):
    """Body for POST /timetable/update"""
    student_id: str
    date: str
    subject_id: str
    completed_hours: float = Field(ge=0)


class TimetableGetResponse(BaseModel):
    """Response for GET /timetable/{student_id}"""
    success: bool
    student_id: str
    count: int
    timetables: List[TimetableDay]
