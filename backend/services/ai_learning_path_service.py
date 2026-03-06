"""
AI-Powered Learning Path Service using Groq API
Generates intelligent, personalized learning paths based on user goals
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from typing import List, Optional, Dict, Any
from groq import Groq
import json
import logging
from database import neo4j_conn
from models import Course

# Ensure .env is loaded (supports running from backend/ or project root)
_backend_env = Path(__file__).parent.parent / ".env"
_root_env = Path(__file__).parent.parent.parent / ".env"
if _backend_env.exists():
    load_dotenv(_backend_env)
else:
    load_dotenv(_root_env)

logger = logging.getLogger(__name__)


class AILearningPathService:
    """Service for AI-powered learning path generation using Groq"""
    
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        self.client = Groq(api_key=self.api_key)
        self.model = "llama-3.3-70b-versatile"  # Groq's fast LLM
    
    def get_available_courses(self, target_skill: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch all courses related to the target skill from database"""
        query = """
        MATCH (c:Course)-[:TEACHES]->(s:Skill)
        WHERE toLower(s.name) CONTAINS toLower($target_skill)
           OR toLower(c.name) CONTAINS toLower($target_skill)
           OR toLower(c.description) CONTAINS toLower($target_skill)
        OPTIONAL MATCH (c)-[:OFFERED_BY]->(u:University)
        OPTIONAL MATCH (c)-[:HAS_DIFFICULTY]->(d:DifficultyLevel)
        OPTIONAL MATCH (c)-[:TEACHES]->(skill:Skill)
        WITH c, u.name as university, d.level as difficulty,
             collect(DISTINCT skill.name) as skills
        RETURN c.id as id, c.name as name, c.description as description,
               c.rating as rating, c.url as url, university, difficulty, skills
        ORDER BY c.rating DESC
        LIMIT $limit
        """
        
        try:
            results = neo4j_conn.execute_query(query, {
                'target_skill': target_skill,
                'limit': limit
            })
            
            courses = []
            for record in results:
                courses.append({
                    'id': record['id'],
                    'name': record['name'],
                    'description': record['description'][:200],  # Truncate for context
                    'rating': record['rating'],
                    'url': record['url'],
                    'university': record['university'],
                    'difficulty': record['difficulty'],
                    'skills': record['skills'][:5]  # Limit skills for context
                })
            
            logger.info(f"Found {len(courses)} courses for skill: {target_skill}")
            return courses
            
        except Exception as e:
            logger.error(f"Error fetching courses: {e}")
            return []
    
    def generate_ai_learning_path(
        self,
        target_skill: str,
        start_course_id: Optional[str] = None,
        max_courses: int = 100,
        user_background: Optional[str] = None
    ) -> List[Course]:
        """
        Use Groq AI to generate an intelligent learning path
        
        Args:
            target_skill: The skill the user wants to learn
            start_course_id: Optional starting course
            max_courses: Maximum courses to return
            user_background: Optional user background/experience level
        
        Returns:
            Ordered list of courses forming an optimal learning path
        """
        
        # Get available courses
        available_courses = self.get_available_courses(target_skill, limit=max_courses)
        
        if not available_courses:
            logger.warning(f"No courses found for skill: {target_skill}")
            return []
        
        # Prepare courses summary for AI
        courses_summary = json.dumps([{
            'id': c['id'],
            'name': c['name'],
            'difficulty': c['difficulty'] or 'Unknown',
            'rating': c['rating'],
            'university': c['university'],
            'skills': c['skills']
        } for c in available_courses], indent=2)
        
        # Create AI prompt
        background_context = f"\nUser Background: {user_background}" if user_background else "\nUser Background: Beginner (no prior experience)"
        
        prompt = f"""You are an expert learning path curator. Your task is to create an optimal learning path for someone who wants to master "{target_skill}".

{background_context}

Available Courses:
{courses_summary}

Instructions:
1. Analyze all courses and their difficulty levels
2. Create a progressive learning path from Beginner → Intermediate → Advanced
3. Consider course ratings (prefer higher rated courses)
4. Ensure smooth skill progression
5. Include courses from various universities for diverse perspectives
6. Return ONLY a JSON array of course IDs in the optimal learning order

Requirements:
- Start with beginner/foundational courses
- Progress to intermediate concepts
- End with advanced/specialized topics
- Include {min(len(available_courses), max_courses)} courses total
- Ensure diversity in difficulty levels

Return ONLY a JSON array like this:
["course_id_1", "course_id_2", "course_id_3", ...]

Do not include any other text or explanation. Only the JSON array.
"""

        try:
            # Call Groq AI
            logger.info(f"Calling Groq AI to generate learning path for: {target_skill}")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educational curriculum designer specializing in creating optimal learning paths. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # Lower temperature for more consistent results
                max_tokens=2000
            )
            
            ai_response = response.choices[0].message.content.strip()
            logger.info(f"AI Response received: {ai_response[:200]}...")
            
            # Parse AI response
            # Remove markdown code blocks if present
            if ai_response.startswith("```"):
                ai_response = ai_response.split("```")[1]
                if ai_response.startswith("json"):
                    ai_response = ai_response[4:]
            
            course_ids = json.loads(ai_response)
            
            # Validate response
            if not isinstance(course_ids, list):
                raise ValueError("AI response is not a list")
            
            logger.info(f"AI recommended {len(course_ids)} courses")
            
            # Build ordered course list
            # Create a map of course IDs to course data
            course_map = {c['id']: c for c in available_courses}
            
            ordered_courses = []
            for course_id in course_ids:
                if course_id in course_map:
                    course_data = course_map[course_id]
                    ordered_courses.append(Course(
                        id=course_data['id'],
                        name=course_data['name'],
                        description=course_data['description'],
                        rating=course_data['rating'],
                        url=course_data['url'],
                        university=course_data['university'],
                        difficulty=course_data['difficulty'],
                        skills=course_data['skills']
                    ))
            
            logger.info(f"Successfully generated AI learning path with {len(ordered_courses)} courses")
            return ordered_courses
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"AI Response was: {ai_response}")
            # Fallback: return courses ordered by difficulty and rating
            return self._fallback_learning_path(available_courses, max_courses)
            
        except Exception as e:
            logger.error(f"Error generating AI learning path: {e}")
            # Fallback: return courses ordered by difficulty and rating
            return self._fallback_learning_path(available_courses, max_courses)
    
    def _fallback_learning_path(self, available_courses: List[Dict], max_courses: int) -> List[Course]:
        """Fallback method if AI fails"""
        logger.info("Using fallback learning path generation")
        
        # Order by difficulty then rating
        difficulty_order = {"Beginner": 1, "Intermediate": 2, "Advanced": 3, "Conversant": 2}
        
        sorted_courses = sorted(
            available_courses,
            key=lambda c: (difficulty_order.get(c.get('difficulty'), 4), -c.get('rating', 0))
        )
        
        courses = []
        for course_data in sorted_courses[:max_courses]:
            courses.append(Course(
                id=course_data['id'],
                name=course_data['name'],
                description=course_data['description'],
                rating=course_data['rating'],
                url=course_data['url'],
                university=course_data['university'],
                difficulty=course_data['difficulty'],
                skills=course_data['skills']
            ))
        
        return courses


# Global instance
ai_learning_path_service = AILearningPathService()
