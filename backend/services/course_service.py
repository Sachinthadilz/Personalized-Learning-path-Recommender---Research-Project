"""
Service layer for course-related operations
"""
from typing import List, Dict, Any, Optional
from database import neo4j_conn
from models import Course, CourseDetail
import logging

logger = logging.getLogger(__name__)


class CourseService:
    """Service for course operations"""
    
    @staticmethod
    def get_course_by_id(course_id: str) -> Optional[CourseDetail]:
        """Get detailed course information by ID"""
        query = """
        MATCH (c:Course {id: $course_id})
        OPTIONAL MATCH (c)-[:OFFERED_BY]->(u:University)
        OPTIONAL MATCH (c)-[:HAS_DIFFICULTY]->(d:DifficultyLevel)
        OPTIONAL MATCH (c)-[:TEACHES]->(s:Skill)
        RETURN c, u.name as university, d.level as difficulty, 
               collect(DISTINCT s.name) as skills
        """
        
        result = neo4j_conn.execute_query(query, {'course_id': course_id})
        
        if not result:
            return None
        
        record = result[0]
        course_data = record['c']
        
        return CourseDetail(
            id=course_data['id'],
            name=course_data['name'],
            description=course_data['description'],
            rating=course_data['rating'],
            url=course_data['url'],
            university=record['university'],
            difficulty=record['difficulty'],
            skills=record['skills']
        )
    
    @staticmethod
    def search_courses(
        query: str,
        skills: Optional[List[str]] = None,
        difficulty: Optional[str] = None,
        min_rating: Optional[float] = None,
        limit: int = 10
    ) -> List[Course]:
        """Search courses with filters"""
        
        # Build dynamic query
        cypher_query = """
        CALL db.index.fulltext.queryNodes('courseSearch', $query) 
        YIELD node as c, score
        OPTIONAL MATCH (c)-[:OFFERED_BY]->(u:University)
        OPTIONAL MATCH (c)-[:HAS_DIFFICULTY]->(d:DifficultyLevel)
        OPTIONAL MATCH (c)-[:TEACHES]->(s:Skill)
        """
        
        # Add filters
        where_clauses = []
        if difficulty:
            where_clauses.append("d.level = $difficulty")
        if min_rating:
            where_clauses.append("c.rating >= $min_rating")
        if skills:
            where_clauses.append("ANY(skill IN $skills WHERE skill IN collect(s.name))")
        
        if where_clauses:
            cypher_query += " WHERE " + " AND ".join(where_clauses)
        
        cypher_query += """
        RETURN c, u.name as university, d.level as difficulty, 
               collect(DISTINCT s.name) as skills, score
        ORDER BY score DESC, c.rating DESC
        LIMIT $limit
        """
        
        params = {
            'query': query + "~",  # Fuzzy search
            'limit': limit
        }
        
        if difficulty:
            params['difficulty'] = difficulty
        if min_rating:
            params['min_rating'] = min_rating
        if skills:
            params['skills'] = skills
        
        results = neo4j_conn.execute_query(cypher_query, params)
        
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
    def get_courses_by_skill(skill_name: str, limit: int = 10) -> List[Course]:
        """Get courses that teach a specific skill"""
        query = """
        MATCH (c:Course)-[:TEACHES]->(s:Skill)
        WHERE s.name CONTAINS $skill_name
        OPTIONAL MATCH (c)-[:OFFERED_BY]->(u:University)
        OPTIONAL MATCH (c)-[:HAS_DIFFICULTY]->(d:DifficultyLevel)
        OPTIONAL MATCH (c)-[:TEACHES]->(skill:Skill)
        RETURN c, u.name as university, d.level as difficulty,
               collect(DISTINCT skill.name) as skills
        ORDER BY c.rating DESC
        LIMIT $limit
        """
        
        results = neo4j_conn.execute_query(query, {
            'skill_name': skill_name,
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
    def get_all_courses(skip: int = 0, limit: int = 20) -> List[Course]:
        """Get all courses with pagination"""
        query = """
        MATCH (c:Course)
        OPTIONAL MATCH (c)-[:OFFERED_BY]->(u:University)
        OPTIONAL MATCH (c)-[:HAS_DIFFICULTY]->(d:DifficultyLevel)
        OPTIONAL MATCH (c)-[:TEACHES]->(s:Skill)
        RETURN c, u.name as university, d.level as difficulty,
               collect(DISTINCT s.name) as skills
        ORDER BY c.rating DESC
        SKIP $skip
        LIMIT $limit
        """
        
        results = neo4j_conn.execute_query(query, {'skip': skip, 'limit': limit})
        
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
