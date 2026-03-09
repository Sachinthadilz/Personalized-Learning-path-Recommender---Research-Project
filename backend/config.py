"""
Configuration settings for the Course Knowledge Graph application
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend dir first, then fall back to project root
_backend_env = Path(__file__).parent / ".env"
_root_env = Path(__file__).parent.parent / ".env"
if _backend_env.exists():
    load_dotenv(_backend_env)
else:
    load_dotenv(_root_env)

class Settings:
    """Application settings"""
    
    # Neo4j Configuration
    NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "password")

    # MongoDB — Activity Log database (same Atlas cluster as auth)
    MONGODB_ACTIVITY_URI: str = os.getenv("MONGODB_ACTIVITY_URI", "mongodb+srv://sachinthadilshan:abcd1234@itppro1.d6u6lyh.mongodb.net")
    MONGODB_ACTIVITY_DB: str  = os.getenv("MONGODB_ACTIVITY_DB",  "leaner-auth")
    MONGODB_ACTIVITY_COL: str = os.getenv("MONGODB_ACTIVITY_COL", "activity_logs")

    # Redis — Activity event queue
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # API Configuration
    API_TITLE: str = "Course Knowledge Graph API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = """
    API for querying and managing a knowledge graph of online courses.
    Provides recommendations, skill mapping, and learning path discovery.
    """
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "5000"))
    API_RELOAD: bool = os.getenv("API_RELOAD", "True").lower() == "true"
    
    # Data Configuration
    DATA_PATH: str = "data/processed/coursera_cleaned.csv"
    DATA_LIMIT: int = int(os.getenv("DATA_LIMIT", "0").split("#")[0].strip())  # 0 = load all rows
    
    # Recommendation Settings
    MAX_RECOMMENDATIONS: int = 10
    MIN_SIMILARITY_SCORE: float = 0.3
    MAX_PATH_LENGTH: int = 5

    # ── Timetable Planner ─────────────────────────────────────────────────────
    TIMETABLE_MODEL_PATH:    str = os.getenv("TIMETABLE_MODEL_PATH",    "models/timetable_model.pkl")
    TIMETABLE_SCALER_PATH:   str = os.getenv("TIMETABLE_SCALER_PATH",   "models/feature_scaler.pkl")
    TIMETABLE_ENCODER_PATH:  str = os.getenv("TIMETABLE_ENCODER_PATH",  "models/day_encoder.pkl")
    TIMETABLE_METADATA_PATH: str = os.getenv("TIMETABLE_METADATA_PATH", "models/model_metadata.json")

settings = Settings()
