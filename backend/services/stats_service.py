"""
Service for skill and university statistics
"""
from typing import List, Dict, Any
from database import neo4j_conn
from models import Skill, University
import logging

logger = logging.getLogger(__name__)


class StatsService:
    """Service for statistics and analytics"""
    
    @staticmethod
    def get_all_skills(limit: int = 100) -> List[Skill]:
        """Get all skills sorted by popularity"""
        query = """
        MATCH (s:Skill)<-[:TEACHES]-(c:Course)
        WITH s, COUNT(c) as course_count
        RETURN s.name as name, course_count
        ORDER BY course_count DESC
        LIMIT $limit
        """
        
        results = neo4j_conn.execute_query(query, {'limit': limit})
        
        skills = []
        for record in results:
            skills.append(Skill(
                name=record['name'],
                course_count=record['course_count']
            ))
        
        return skills
    
    @staticmethod
    def get_related_skills(skill_name: str, limit: int = 10) -> List[str]:
        """Get skills related to a given skill"""
        query = """
        MATCH (s1:Skill {name: $skill_name})-[:RELATED_TO]-(s2:Skill)
        RETURN s2.name as name
        ORDER BY s2.name
        LIMIT $limit
        """
        
        results = neo4j_conn.execute_query(query, {
            'skill_name': skill_name,
            'limit': limit
        })
        
        return [record['name'] for record in results]
    
    @staticmethod
    def get_all_universities(limit: int = 100) -> List[University]:
        """Get all universities with course counts"""
        query = """
        MATCH (u:University)<-[:OFFERED_BY]-(c:Course)
        WITH u, COUNT(c) as course_count, AVG(c.rating) as avg_rating
        RETURN u.name as name, course_count, avg_rating
        ORDER BY course_count DESC
        LIMIT $limit
        """
        
        results = neo4j_conn.execute_query(query, {'limit': limit})
        
        universities = []
        for record in results:
            universities.append(University(
                name=record['name'],
                course_count=record['course_count'],
                avg_rating=round(record['avg_rating'], 2) if record['avg_rating'] else 0
            ))
        
        return universities
    
    @staticmethod
    def get_database_stats() -> Dict[str, Any]:
        """Get overall database statistics"""
        stats = {}
        
        # Count nodes
        queries = {
            'total_courses': "MATCH (c:Course) RETURN count(c) as count",
            'total_universities': "MATCH (u:University) RETURN count(u) as count",
            'total_skills': "MATCH (s:Skill) RETURN count(s) as count",
            'total_relationships': "MATCH ()-[r]->() RETURN count(r) as count"
        }
        
        for key, query in queries.items():
            result = neo4j_conn.execute_query(query)
            stats[key] = result[0]['count'] if result else 0
        
        # Average rating
        avg_rating_query = "MATCH (c:Course) RETURN AVG(c.rating) as avg_rating"
        avg_result = neo4j_conn.execute_query(avg_rating_query)
        stats['avg_rating'] = round(avg_result[0]['avg_rating'], 2) if avg_result and avg_result[0]['avg_rating'] else 0.0
        
        # Top 10 skills
        top_skills_query = """
        MATCH (s:Skill)<-[:TEACHES]-(c:Course)
        WITH s, COUNT(c) as course_count
        RETURN s.name as skill, course_count
        ORDER BY course_count DESC
        LIMIT 10
        """
        skill_results = neo4j_conn.execute_query(top_skills_query)
        stats['top_skills'] = [
            {'name': r['skill'], 'course_count': r['course_count']}
            for r in skill_results
        ]
        
        # Top 10 universities
        top_unis_query = """
        MATCH (u:University)<-[:OFFERED_BY]-(c:Course)
        WITH u, COUNT(c) as course_count, AVG(c.rating) as avg_rating
        RETURN u.name as university, course_count, 
               round(avg_rating * 10) / 10.0 as avg_rating
        ORDER BY course_count DESC
        LIMIT 10
        """
        uni_results = neo4j_conn.execute_query(top_unis_query)
        stats['top_universities'] = [
            {'name': r['university'], 'course_count': r['course_count']}
            for r in uni_results
        ]
        
        return stats
