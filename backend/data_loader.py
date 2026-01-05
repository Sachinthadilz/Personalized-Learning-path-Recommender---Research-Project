"""
Data loading and preprocessing utilities for importing courses into Neo4j
"""
import pandas as pd
import logging
from typing import List, Dict, Any
import hashlib
from database import neo4j_conn
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CourseDataLoader:
    """Load and import course data into Neo4j knowledge graph"""
    
    def __init__(self, csv_path: str = None):
        self.csv_path = csv_path or settings.DATA_PATH
        self.df = None
    
    def load_csv(self) -> pd.DataFrame:
        """Load and preprocess the CSV file"""
        logger.info(f"Loading data from {self.csv_path}")
        
        # Load CSV with optional row limit
        if settings.DATA_LIMIT > 0:
            self.df = pd.read_csv(self.csv_path, nrows=settings.DATA_LIMIT)
            logger.info(f"Loaded {len(self.df)} courses (limited to {settings.DATA_LIMIT} rows)")
        else:
            self.df = pd.read_csv(self.csv_path)
            logger.info(f"Loaded {len(self.df)} courses (all rows)")
        
        # Clean data - handle both old and new column names
        rating_col = 'rating' if 'rating' in self.df.columns else 'Course Rating'
        desc_col = 'description' if 'description' in self.df.columns else 'Course Description'
        skills_col = 'skills' if 'skills' in self.df.columns else 'Skills'
        
        self.df[rating_col] = pd.to_numeric(self.df[rating_col], errors='coerce')
        self.df = self.df.fillna({
            rating_col: 0.0,
            desc_col: '',
            skills_col: ''
        })
        
        return self.df
    
    def generate_course_id(self, course_name: str, university: str) -> str:
        """Generate a unique ID for a course"""
        unique_string = f"{course_name}_{university}"
        return hashlib.md5(unique_string.encode()).hexdigest()[:12]
    
    def parse_skills(self, skills_str: str) -> List[str]:
        """Parse the skills string into a list"""
        if not skills_str or pd.isna(skills_str):
            return []
        
        # Split by multiple delimiters and clean
        skills = [s.strip() for s in str(skills_str).split('  ')]
        skills = [s for s in skills if s and len(s) > 1]
        return list(set(skills))  # Remove duplicates
    
    def import_courses(self):
        """Import all courses into Neo4j"""
        if self.df is None:
            self.load_csv()
        
        logger.info("Starting course import...")
        
        # Detect column names (handle both old and new formats)
        name_col = 'course_name' if 'course_name' in self.df.columns else 'Course Name'
        uni_col = 'university' if 'university' in self.df.columns else 'University'
        skills_col = 'skills' if 'skills' in self.df.columns else 'Skills'
        
        for idx, row in self.df.iterrows():
            try:
                course_id = self.generate_course_id(
                    row[name_col], 
                    row[uni_col]
                )
                
                # Log current course being processed
                logger.info(f"[{idx + 1}/{len(self.df)}] Importing: {row[name_col]}")
                
                # Create course node
                self._create_course_node(row, course_id)
                
                # Create university and relationship
                self._create_university_relationship(row, course_id)
                
                # Create difficulty level and relationship
                self._create_difficulty_relationship(row, course_id)
                
                # Create skills and relationships
                skills = self.parse_skills(row[skills_col])
                self._create_skill_relationships(course_id, skills)
                    
            except Exception as e:
                logger.error(f"[{idx + 1}/{len(self.df)}] Error importing course: {e}")
                continue
        
        logger.info(f"Successfully imported {len(self.df)} courses")
    
    def _create_course_node(self, row: pd.Series, course_id: str):
        """Create a course node in Neo4j"""
        # Detect column names
        name_col = 'course_name' if 'course_name' in row.index else 'Course Name'
        url_col = 'url' if 'url' in row.index else 'Course URL'
        desc_col = 'description' if 'description' in row.index else 'Course Description'
        rating_col = 'rating' if 'rating' in row.index else 'Course Rating'
        
        query = """
        MERGE (c:Course {id: $course_id})
        SET c.name = $name,
            c.url = $url,
            c.description = $description,
            c.rating = $rating
        """
        
        params = {
            'course_id': course_id,
            'name': row[name_col],
            'url': row[url_col],
            'description': row[desc_col],
            'rating': float(row[rating_col]) if pd.notna(row[rating_col]) else 0.0
        }
        
        neo4j_conn.execute_write(query, params)
    
    def _create_university_relationship(self, row: pd.Series, course_id: str):
        """Create university node and relationship"""
        uni_col = 'university' if 'university' in row.index else 'University'
        
        query = """
        MATCH (c:Course {id: $course_id})
        MERGE (u:University {name: $university})
        MERGE (c)-[:OFFERED_BY]->(u)
        """
        
        params = {
            'course_id': course_id,
            'university': row[uni_col]
        }
        
        neo4j_conn.execute_write(query, params)
    
    def _create_difficulty_relationship(self, row: pd.Series, course_id: str):
        """Create difficulty level node and relationship"""
        diff_col = 'difficulty' if 'difficulty' in row.index else 'Difficulty Level'
        difficulty = row[diff_col]
        
        # Map difficulty to order
        difficulty_order = {
            'Beginner': 1,
            'Intermediate': 2,
            'Advanced': 3,
            'Conversant': 2  # Some courses have this level
        }
        
        query = """
        MATCH (c:Course {id: $course_id})
        MERGE (d:DifficultyLevel {level: $difficulty})
        ON CREATE SET d.order = $order
        MERGE (c)-[:HAS_DIFFICULTY]->(d)
        """
        
        params = {
            'course_id': course_id,
            'difficulty': difficulty,
            'order': difficulty_order.get(difficulty, 2)
        }
        
        neo4j_conn.execute_write(query, params)
    
    def _create_skill_relationships(self, course_id: str, skills: List[str]):
        """Create skill nodes and relationships"""
        for skill in skills:
            query = """
            MATCH (c:Course {id: $course_id})
            MERGE (s:Skill {name: $skill})
            MERGE (c)-[:TEACHES]->(s)
            """
            
            params = {
                'course_id': course_id,
                'skill': skill
            }
            
            neo4j_conn.execute_write(query, params)
    
    def create_skill_relationships(self):
        """Create relationships between related skills based on co-occurrence"""
        logger.info("Creating skill relationships...")
        
        query = """
        MATCH (c:Course)-[:TEACHES]->(s1:Skill)
        MATCH (c)-[:TEACHES]->(s2:Skill)
        WHERE s1 <> s2 AND elementId(s1) < elementId(s2)
        WITH s1, s2, COUNT(c) as co_occurrence
        WHERE co_occurrence >= 5
        MERGE (s1)-[r:RELATED_TO]-(s2)
        SET r.strength = co_occurrence
        """
        
        neo4j_conn.execute_write(query)
        logger.info("Skill relationships created")
    
    def compute_course_similarities(self):
        """Compute similarity between courses based on shared skills"""
        logger.info("Computing course similarities...")
        
        query = """
        MATCH (c1:Course)-[:TEACHES]->(s:Skill)<-[:TEACHES]-(c2:Course)
        WHERE c1 <> c2 AND elementId(c1) < elementId(c2)
        WITH c1, c2, COUNT(s) as common_skills
        WHERE common_skills >= 2
        MERGE (c1)-[r:SIMILAR_TO]-(c2)
        SET r.common_skills = common_skills
        """
        
        neo4j_conn.execute_write(query)
        logger.info("Course similarities computed")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics about the imported data"""
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
        
        return stats


def import_all_data():
    """Main function to import all data"""
    loader = CourseDataLoader()
    
    # Load CSV
    loader.load_csv()
    
    # Create indexes
    neo4j_conn.create_indexes()
    
    # Import courses
    loader.import_courses()
    
    # Create additional relationships
    loader.create_skill_relationships()
    loader.compute_course_similarities()
    
    # Print statistics
    stats = loader.get_statistics()
    logger.info("Import complete! Statistics:")
    for key, value in stats.items():
        logger.info(f"  {key}: {value}")


if __name__ == "__main__":
    import_all_data()
