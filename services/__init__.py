"""
Services initialization
"""
from .course_service import CourseService
from .recommendation_service import RecommendationService
from .stats_service import StatsService
from .learning_path_service import LearningPathService
from .cross_domain_service import CrossDomainService

__all__ = ['CourseService', 'RecommendationService', 'StatsService', 'LearningPathService', 'CrossDomainService']
