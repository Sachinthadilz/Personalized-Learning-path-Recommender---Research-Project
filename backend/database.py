"""
Neo4j database connection and utilities
"""
from neo4j import GraphDatabase
from typing import List, Dict, Any, Optional
import logging
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Neo4jConnection:
    """Neo4j database connection manager"""
    
    def __init__(self):
        self.driver = None
        self.connect()
    
    def connect(self):
        """Establish connection to Neo4j"""
        try:
            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
            )
            self.driver.verify_connectivity()
            logger.info("Successfully connected to Neo4j")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            raise
    
    def close(self):
        """Close the database connection"""
        if self.driver:
            self.driver.close()
            logger.info("Neo4j connection closed")
    
    def execute_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict]:
        """
        Execute a Cypher query and return results
        
        Args:
            query: Cypher query string
            parameters: Query parameters
            
        Returns:
            List of result dictionaries
        """
        with self.driver.session() as session:
            result = session.run(query, parameters or {})
            return [dict(record) for record in result]
    
    def execute_write(self, query: str, parameters: Optional[Dict[str, Any]] = None):
        """
        Execute a write transaction
        
        Args:
            query: Cypher query string
            parameters: Query parameters
        """
        with self.driver.session() as session:
            session.execute_write(lambda tx: tx.run(query, parameters or {}))
    
    def create_indexes(self):
        """Create database indexes for better performance"""
        indexes = [
            "CREATE INDEX course_id IF NOT EXISTS FOR (c:Course) ON (c.id)",
            "CREATE INDEX course_name IF NOT EXISTS FOR (c:Course) ON (c.name)",
            "CREATE INDEX skill_name IF NOT EXISTS FOR (s:Skill) ON (s.name)",
            "CREATE INDEX university_name IF NOT EXISTS FOR (u:University) ON (u.name)",
            "CREATE FULLTEXT INDEX courseSearch IF NOT EXISTS FOR (c:Course) ON EACH [c.name, c.description]"
        ]
        
        for index_query in indexes:
            try:
                self.execute_write(index_query)
                logger.info(f"Created index: {index_query.split()[2]}")
            except Exception as e:
                logger.warning(f"Index creation warning: {e}")
    
    def clear_database(self):
        """Clear all nodes and relationships (use with caution!)"""
        query = "MATCH (n) DETACH DELETE n"
        self.execute_write(query)
        logger.info("Database cleared")


# Global connection instance
neo4j_conn = Neo4jConnection()
