"""
AI-powered semantic search service using vector embeddings
"""
from typing import List, Dict, Any
from vector_setup import VectorIndexManager
import logging

logger = logging.getLogger(__name__)


class AISearchService:
    """Service for AI-powered semantic search"""
    
    def __init__(self):
        self.vector_manager = VectorIndexManager()
    
    @staticmethod
    def semantic_search(query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Perform semantic search using vector embeddings
        """
        try:
            manager = VectorIndexManager()
            results = manager.search_similar_courses(query, limit)
            
            # Format results
            courses = []
            for result in results:
                course = {
                    'id': result['id'],
                    'name': result['name'],
                    'description': result['description'],
                    'url': result['url'],
                    'rating': float(result['rating']) if result['rating'] else 0.0,
                    'university': result['university'],
                    'difficulty': result['difficulty'],
                    'skills': [s for s in result['skills'] if s],
                    'similarity_score': float(result['score'])
                }
                courses.append(course)
            
            return courses
            
        except Exception as e:
            logger.error(f"Error in semantic search: {e}")
            raise
