"""
Training script for learner profile classifier models
This creates mock models for demonstration. Replace with your actual training pipeline.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.pipeline import Pipeline
import joblib
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_mock_training_data(n_samples: int = 1000):
    """
    Create mock training data for demonstration
    
    In production, replace this with your actual OULAD data loading
    """
    np.random.seed(42)
    
    # Generate synthetic features
    data = {
        # VLE Engagement
        'total_clicks': np.random.randint(0, 5000, n_samples),
        'active_days': np.random.randint(0, 100, n_samples),
        'avg_clicks_per_day': np.random.uniform(0, 100, n_samples),
        'clicks_last_week': np.random.randint(0, 500, n_samples),
        
        # Assessment performance
        'avg_assessment_score': np.random.uniform(0, 100, n_samples),
        'assessments_completed': np.random.randint(0, 10, n_samples),
        'late_submissions': np.random.randint(0, 5, n_samples),
        
        # Course engagement
        'num_prev_attempts': np.random.randint(0, 3, n_samples),
        'studied_credits': np.random.randint(0, 120, n_samples),
        'days_since_registration': np.random.randint(0, 365, n_samples),
        'engagement_trend': np.random.uniform(-1, 1, n_samples),
    }
    
    df = pd.DataFrame(data)
    
    # Generate synthetic labels
    # Profile: based on engagement and performance
    profile_labels = []
    for _, row in df.iterrows():
        if row['avg_clicks_per_day'] > 60 and row['avg_assessment_score'] > 70:
            profile_labels.append(0)  # Fast Learner
        elif row['avg_clicks_per_day'] > 30 and row['avg_assessment_score'] > 50:
            profile_labels.append(1)  # Balanced
        elif row['avg_clicks_per_day'] < 20 and row['avg_assessment_score'] < 60:
            profile_labels.append(2)  # Struggling
        else:
            profile_labels.append(3)  # Disengaged
    
    # Outcome: based on performance and engagement
    outcome_labels = []
    for _, row in df.iterrows():
        if row['avg_assessment_score'] > 80:
            outcome_labels.append(2)  # Distinction
        elif row['avg_assessment_score'] > 50:
            outcome_labels.append(0)  # Pass
        elif row['total_clicks'] < 100:
            outcome_labels.append(3)  # Withdrawn
        else:
            outcome_labels.append(1)  # Fail
    
    df['profile'] = profile_labels
    df['outcome'] = outcome_labels
    
    return df


def train_models():
    """Train and save all learner profile models"""
    
    # Create artifacts directory
    artifacts_dir = Path("artifacts")
    artifacts_dir.mkdir(exist_ok=True)
    
    logger.info("Generating training data...")
    df = create_mock_training_data(n_samples=2000)
    
    # Prepare features
    feature_cols = [col for col in df.columns if col not in ['profile', 'outcome']]
    X = df[feature_cols]
    y_profile = df['profile']
    y_outcome = df['outcome']
    
    logger.info(f"Training with {len(X)} samples and {len(feature_cols)} features")
    
    # 1. Train Profile Classifier
    logger.info("Training profile classifier...")
    profile_classifier = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    profile_classifier.fit(X, y_profile)
    joblib.dump(profile_classifier, artifacts_dir / "learner_profile_classifier.joblib")
    logger.info(f"Profile classifier accuracy: {profile_classifier.score(X, y_profile):.3f}")
    
    # 2. Train Outcome Predictor
    logger.info("Training outcome predictor...")
    outcome_predictor = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    outcome_predictor.fit(X, y_outcome)
    joblib.dump(outcome_predictor, artifacts_dir / "outcome_predictor.joblib")
    logger.info(f"Outcome predictor accuracy: {outcome_predictor.score(X, y_outcome):.3f}")
    
    # 3. Create Embedding Pipeline (PCA)
    logger.info("Creating embedding pipeline...")
    embedding_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('pca', PCA(n_components=5, random_state=42))
    ])
    embedding_pipeline.fit(X)
    joblib.dump(embedding_pipeline, artifacts_dir / "embedding_pipeline.joblib")
    logger.info(f"PCA explained variance: {sum(embedding_pipeline.named_steps['pca'].explained_variance_ratio_):.3f}")
    
    # 4. Train Clustering Model
    logger.info("Training clustering model...")
    X_embedded = embedding_pipeline.transform(X)
    clustering_model = KMeans(n_clusters=4, random_state=42, n_init=10)
    clustering_model.fit(X_embedded)
    joblib.dump(clustering_model, artifacts_dir / "kmeans_clustering.joblib")
    logger.info(f"Clustering inertia: {clustering_model.inertia_:.2f}")
    
    logger.info(f"\n✅ All models saved to {artifacts_dir}/")
    logger.info("Models created:")
    logger.info("  - learner_profile_classifier.joblib")
    logger.info("  - outcome_predictor.joblib")
    logger.info("  - embedding_pipeline.joblib")
    logger.info("  - kmeans_clustering.joblib")
    
    return True


if __name__ == "__main__":
    logger.info("Starting model training...")
    train_models()
    logger.info("Training complete!")
