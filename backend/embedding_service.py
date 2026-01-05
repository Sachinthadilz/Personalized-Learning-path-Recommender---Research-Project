"""
Vector embedding service using Groq API
"""
import os
from typing import List
import logging
from groq import Groq
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating embeddings using Groq API"""
    
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        self.client = Groq(api_key=self.api_key)
        # Groq uses different models - we'll use their text generation for embeddings
        # Note: Groq primarily offers LLM inference, not dedicated embedding models
        # For production, consider using sentence-transformers locally or OpenAI embeddings
        self.embedding_dimension = 384  # Standard for sentence-transformers
        
    def generate_embedding_locally(self, text: str) -> List[float]:
        """
        Generate embeddings using sentence-transformers (local)
        This is more reliable than using Groq for embeddings
        """
        try:
            from sentence_transformers import SentenceTransformer
            
            # Use cached model
            if not hasattr(self, 'model'):
                logger.info("Loading sentence-transformer model...")
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("Model loaded successfully")
            
            # Generate embedding
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
            
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batch
        """
        try:
            from sentence_transformers import SentenceTransformer
            
            if not hasattr(self, 'model'):
                logger.info("Loading sentence-transformer model...")
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("Model loaded successfully")
            
            # Generate embeddings in batch (more efficient)
            embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
            return embeddings.tolist()
            
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            raise
    
    def generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for a search query
        """
        return self.generate_embedding_locally(query)


# Global instance
embedding_service = EmbeddingService()
