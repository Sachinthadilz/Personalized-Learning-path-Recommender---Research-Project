"""
Configuration settings for the Course Knowledge Graph application
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """Application settings"""
    
    # Neo4j Configuration
    NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "password")
    
    # API Configuration
    API_TITLE: str = "Course Knowledge Graph API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = """
    API for querying and managing a knowledge graph of online courses.
    Provides recommendations, skill mapping, and learning path discovery.
    """
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8080"))
    API_RELOAD: bool = os.getenv("API_RELOAD", "True").lower() == "true"
    
    # Data Configuration
    DATA_PATH: str = "data/Coursera.csv"
    DATA_LIMIT: int = int(os.getenv("DATA_LIMIT", "0"))  # 0 = load all rows
    
    # Recommendation Settings
    MAX_RECOMMENDATIONS: int = 10
    MIN_SIMILARITY_SCORE: float = 0.3
    MAX_PATH_LENGTH: int = 5

settings = Settings()
