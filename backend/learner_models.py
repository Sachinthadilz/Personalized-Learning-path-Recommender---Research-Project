"""
Pydantic models for learner profile API
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime


class StudentDataInput(BaseModel):
    """Input data for student analysis - matches OULAD dataset features"""
    model_config = ConfigDict(from_attributes=True)
    
    student_id: str = Field(..., description="Unique student identifier")
    
    # VLE Engagement metrics (primary features from OULAD)
    total_clicks: int = Field(0, ge=0, description="Total VLE clicks")
    active_days: int = Field(0, ge=0, description="Number of active days")
    avg_clicks_per_day: float = Field(0.0, ge=0, description="Average clicks per day")
    clicks_last_week: int = Field(0, ge=0, description="Clicks in last 7 days")
    clicks_per_active_day: Optional[float] = Field(None, ge=0, description="Clicks per active day")
    
    # Assessment performance
    avg_assessment_score: float = Field(0.0, ge=0, le=100, description="Average assessment score")
    assessments_completed: int = Field(0, ge=0, description="Assessments completed")
    late_submissions: int = Field(0, ge=0, description="Number of late submissions")
    assessment_pass_rate: float = Field(0.0, ge=0, le=1, description="Assessment pass rate")
    
    # Demographics (from OULAD studentInfo.csv)
    age_band: str = Field("0-35", description="Age range (0-35, 35-55, 55<=)")
    gender: str = Field("M", description="Gender (M/F)")
    disability: str = Field("N", description="Has disability (Y/N)")
    highest_education: str = Field(
        "A Level or Equivalent", 
        description="Highest education level"
    )
    region: Optional[str] = Field("Unknown", description="Geographic region")
    imd_band: Optional[str] = Field("50-75%", description="Index of Multiple Deprivation band")
    
    # Course engagement
    num_prev_attempts: int = Field(0, ge=0, description="Previous course attempts")
    studied_credits: int = Field(0, ge=0, description="Total credits studied")
    
    # Temporal features
    days_since_registration: int = Field(0, ge=0, description="Days since enrolled")
    engagement_trend: float = Field(0.0, description="Engagement trend (positive/negative)")
    days_inactive: Optional[int] = Field(0, ge=0, description="Days with no activity")
    
    # Behavioral patterns (optional but recommended)
    weekend_activity_ratio: Optional[float] = Field(0.0, ge=0, le=1, description="Weekend activity ratio")
    evening_activity_ratio: Optional[float] = Field(0.0, ge=0, le=1, description="Evening activity ratio")
    engagement_consistency: Optional[float] = Field(0.0, ge=0, description="Engagement consistency score")
    
    # Resource usage patterns (optional)
    content_views: Optional[int] = Field(0, ge=0, description="Content page views")
    resource_downloads: Optional[int] = Field(0, ge=0, description="Resource downloads")
    forum_posts: Optional[int] = Field(0, ge=0, description="Forum participation")
    quiz_attempts: Optional[int] = Field(0, ge=0, description="Quiz attempts")


class ProfileClassification(BaseModel):
    """Learner profile classification result"""
    profile: str = Field(..., description="Classified profile type")
    profile_id: int = Field(..., description="Profile numeric ID")
    confidence: float = Field(..., ge=0, le=1, description="Classification confidence")
    all_probabilities: Dict[str, float] = Field(
        ..., 
        description="Probabilities for all profiles"
    )
    features_used: Optional[List[str]] = Field(None, description="Features used")
    error: Optional[str] = Field(None, description="Error message if any")


class OutcomePrediction(BaseModel):
    """Student outcome prediction result"""
    outcome: str = Field(..., description="Predicted outcome")
    outcome_id: int = Field(..., description="Outcome numeric ID")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence")
    risk_level: str = Field(..., description="Risk level (Low/Moderate/High/Very High)")
    is_at_risk: bool = Field(..., description="Whether student is at risk")
    all_probabilities: Dict[str, float] = Field(
        ..., 
        description="Probabilities for all outcomes"
    )
    error: Optional[str] = Field(None, description="Error message if any")


class Recommendation(BaseModel):
    """Single recommendation"""
    type: str = Field(..., description="Recommendation type")
    message: str = Field(..., description="Recommendation message")
    priority: str = Field(..., description="Priority level")


class StudentAnalysis(BaseModel):
    """Complete student analysis result"""
    student_id: str = Field(..., description="Student identifier")
    profile: ProfileClassification = Field(..., description="Profile classification")
    outcome: OutcomePrediction = Field(..., description="Outcome prediction")
    embedding: Optional[List[float]] = Field(None, description="Student embedding vector")
    recommendations: List[Recommendation] = Field(
        ..., 
        description="Personalized recommendations"
    )
    analysis_timestamp: str = Field(..., description="Analysis timestamp")


class BatchAnalysisRequest(BaseModel):
    """Request for batch student analysis"""
    students: List[StudentDataInput] = Field(
        ..., 
        min_length=1, 
        max_length=100,
        description="List of students to analyze"
    )


class BatchAnalysisResponse(BaseModel):
    """Response for batch analysis"""
    results: List[StudentAnalysis] = Field(..., description="Analysis results")
    total_processed: int = Field(..., description="Total students processed")
    processing_time: float = Field(..., description="Processing time in seconds")


class SimilarStudent(BaseModel):
    """Similar student with similarity score"""
    student_id: str = Field(..., description="Student identifier")
    profile: str = Field(..., description="Student profile")
    outcome: str = Field(..., description="Student outcome")
    similarity: float = Field(..., ge=0, le=1, description="Similarity score")


class CourseRecommendationForProfile(BaseModel):
    """Course recommendation tailored to learner profile"""
    course_id: str
    course_name: str
    university: str
    difficulty: str
    rating: float
    match_score: float = Field(..., description="How well course matches profile")
    reasoning: str = Field(..., description="Why this course is recommended")


class ProfileBasedRecommendationRequest(BaseModel):
    """Request for profile-based course recommendations"""
    student_data: StudentDataInput
    preferred_difficulty: Optional[str] = None
    max_recommendations: int = Field(10, ge=1, le=50)


class ProfileBasedRecommendationResponse(BaseModel):
    """Response with courses recommended based on learner profile"""
    student_profile: str
    risk_level: str
    recommended_courses: List[CourseRecommendationForProfile]
    general_recommendations: List[Recommendation]


class LearnerProfileStats(BaseModel):
    """Statistics about learner profiles in the system"""
    total_students: int
    profile_distribution: Dict[str, int]
    outcome_distribution: Dict[str, int]
    avg_risk_levels: Dict[str, float]
    at_risk_count: int
    at_risk_percentage: float
