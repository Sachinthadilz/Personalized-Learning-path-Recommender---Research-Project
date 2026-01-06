"""
Learner Profile Classification Service
Classifies students into learning profiles and predicts outcomes
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
import joblib
import os
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LearnerProfileService:
    """Service for learner profile classification and prediction"""
    
    # Learner profile types
    PROFILE_TYPES = {
        0: "Fast Learner",
        1: "Balanced",
        2: "Struggling",
        3: "Disengaged"
    }
    
    # Outcome types
    OUTCOME_TYPES = {
        0: "Pass",
        1: "Fail",
        2: "Distinction",
        3: "Withdrawn"
    }
    
    def __init__(self, model_path: str = "artifacts"):
        """
        Initialize the learner profile service
        
        Args:
            model_path: Path to the directory containing trained models
        """
        self.model_path = Path(model_path)
        self.profile_classifier = None
        self.outcome_predictor = None
        self.embedding_pipeline = None
        self.clustering_model = None
        self._load_models()
    
    def _load_models(self):
        """Load trained models from disk"""
        try:
            # Create model path if it doesn't exist
            if not self.model_path.exists():
                logger.warning(f"Model path {self.model_path} does not exist. Creating it...")
                self.model_path.mkdir(parents=True, exist_ok=True)
            
            # Try to load the learner profile classifier
            profile_model_file = self.model_path / "learner_profile_classifier.joblib"
            if profile_model_file.exists():
                self.profile_classifier = joblib.load(profile_model_file)
                logger.info(f"✓ Loaded learner profile classifier from {profile_model_file}")
            else:
                logger.warning(f"✗ Profile classifier not found at {profile_model_file}")
            
            # Try to load outcome predictor
            outcome_model_file = self.model_path / "outcome_predictor.joblib"
            if outcome_model_file.exists():
                self.outcome_predictor = joblib.load(outcome_model_file)
                logger.info(f"✓ Loaded outcome predictor from {outcome_model_file}")
            else:
                logger.warning(f"✗ Outcome predictor not found at {outcome_model_file}")
            
            # Try to load embedding pipeline
            embedding_file = self.model_path / "embedding_pipeline.joblib"
            if embedding_file.exists():
                self.embedding_pipeline = joblib.load(embedding_file)
                logger.info(f"✓ Loaded embedding pipeline from {embedding_file}")
            else:
                logger.info(f"ℹ Embedding pipeline not found at {embedding_file} (optional)")
            
            # Try to load clustering model
            clustering_file = self.model_path / "kmeans_clustering.joblib"
            if clustering_file.exists():
                self.clustering_model = joblib.load(clustering_file)
                logger.info(f"✓ Loaded clustering model from {clustering_file}")
            else:
                logger.info(f"ℹ Clustering model not found at {clustering_file} (optional)")
            
            # Log summary
            models_loaded = sum([
                self.profile_classifier is not None,
                self.outcome_predictor is not None,
                self.embedding_pipeline is not None,
                self.clustering_model is not None
            ])
            logger.info(f"📊 Loaded {models_loaded}/4 models successfully")
            
            if models_loaded == 0:
                logger.warning("⚠️  No models loaded! Please train models or place them in the artifacts directory.")
                
        except Exception as e:
            logger.error(f"❌ Error loading models: {e}")
            logger.info("Models will need to be trained before use")
    
    def engineer_features(self, student_data: Dict[str, Any]) -> pd.DataFrame:
        """
        Engineer features from student data matching OULAD training pipeline
        
        Args:
            student_data: Dictionary containing student information
            
        Returns:
            DataFrame with engineered features
        """
        features = {}
        
        # VLE Engagement metrics (primary features)
        features['total_clicks'] = student_data.get('total_clicks', 0)
        features['active_days'] = student_data.get('active_days', 0)
        features['avg_clicks_per_day'] = student_data.get('avg_clicks_per_day', 0)
        features['clicks_last_week'] = student_data.get('clicks_last_week', 0)
        
        # Calculate derived engagement metrics
        if features['active_days'] > 0:
            features['clicks_per_active_day'] = features['total_clicks'] / features['active_days']
        else:
            features['clicks_per_active_day'] = 0
        
        # Assessment performance
        features['avg_assessment_score'] = student_data.get('avg_assessment_score', 0)
        features['assessments_completed'] = student_data.get('assessments_completed', 0)
        features['late_submissions'] = student_data.get('late_submissions', 0)
        features['assessment_pass_rate'] = student_data.get('assessment_pass_rate', 0)
        
        # Demographics (categorical features - will be encoded by model pipeline)
        features['age_band'] = student_data.get('age_band', '0-35')
        features['gender'] = student_data.get('gender', 'M')
        features['disability'] = student_data.get('disability', 'N')
        features['highest_education'] = student_data.get('highest_education', 'A Level or Equivalent')
        features['region'] = student_data.get('region', 'Unknown')
        features['imd_band'] = student_data.get('imd_band', '50-75%')
        
        # Course engagement
        features['num_prev_attempts'] = student_data.get('num_prev_attempts', 0)
        features['studied_credits'] = student_data.get('studied_credits', 0)
        
        # Temporal features
        features['days_since_registration'] = student_data.get('days_since_registration', 0)
        features['engagement_trend'] = student_data.get('engagement_trend', 0)
        
        # Behavioral patterns
        features['weekend_activity_ratio'] = student_data.get('weekend_activity_ratio', 0)
        features['evening_activity_ratio'] = student_data.get('evening_activity_ratio', 0)
        features['days_inactive'] = student_data.get('days_inactive', 0)
        features['engagement_consistency'] = student_data.get('engagement_consistency', 0)
        
        # Resource usage patterns
        features['content_views'] = student_data.get('content_views', 0)
        features['resource_downloads'] = student_data.get('resource_downloads', 0)
        features['forum_posts'] = student_data.get('forum_posts', 0)
        features['quiz_attempts'] = student_data.get('quiz_attempts', 0)
        
        return pd.DataFrame([features])
    
    def classify_profile(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Classify student into a learner profile
        
        Args:
            student_data: Dictionary containing student information
            
        Returns:
            Dictionary with profile classification and confidence
        """
        if self.profile_classifier is None:
            return {
                'profile': 'Unknown',
                'confidence': 0.0,
                'error': 'Profile classifier not loaded'
            }
        
        try:
            # Engineer features
            features_df = self.engineer_features(student_data)
            
            # Predict profile
            profile_id = self.profile_classifier.predict(features_df)[0]
            probabilities = self.profile_classifier.predict_proba(features_df)[0]
            
            profile_name = self.PROFILE_TYPES.get(profile_id, 'Unknown')
            confidence = float(probabilities[profile_id])
            
            # Get all profile probabilities
            all_probabilities = {
                self.PROFILE_TYPES[i]: float(prob) 
                for i, prob in enumerate(probabilities)
            }
            
            return {
                'profile': profile_name,
                'profile_id': int(profile_id),
                'confidence': confidence,
                'all_probabilities': all_probabilities,
                'features_used': features_df.columns.tolist()
            }
            
        except Exception as e:
            logger.error(f"Error classifying profile: {e}")
            return {
                'profile': 'Unknown',
                'confidence': 0.0,
                'error': str(e)
            }
    
    def predict_outcome(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict student outcome
        
        Args:
            student_data: Dictionary containing student information
            
        Returns:
            Dictionary with outcome prediction and confidence
        """
        if self.outcome_predictor is None:
            return {
                'outcome': 'Unknown',
                'confidence': 0.0,
                'error': 'Outcome predictor not loaded'
            }
        
        try:
            # Engineer features
            features_df = self.engineer_features(student_data)
            
            # Predict outcome
            outcome_id = self.outcome_predictor.predict(features_df)[0]
            probabilities = self.outcome_predictor.predict_proba(features_df)[0]
            
            outcome_name = self.OUTCOME_TYPES.get(outcome_id, 'Unknown')
            confidence = float(probabilities[outcome_id])
            
            # Get all outcome probabilities
            all_probabilities = {
                self.OUTCOME_TYPES[i]: float(prob) 
                for i, prob in enumerate(probabilities)
            }
            
            # Determine risk level
            risk_level = self._calculate_risk_level(outcome_name, confidence)
            
            return {
                'outcome': outcome_name,
                'outcome_id': int(outcome_id),
                'confidence': confidence,
                'risk_level': risk_level,
                'all_probabilities': all_probabilities,
                'is_at_risk': risk_level in ['High', 'Very High']
            }
            
        except Exception as e:
            logger.error(f"Error predicting outcome: {e}")
            return {
                'outcome': 'Unknown',
                'confidence': 0.0,
                'error': str(e)
            }
    
    def _calculate_risk_level(self, outcome: str, confidence: float) -> str:
        """Calculate risk level based on predicted outcome"""
        if outcome in ['Fail', 'Withdrawn']:
            if confidence > 0.75:
                return 'Very High'
            elif confidence > 0.5:
                return 'High'
            else:
                return 'Moderate'
        elif outcome == 'Pass':
            if confidence < 0.4:
                return 'Moderate'
            else:
                return 'Low'
        else:  # Distinction
            return 'Very Low'
    
    def get_student_embedding(self, student_data: Dict[str, Any]) -> Optional[List[float]]:
        """
        Get student embedding using PCA
        
        Args:
            student_data: Dictionary containing student information
            
        Returns:
            List of embedding values or None
        """
        if self.embedding_pipeline is None:
            return None
        
        try:
            features_df = self.engineer_features(student_data)
            embedding = self.embedding_pipeline.transform(features_df)
            return embedding[0].tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return None
    
    def analyze_student(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Comprehensive student analysis
        
        Args:
            student_data: Dictionary containing student information
            
        Returns:
            Dictionary with complete analysis
        """
        # Get profile classification
        profile_result = self.classify_profile(student_data)
        
        # Get outcome prediction
        outcome_result = self.predict_outcome(student_data)
        
        # Get embedding
        embedding = self.get_student_embedding(student_data)
        
        # Generate recommendations based on profile and outcome
        recommendations = self._generate_recommendations(
            profile_result.get('profile'),
            outcome_result.get('outcome'),
            outcome_result.get('risk_level')
        )
        
        return {
            'student_id': student_data.get('student_id', 'unknown'),
            'profile': profile_result,
            'outcome': outcome_result,
            'embedding': embedding,
            'recommendations': recommendations,
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    def _generate_recommendations(
        self, 
        profile: str, 
        outcome: str, 
        risk_level: str
    ) -> List[Dict[str, str]]:
        """Generate personalized recommendations"""
        recommendations = []
        
        # Profile-based recommendations
        if profile == 'Fast Learner':
            recommendations.append({
                'type': 'course_difficulty',
                'message': 'Consider enrolling in Advanced level courses to challenge yourself',
                'priority': 'low'
            })
        elif profile == 'Struggling':
            recommendations.append({
                'type': 'support',
                'message': 'Beginner courses recommended with additional tutorial support',
                'priority': 'high'
            })
            recommendations.append({
                'type': 'engagement',
                'message': 'Set daily learning goals to improve engagement',
                'priority': 'high'
            })
        elif profile == 'Disengaged':
            recommendations.append({
                'type': 'intervention',
                'message': 'Immediate intervention needed - contact student advisor',
                'priority': 'critical'
            })
            recommendations.append({
                'type': 'engagement',
                'message': 'Interactive and project-based courses may improve engagement',
                'priority': 'high'
            })
        
        # Risk-based recommendations
        if risk_level in ['High', 'Very High']:
            recommendations.append({
                'type': 'early_warning',
                'message': 'Student is at high risk - schedule check-in meeting',
                'priority': 'critical'
            })
            recommendations.append({
                'type': 'course_load',
                'message': 'Consider reducing course load or providing additional support',
                'priority': 'high'
            })
        
        # Outcome-based recommendations
        if outcome == 'Withdrawn':
            recommendations.append({
                'type': 'retention',
                'message': 'High withdrawal risk - engage with retention team',
                'priority': 'critical'
            })
        
        return recommendations
    
    def get_similar_students(
        self, 
        student_data: Dict[str, Any], 
        all_students: List[Dict[str, Any]], 
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find similar students based on embeddings
        
        Args:
            student_data: Target student data
            all_students: List of all student data
            top_k: Number of similar students to return
            
        Returns:
            List of similar students with similarity scores
        """
        if self.embedding_pipeline is None:
            return []
        
        try:
            # Get target embedding
            target_embedding = np.array(self.get_student_embedding(student_data))
            
            # Get embeddings for all students
            similarities = []
            for other_student in all_students:
                if other_student.get('student_id') == student_data.get('student_id'):
                    continue
                
                other_embedding = np.array(self.get_student_embedding(other_student))
                
                # Calculate cosine similarity
                similarity = np.dot(target_embedding, other_embedding) / (
                    np.linalg.norm(target_embedding) * np.linalg.norm(other_embedding)
                )
                
                similarities.append({
                    'student': other_student,
                    'similarity': float(similarity)
                })
            
            # Sort by similarity and return top k
            similarities.sort(key=lambda x: x['similarity'], reverse=True)
            return similarities[:top_k]
            
        except Exception as e:
            logger.error(f"Error finding similar students: {e}")
            return []


# Global service instance
learner_profile_service = LearnerProfileService()
