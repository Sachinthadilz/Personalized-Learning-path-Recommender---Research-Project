"""
Services initialization
"""
from .course_service import CourseService
from .recommendation_service import RecommendationService
from .stats_service import StatsService

__all__ = ['CourseService', 'RecommendationService', 'StatsService']
