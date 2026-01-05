"""
Learning Path Service - Organizes courses into structured learning paths
"""
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class LearningPathService:
    """Service for building structured learning paths from search results"""
    
    # Difficulty ordering
    DIFFICULTY_ORDER = {
        "Beginner": 1,
        "Intermediate": 2,
        "Advanced": 3,
        "Conversant": 2  # Treat Conversant as Intermediate level
    }
    
    DIFFICULTY_LABELS = {
        1: "beginner",
        2: "intermediate",
        3: "advanced"
    }
    
    @staticmethod
    def build_learning_path(search_results: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Organize search results into a structured learning path.
        
        Groups courses by difficulty level while preserving order within each group.
        
        Args:
            search_results: List of courses from semantic search (with similarity scores)
            
        Returns:
            Dictionary with keys: beginner, intermediate, advanced
            Each containing a list of courses in order of relevance
        """
        try:
            # Initialize groups
            grouped = {
                "beginner": [],
                "intermediate": [],
                "advanced": []
            }
            
            # Group courses by difficulty level
            for course in search_results:
                difficulty = course.get('difficulty', 'Intermediate')
                
                # Map to difficulty order
                order = LearningPathService.DIFFICULTY_ORDER.get(difficulty, 2)
                label = LearningPathService.DIFFICULTY_LABELS.get(order, "intermediate")
                
                # Add to appropriate group
                grouped[label].append(course)
            
            logger.info(
                f"Learning path built: {len(grouped['beginner'])} beginner, "
                f"{len(grouped['intermediate'])} intermediate, "
                f"{len(grouped['advanced'])} advanced courses"
            )
            
            return grouped
            
        except Exception as e:
            logger.error(f"Error building learning path: {e}")
            # Return empty groups on error
            return {
                "beginner": [],
                "intermediate": [],
                "advanced": []
            }
    
    @staticmethod
    def get_learning_path_summary(learning_path: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Get summary statistics for a learning path.
        
        Args:
            learning_path: Dictionary with beginner/intermediate/advanced course lists
            
        Returns:
            Summary dictionary with counts and metadata
        """
        total_courses = sum(len(courses) for courses in learning_path.values())
        
        return {
            "total_courses": total_courses,
            "beginner_count": len(learning_path.get("beginner", [])),
            "intermediate_count": len(learning_path.get("intermediate", [])),
            "advanced_count": len(learning_path.get("advanced", []))
        }
