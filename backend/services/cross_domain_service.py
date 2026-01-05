"""
Cross-Domain Course Discovery Service
Identifies courses from different domains that share skills or concepts
"""
from typing import List, Dict, Any, Set
import logging

logger = logging.getLogger(__name__)


class CrossDomainService:
    """Service for discovering cross-domain learning opportunities"""
    
    # Domain classification based on common skills/keywords
    DOMAIN_KEYWORDS = {
        "Computer Science": [
            "programming", "python", "java", "javascript", "software", "algorithm",
            "data structure", "web development", "machine learning", "ai", "database",
            "sql", "cloud computing", "devops", "linux", "coding", "computer"
        ],
        "Business": [
            "business", "management", "marketing", "finance", "accounting", "leadership",
            "strategy", "entrepreneurship", "operations", "economics", "MBA", "sales",
            "business plan", "financial analysis", "project management"
        ],
        "Data Science": [
            "data science", "data analysis", "statistics", "analytics", "big data",
            "visualization", "tableau", "r programming", "pandas", "numpy", "data mining",
            "predictive modeling", "statistical analysis"
        ],
        "Engineering": [
            "engineering", "mechanical", "electrical", "civil", "chemical", "physics",
            "circuits", "thermodynamics", "materials", "systems", "design", "CAD"
        ],
        "Mathematics": [
            "mathematics", "calculus", "algebra", "linear algebra", "probability",
            "mathematical", "theorem", "geometry", "trigonometry", "discrete math"
        ],
        "Arts & Humanities": [
            "art", "music", "literature", "writing", "philosophy", "history",
            "creative", "design", "film", "media", "communication", "humanities"
        ],
        "Health & Medicine": [
            "health", "medicine", "medical", "healthcare", "nursing", "biology",
            "anatomy", "clinical", "public health", "epidemiology", "patient"
        ],
        "Social Sciences": [
            "psychology", "sociology", "anthropology", "political science", "economics",
            "social", "behavioral", "research methods", "survey"
        ]
    }
    
    @staticmethod
    def infer_domain(course: Dict[str, Any]) -> str:
        """
        Infer the domain of a course based on skills and description.
        
        Args:
            course: Course dictionary with skills and description
            
        Returns:
            Inferred domain name or "Other"
        """
        # Combine skills and description for analysis
        text_to_analyze = " ".join([
            " ".join(course.get('skills', [])),
            course.get('description', ''),
            course.get('name', '')
        ]).lower()
        
        # Count matches for each domain
        domain_scores = {}
        for domain, keywords in CrossDomainService.DOMAIN_KEYWORDS.items():
            score = sum(1 for keyword in keywords if keyword in text_to_analyze)
            if score > 0:
                domain_scores[domain] = score
        
        # Return domain with highest score
        if domain_scores:
            return max(domain_scores, key=domain_scores.get)
        return "Other"
    
    @staticmethod
    def calculate_skill_overlap(skills1: List[str], skills2: List[str]) -> float:
        """
        Calculate the proportion of overlapping skills between two courses.
        
        Args:
            skills1: List of skills from first course
            skills2: List of skills from second course
            
        Returns:
            Overlap score (0-1)
        """
        if not skills1 or not skills2:
            return 0.0
        
        set1 = set(s.lower() for s in skills1)
        set2 = set(s.lower() for s in skills2)
        
        intersection = len(set1 & set2)
        union = len(set1 | set2)
        
        if union == 0:
            return 0.0
        
        return intersection / union
    
    @staticmethod
    def get_cross_domain_courses(
        core_courses: List[Dict[str, Any]],
        all_search_results: List[Dict[str, Any]],
        limit: int = 3,
        min_similarity: float = 0.7,
        min_skill_overlap: float = 0.15
    ) -> List[Dict[str, Any]]:
        """
        Identify cross-domain courses that complement the core learning path.
        
        A cross-domain course must:
        1. Be from a different domain than the majority of core courses
        2. Have either:
           - Semantic similarity > min_similarity, OR
           - Skill overlap > min_skill_overlap
        
        Args:
            core_courses: Main courses in the learning path
            all_search_results: All available courses from search
            limit: Maximum number of cross-domain courses to return (default 3)
            min_similarity: Minimum similarity score for cross-domain match
            min_skill_overlap: Minimum skill overlap ratio
            
        Returns:
            List of cross-domain courses with explanations
        """
        try:
            if not core_courses or not all_search_results:
                return []
            
            # Identify domains of core courses
            core_domains = [CrossDomainService.infer_domain(c) for c in core_courses]
            primary_domain = max(set(core_domains), key=core_domains.count) if core_domains else "Other"
            
            # Collect all skills from core courses
            core_skills: Set[str] = set()
            for course in core_courses:
                core_skills.update(s.lower() for s in course.get('skills', []))
            
            # Find cross-domain candidates
            cross_domain_candidates = []
            
            for course in all_search_results:
                # Skip if already in core courses
                if course.get('id') in [c.get('id') for c in core_courses]:
                    continue
                
                # Check if from different domain
                course_domain = CrossDomainService.infer_domain(course)
                if course_domain == primary_domain:
                    continue
                
                # Calculate metrics
                similarity = course.get('similarity_score', 0.0)
                course_skills = course.get('skills', [])
                skill_overlap = CrossDomainService.calculate_skill_overlap(
                    list(core_skills), course_skills
                )
                
                # Check if meets criteria
                meets_similarity = similarity >= min_similarity
                meets_skill_overlap = skill_overlap >= min_skill_overlap
                
                if meets_similarity or meets_skill_overlap:
                    # Generate explanation
                    reason = CrossDomainService._generate_explanation(
                        course_domain, primary_domain, similarity, 
                        skill_overlap, course_skills, core_skills
                    )
                    
                    cross_domain_candidates.append({
                        "course": course.get('name'),
                        "id": course.get('id'),
                        "url": course.get('url'),
                        "domain": course_domain,
                        "rating": course.get('rating'),
                        "difficulty": course.get('difficulty'),
                        "similarity_score": similarity,
                        "skill_overlap": skill_overlap,
                        "reason": reason
                    })
            
            # Sort by combined score (similarity + skill overlap)
            cross_domain_candidates.sort(
                key=lambda x: x['similarity_score'] + x['skill_overlap'],
                reverse=True
            )
            
            # Return top matches
            result = cross_domain_candidates[:limit]
            
            logger.info(
                f"Found {len(result)} cross-domain courses "
                f"(primary domain: {primary_domain})"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error finding cross-domain courses: {e}")
            return []
    
    @staticmethod
    def _generate_explanation(
        course_domain: str,
        primary_domain: str,
        similarity: float,
        skill_overlap: float,
        course_skills: List[str],
        core_skills: Set[str]
    ) -> str:
        """
        Generate a human-readable explanation for why a course is cross-domain relevant.
        
        Args:
            course_domain: Domain of the candidate course
            primary_domain: Primary domain of core courses
            similarity: Semantic similarity score
            skill_overlap: Skill overlap ratio
            course_skills: Skills from candidate course
            core_skills: Skills from core courses
            
        Returns:
            Explanation string
        """
        # Find shared skills
        course_skills_lower = [s.lower() for s in course_skills]
        shared_skills = [s for s in course_skills_lower if s in core_skills]
        
        # Build explanation
        if skill_overlap > 0.3 and shared_skills:
            # High skill overlap
            skill_examples = ", ".join(shared_skills[:3])
            return f"Applies {primary_domain} concepts in {course_domain} context (shared: {skill_examples})"
        elif similarity > 0.8:
            # High semantic similarity
            return f"Highly relevant {course_domain} perspective on similar topics"
        elif shared_skills:
            # Some shared skills
            skill_examples = ", ".join(shared_skills[:2])
            return f"Complementary {course_domain} skills ({skill_examples})"
        else:
            # Based on similarity alone
            return f"Related {course_domain} concepts with transferable knowledge"
