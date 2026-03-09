"""
Pydantic models for API request/response schemas
"""
from pydantic import BaseModel, Field, HttpUrl, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
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


# ---------------------------------------------------------------------------
# Learner Profile Prediction schemas
# ---------------------------------------------------------------------------


class AutoLearnerProfileRequest(BaseModel):
    """
    Automatic learner profile prediction request.
    
    The system fetches student background data from OULAD CSV files and
    engagement features from activity logs automatically.
    
    **Two input modes:**
    
    1. **Browser extension mode** (recommended):
       Provide `course_id` (e.g., "ml-fundamentals") — automatically maps to OULAD fields
    
    2. **Direct OULAD mode**:
       Provide `code_module` and `code_presentation` directly
    
    At least one mode must be specified.
    """
    
    student_id: str = Field(
        ..., 
        description="OULAD student ID (id_student from CSV files)"
    )
    course_id: Optional[str] = Field(
        None,
        description="Browser extension course identifier (e.g., 'ml-fundamentals'). "
                    "Automatically mapped to OULAD code_module and code_presentation."
    )
    code_module: Optional[str] = Field(
        None,
        description="Direct OULAD module code (e.g., 'AAA', 'BBB'). "
                    "Used when course_id is not provided."
    )
    code_presentation: Optional[str] = Field(
        None,
        description="Direct OULAD presentation code (e.g., '2013J', '2014B'). "
                    "Used when course_id is not provided."
    )


class LearnerProfileRequest(BaseModel):
    """
    19-feature OULAD student input for the learner profile prediction pipeline.

    Categorical features
    --------------------
    gender              : Student gender, e.g. "M" or "F"
    region              : UK region, e.g. "London Region"
    highest_education   : Highest prior qualification, e.g. "HE Qualification"
    imd_band            : Index of Multiple Deprivation band, e.g. "90-100%"
    age_band            : Age group, e.g. "0-35", "35-55", "55<="
    disability          : Declared disability status, "Y" or "N"
    code_module         : OU module code, e.g. "AAA"
    code_presentation   : Module presentation, e.g. "2013J"

    Engagement / numerical features
    --------------------------------
    total_clicks            : Total VLE clicks across the module
    days_active             : Number of distinct days the student was active
    max_daily_clicks        : Peak single-day click count
    mean_daily_clicks       : Mean daily click count across active days
    early_clicks            : Clicks recorded in the first two weeks
    mean_score              : Mean assessment score (0–100)
    num_assessments         : Number of assessments submitted
    first_reg_before_start  : Days between registration and module start
    ever_unregistered       : 1 if the student ever un-registered, else 0
    num_of_prev_attempts    : Number of previous module attempts
    studied_credits         : Total credits studied concurrently
    """

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "gender": "M",
            "region": "London Region",
            "highest_education": "HE Qualification",
            "imd_band": "90-100%",
            "age_band": "0-35",
            "disability": "N",
            "code_module": "BBB",
            "code_presentation": "2014J",
            "total_clicks": 1200,
            "days_active": 45,
            "max_daily_clicks": 150,
            "mean_daily_clicks": 26.7,
            "early_clicks": 320,
            "mean_score": 68.5,
            "num_assessments": 5,
            "first_reg_before_start": 30,
            "ever_unregistered": 0,
            "num_of_prev_attempts": 0,
            "studied_credits": 60,
        }
    })

    # --- Categorical ---
    gender: str = Field(..., description="Student gender (e.g. 'M' or 'F')")
    region: str = Field(..., description="UK region (e.g. 'London Region')")
    highest_education: str = Field(..., description="Highest prior qualification")
    imd_band: str = Field(..., description="IMD deprivation band (e.g. '90-100%')")
    age_band: str = Field(..., description="Age group ('0-35', '35-55', '55<=')")
    disability: str = Field(..., description="Disability status ('Y' or 'N')")
    code_module: str = Field(..., description="OU module code (e.g. 'AAA')")
    code_presentation: str = Field(..., description="Module presentation code (e.g. '2013J')")

    # --- Numerical ---
    total_clicks: int = Field(..., ge=0, description="Total VLE clicks across the module")
    days_active: int = Field(..., ge=0, description="Distinct days the student was active")
    max_daily_clicks: int = Field(..., ge=0, description="Peak single-day click count")
    mean_daily_clicks: float = Field(..., ge=0.0, description="Mean daily clicks on active days")
    early_clicks: int = Field(..., ge=0, description="VLE clicks in the first two weeks")
    mean_score: float = Field(..., ge=0.0, le=100.0, description="Mean assessment score (0–100)")
    num_assessments: int = Field(..., ge=0, description="Number of assessments submitted")
    first_reg_before_start: int = Field(..., description="Days between registration and module start")
    ever_unregistered: int = Field(..., ge=0, le=1, description="1 if ever un-registered, else 0")
    num_of_prev_attempts: int = Field(..., ge=0, description="Previous module attempts")
    studied_credits: int = Field(..., ge=0, description="Credits studied concurrently")


class LearnerProfileResponse(BaseModel):
    """
    Structured prediction result from the three-stage learner profile pipeline.
    """

    learner_profile: str = Field(
        ...,
        description=(
            "Predicted learner profile cluster: "
            "'Balanced learners', 'Disengaged learners', "
            "'Fast learners', or 'Struggling learners'"
        ),
    )
    profile_confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score for the profile prediction (0–1)",
    )
    predicted_outcome: str = Field(
        ...,
        description=(
            "Predicted academic outcome: "
            "'Distinction', 'Pass', 'Fail', or 'Withdrawn'"
        ),
    )
    outcome_confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score for the outcome prediction (0–1)",
    )
    risk_prediction: str = Field(
        ...,
        description="Early warning assessment: 'At-Risk' or 'Not At-Risk'",
    )
    risk_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Risk score (0–1); higher values indicate greater risk",
    )
    learning_path_recommendation: Dict[str, Any] = Field(
        default={},
        description="Recommended learning track and actions based on predicted outcome",
    )


# ============================================================================
# TIMETABLE PLANNER MODELS
# ============================================================================


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
