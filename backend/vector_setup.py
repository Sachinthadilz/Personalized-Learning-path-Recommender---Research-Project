"""
Script to generate and store vector embeddings for course descriptions in Neo4j
"""
import logging
from typing import List
from database import neo4j_conn
from embedding_service import embedding_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VectorIndexManager:
    """Manage vector embeddings in Neo4j"""
    
    def __init__(self):
        self.embedding_dimension = 384  # all-MiniLM-L6-v2 dimension
    
    def create_vector_index(self):
        """Create vector index in Neo4j for similarity search"""
        try:
            logger.info("Creating vector index in Neo4j...")
            
            # Drop existing index if it exists
            drop_query = """
            DROP INDEX course_description_vector IF EXISTS
            """
            neo4j_conn.execute_write(drop_query)
            
            # Create new vector index
            create_query = f"""
            CREATE VECTOR INDEX course_description_vector IF NOT EXISTS
            FOR (c:Course)
            ON c.descriptionEmbedding
            OPTIONS {{
                indexConfig: {{
                    `vector.dimensions`: {self.embedding_dimension},
                    `vector.similarity_function`: 'cosine'
                }}
            }}
            """
            neo4j_conn.execute_write(create_query)
            logger.info("Vector index created successfully")
            
        except Exception as e:
            logger.error(f"Error creating vector index: {e}")
            raise
    
    def get_courses_without_embeddings(self) -> List[dict]:
        """Get all courses that don't have embeddings yet"""
        query = """
        MATCH (c:Course)
        WHERE c.descriptionEmbedding IS NULL
        RETURN c.id as id, c.description as description
        ORDER BY c.id
        """
        
        result = neo4j_conn.execute_query(query)
        return result
    
    def update_course_embedding(self, course_id: str, embedding: List[float]):
        """Update a single course with its embedding"""
        query = """
        MATCH (c:Course {id: $course_id})
        SET c.descriptionEmbedding = $embedding
        """
        
        params = {
            'course_id': course_id,
            'embedding': embedding
        }
        
        neo4j_conn.execute_write(query, params)
    
    def generate_all_embeddings(self, batch_size: int = 50):
        """Generate embeddings for all courses in batches"""
        logger.info("Starting embedding generation for all courses...")
        
        # Get courses without embeddings
        courses = self.get_courses_without_embeddings()
        total_courses = len(courses)
        
        if total_courses == 0:
            logger.info("All courses already have embeddings!")
            return
        
        logger.info(f"Found {total_courses} courses without embeddings")
        
        # Process in batches
        for i in range(0, total_courses, batch_size):
            batch = courses[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (total_courses + batch_size - 1) // batch_size
            
            logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} courses)...")
            
            # Prepare texts
            texts = [course['description'] or '' for course in batch]
            
            # Generate embeddings for batch
            try:
                embeddings = embedding_service.generate_embeddings_batch(texts)
                
                # Update each course
                for course, embedding in zip(batch, embeddings):
                    self.update_course_embedding(course['id'], embedding)
                
                logger.info(f"Batch {batch_num}/{total_batches} completed")
                
            except Exception as e:
                logger.error(f"Error processing batch {batch_num}: {e}")
                continue
        
        logger.info(f"Successfully generated embeddings for {total_courses} courses!")
    
    def search_similar_courses(self, query: str, limit: int = 10) -> List[dict]:
        """
        Search for courses similar to the query using vector similarity
        """
        try:
            # Generate embedding for query
            query_embedding = embedding_service.generate_query_embedding(query)
            
            # Search using vector similarity
            search_query = """
            CALL db.index.vector.queryNodes(
                'course_description_vector',
                $limit,
                $query_embedding
            )
            YIELD node, score
            MATCH (node)-[:OFFERED_BY]->(u:University)
            MATCH (node)-[:HAS_DIFFICULTY]->(d:DifficultyLevel)
            OPTIONAL MATCH (node)-[:TEACHES]->(s:Skill)
            RETURN 
                node.id as id,
                node.name as name,
                node.description as description,
                node.url as url,
                node.rating as rating,
                u.name as university,
                d.level as difficulty,
                collect(DISTINCT s.name) as skills,
                score
            ORDER BY score DESC
            """
            
            params = {
                'query_embedding': query_embedding,
                'limit': limit
            }
            
            results = neo4j_conn.execute_query(search_query, params)
            return results
            
        except Exception as e:
            logger.error(f"Error searching courses: {e}")
            raise


def main():
    """Main function to set up and generate embeddings"""
    manager = VectorIndexManager()
    
    # Create vector index
    manager.create_vector_index()
    
    # Generate embeddings for all courses
    manager.generate_all_embeddings(batch_size=50)
    
    logger.info("Vector embedding setup complete!")


if __name__ == "__main__":
    main()
