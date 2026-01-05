"""
Service for generating course recommendations
"""
from typing import List, Optional
from database import neo4j_conn
from models import Course
import logging

logger = logging.getLogger(__name__)


class RecommendationService:
    """Service for course recommendations"""
    
    @staticmethod
    def get_similar_courses(course_id: str, limit: int = 10) -> List[Course]:
        """Get courses similar to a given course based on shared skills"""
        query = """
        MATCH (c:Course {id: $course_id})-[:TEACHES]->(s:Skill)
        MATCH (similar:Course)-[:TEACHES]->(s)
        WHERE similar.id <> $course_id
        WITH similar, COUNT(DISTINCT s) as common_skills
        OPTIONAL MATCH (similar)-[:OFFERED_BY]->(u:University)
        OPTIONAL MATCH (similar)-[:HAS_DIFFICULTY]->(d:DifficultyLevel)
        OPTIONAL MATCH (similar)-[:TEACHES]->(skill:Skill)
        WITH similar, common_skills, u, d, collect(DISTINCT skill.name) as skills
        RETURN similar as c, u.name as university, d.level as difficulty, 
               skills, common_skills
        ORDER BY common_skills DESC, similar.rating DESC
        LIMIT $limit
        """
        
        results = neo4j_conn.execute_query(query, {
            'course_id': course_id,
            'limit': limit
        })
        
        courses = []
        for record in results:
            course_data = record['c']
            courses.append(Course(
                id=course_data['id'],
                name=course_data['name'],
                description=course_data['description'],
                rating=course_data['rating'],
                url=course_data['url'],
                university=record['university'],
                difficulty=record['difficulty'],
                skills=record['skills']
            ))
        
        return courses
    
    @staticmethod
    def get_courses_by_skills(
        skills: List[str],
        difficulty: Optional[str] = None,
        limit: int = 10
    ) -> List[Course]:
        """Recommend courses based on desired skills"""
        query = """
        MATCH (c:Course)-[:TEACHES]->(s:Skill)
        WHERE s.name IN $skills
        """
        
        if difficulty:
            query += """
            MATCH (c)-[:HAS_DIFFICULTY]->(d:DifficultyLevel {level: $difficulty})
            """
        
        query += """
        WITH c, COUNT(DISTINCT s) as skill_matches
        OPTIONAL MATCH (c)-[:OFFERED_BY]->(u:University)
        OPTIONAL MATCH (c)-[:HAS_DIFFICULTY]->(d:DifficultyLevel)
        OPTIONAL MATCH (c)-[:TEACHES]->(skill:Skill)
        RETURN c, u.name as university, d.level as difficulty,
               collect(DISTINCT skill.name) as skills, skill_matches
        ORDER BY skill_matches DESC, c.rating DESC
        LIMIT $limit
        """
        
        params = {'skills': skills, 'limit': limit}
        if difficulty:
            params['difficulty'] = difficulty
        
        results = neo4j_conn.execute_query(query, params)
        
        courses = []
        for record in results:
            course_data = record['c']
            courses.append(Course(
                id=course_data['id'],
                name=course_data['name'],
                description=course_data['description'],
                rating=course_data['rating'],
                url=course_data['url'],
                university=record['university'],
                difficulty=record['difficulty'],
                skills=record['skills']
            ))
        
        return courses
    
    @staticmethod
    def get_popular_courses(limit: int = 10) -> List[Course]:
        """Get most popular courses by rating and connection count"""
        query = """
        MATCH (c:Course)
        OPTIONAL MATCH (c)-[:TEACHES]->(s:Skill)
        WITH c, COUNT(s) as skill_count
        OPTIONAL MATCH (c)-[:OFFERED_BY]->(u:University)
        OPTIONAL MATCH (c)-[:HAS_DIFFICULTY]->(d:DifficultyLevel)
        OPTIONAL MATCH (c)-[:TEACHES]->(skill:Skill)
        RETURN c, u.name as university, d.level as difficulty,
               collect(DISTINCT skill.name) as skills, skill_count
        ORDER BY c.rating DESC, skill_count DESC
        LIMIT $limit
        """
        
        results = neo4j_conn.execute_query(query, {'limit': limit})
        
        courses = []
        for record in results:
            course_data = record['c']
            courses.append(Course(
                id=course_data['id'],
                name=course_data['name'],
                description=course_data['description'],
                rating=course_data['rating'],
                url=course_data['url'],
                university=record['university'],
                difficulty=record['difficulty'],
                skills=record['skills']
            ))
        
        return courses
    
    @staticmethod
    def get_learning_path(
        target_skill: str,
        start_course_id: Optional[str] = None,
        max_courses: int = 5
    ) -> List[Course]:
        """Generate a learning path to acquire a target skill"""
        
        if start_course_id:
            # Path from specific course to target skill
            query = """
            MATCH (start:Course {id: $start_course_id})
            MATCH (target:Skill {name: $target_skill})
            MATCH path = shortestPath((start)-[:TEACHES|SIMILAR_TO*1..6]-(c:Course)-[:TEACHES]->(target))
            WITH nodes(path) as nodes
            UNWIND nodes as node
            WITH node WHERE node:Course
            MATCH (node)-[:OFFERED_BY]->(u:University)
            OPTIONAL MATCH (node)-[:HAS_DIFFICULTY]->(d:DifficultyLevel)
            OPTIONAL MATCH (node)-[:TEACHES]->(s:Skill)
            RETURN DISTINCT node as c, u.name as university, d.level as difficulty,
                   collect(DISTINCT s.name) as skills
            LIMIT $max_courses
            """
            params = {
                'start_course_id': start_course_id,
                'target_skill': target_skill,
                'max_courses': max_courses
            }
        else:
            # Find best progression to target skill
            query = """
            MATCH (c:Course)-[:TEACHES]->(s:Skill {name: $target_skill})
            MATCH (c)-[:HAS_DIFFICULTY]->(d:DifficultyLevel)
            OPTIONAL MATCH (c)-[:OFFERED_BY]->(u:University)
            OPTIONAL MATCH (c)-[:TEACHES]->(skill:Skill)
            RETURN c, u.name as university, d.level as difficulty,
                   collect(DISTINCT skill.name) as skills, d.order as diff_order
            ORDER BY d.order ASC, c.rating DESC
            LIMIT $max_courses
            """
            params = {
                'target_skill': target_skill,
                'max_courses': max_courses
            }
        
        results = neo4j_conn.execute_query(query, params)
        
        courses = []
        for record in results:
            course_data = record['c']
            courses.append(Course(
                id=course_data['id'],
                name=course_data['name'],
                description=course_data['description'],
                rating=course_data['rating'],
                url=course_data['url'],
                university=record['university'],
                difficulty=record['difficulty'],
                skills=record['skills']
            ))
        
        return courses
