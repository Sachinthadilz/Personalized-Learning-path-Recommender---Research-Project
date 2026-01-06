# Learner Profile Classifier Integration Guide

## 🎯 Overview

The learner profile classifier has been successfully integrated into the Course Knowledge Graph backend. This system analyzes student data to:

1. **Classify learner profiles** (Fast Learner, Balanced, Struggling, Disengaged)
2. **Predict outcomes** (Pass, Fail, Distinction, Withdrawn)
3. **Assess risk levels** (Very Low → Very High)
4. **Generate personalized recommendations**
5. **Recommend courses** based on learner profiles

---

## 📁 New Files Added

### Backend Components

1. **`backend/learner_profile_service.py`**
   - Core service for profile classification and outcome prediction
   - Feature engineering from student data
   - Risk assessment and recommendation generation
   - Student embedding generation using PCA

2. **`backend/learner_models.py`**
   - Pydantic models for learner profile API
   - Input/output schemas for all endpoints
   - Type definitions for student data and analysis results

3. **`backend/train_learner_models.py`**
   - Training script for mock models (for demonstration)
   - Replace with your actual OULAD training pipeline
   - Creates: profile classifier, outcome predictor, embedding pipeline, clustering model

### Modified Files

1. **`backend/models.py`** - Added imports for learner models
2. **`backend/main.py`** - Added 6 new endpoints for learner profile functionality

---

## 🚀 Setup Instructions

### 1. Create Artifacts Directory

```bash
cd backend
mkdir artifacts
```

### 2. Train Models (Initial Setup)

**Option A: Use Mock Models (Quick Start)**
```bash
python train_learner_models.py
```

This creates demonstration models. Output:
```
✅ All models saved to artifacts/
Models created:
  - learner_profile_classifier.joblib
  - outcome_predictor.joblib
  - embedding_pipeline.joblib
  - kmeans_clustering.joblib
```

**Option B: Use Your OULAD Models**

Copy your trained models to `backend/artifacts/`:
- `learner_profile_classifier.joblib`
- `outcome_predictor.joblib`
- `embedding_pipeline.joblib` (optional)
- `kmeans_clustering.joblib` (optional)

### 3. Start the Backend

```bash
python main.py
```

The API will now include learner profile endpoints at `http://127.0.0.1:5000`

---

## 📡 API Endpoints

### 1. Analyze Student (Complete Analysis)

**POST** `/learner/analyze`

Comprehensive analysis including profile, outcome, risk, and recommendations.

```json
{
  "student_id": "student_123",
  "total_clicks": 2500,
  "active_days": 75,
  "avg_clicks_per_day": 33.3,
  "clicks_last_week": 250,
  "avg_assessment_score": 78.5,
  "assessments_completed": 8,
  "late_submissions": 1,
  "age_band": "0-35",
  "gender": "M",
  "disability": "N",
  "highest_education": "A Level or Equivalent",
  "num_prev_attempts": 0,
  "studied_credits": 60,
  "days_since_registration": 90,
  "engagement_trend": 0.5
}
```

**Response:**
```json
{
  "student_id": "student_123",
  "profile": {
    "profile": "Balanced",
    "profile_id": 1,
    "confidence": 0.85,
    "all_probabilities": {
      "Fast Learner": 0.12,
      "Balanced": 0.85,
      "Struggling": 0.02,
      "Disengaged": 0.01
    }
  },
  "outcome": {
    "outcome": "Pass",
    "outcome_id": 0,
    "confidence": 0.82,
    "risk_level": "Low",
    "is_at_risk": false,
    "all_probabilities": {
      "Pass": 0.82,
      "Fail": 0.05,
      "Distinction": 0.10,
      "Withdrawn": 0.03
    }
  },
  "embedding": [0.12, -0.45, 0.78, 0.23, -0.11],
  "recommendations": [
    {
      "type": "course_difficulty",
      "message": "Continue with Intermediate level courses",
      "priority": "medium"
    }
  ],
  "analysis_timestamp": "2026-01-06T12:00:00"
}
```

### 2. Classify Profile Only

**POST** `/learner/classify-profile`

Returns only the learner profile classification.

### 3. Predict Outcome Only

**POST** `/learner/predict-outcome`

Returns only the outcome prediction and risk assessment.

### 4. Batch Analysis

**POST** `/learner/batch-analyze`

Analyze multiple students efficiently:

```json
{
  "students": [
    { "student_id": "student_1", ... },
    { "student_id": "student_2", ... }
  ]
}
```

### 5. Get Profile-Based Course Recommendations

**POST** `/learner/recommend-courses`

Get personalized course recommendations based on learner profile:

```json
{
  "student_data": {
    "student_id": "student_123",
    ...
  },
  "preferred_difficulty": "Intermediate",
  "max_recommendations": 10
}
```

**Response:**
```json
{
  "student_profile": "Balanced",
  "risk_level": "Low",
  "recommended_courses": [
    {
      "course_id": "abc123",
      "course_name": "Python for Data Science",
      "university": "University of Michigan",
      "difficulty": "Intermediate",
      "rating": 4.7,
      "match_score": 0.92,
      "reasoning": "Matches Balanced profile; High ratings indicate quality"
    }
  ],
  "general_recommendations": [...]
}
```

### 6. Check Model Status

**GET** `/learner/model-status`

Check which models are loaded:

```json
{
  "profile_classifier_loaded": true,
  "outcome_predictor_loaded": true,
  "embedding_pipeline_loaded": true,
  "clustering_model_loaded": true,
  "available_profiles": ["Fast Learner", "Balanced", "Struggling", "Disengaged"],
  "available_outcomes": ["Pass", "Fail", "Distinction", "Withdrawn"]
}
```

---

## 🎓 Learner Profile Types

1. **Fast Learner**
   - High engagement (60+ clicks/day)
   - High performance (70+% average score)
   - Recommendations: Advanced courses, challenging content

2. **Balanced**
   - Moderate engagement (30-60 clicks/day)
   - Good performance (50-70% average score)
   - Recommendations: Intermediate courses, steady progression

3. **Struggling**
   - Low engagement (<20 clicks/day)
   - Lower performance (<60% average score)
   - Recommendations: Beginner courses, additional support, tutorials

4. **Disengaged**
   - Very low engagement
   - Recommendations: Intervention needed, interactive courses

---

## 📊 Risk Levels

- **Very Low**: Distinction outcome predicted with high confidence
- **Low**: Pass outcome predicted with high confidence
- **Moderate**: Uncertain outcome or low-confidence pass
- **High**: Fail/Withdrawn predicted with moderate confidence
- **Very High**: Fail/Withdrawn predicted with high confidence (>75%)

---

## 🔗 Integration with Existing Features

### Combined with Course Recommendations

The system now provides **intelligent course matching**:

1. Analyzes student profile and risk level
2. Matches courses based on:
   - Appropriate difficulty level
   - Student's learning style
   - Performance history
   - Engagement patterns
3. Provides reasoning for each recommendation

### Example Workflow

```python
# 1. Student logs in
student_data = get_student_data(student_id)

# 2. Analyze profile
POST /learner/analyze
# Returns: Profile = "Struggling", Risk = "High"

# 3. Get tailored course recommendations
POST /learner/recommend-courses
# Returns: Beginner courses with high ratings + support recommendations

# 4. Student searches for ML courses
POST /ai-search with query="machine learning"
# System filters results based on profile (Beginner level prioritized)
```

---

## 🧪 Testing the Integration

### Test with cURL

```bash
# Check model status
curl http://127.0.0.1:5000/learner/model-status

# Analyze a student
curl -X POST http://127.0.0.1:5000/learner/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test_001",
    "total_clicks": 1500,
    "active_days": 50,
    "avg_clicks_per_day": 30,
    "clicks_last_week": 200,
    "avg_assessment_score": 65,
    "assessments_completed": 5,
    "late_submissions": 2,
    "age_band": "0-35",
    "gender": "F",
    "disability": "N",
    "highest_education": "A Level or Equivalent",
    "num_prev_attempts": 0,
    "studied_credits": 30,
    "days_since_registration": 60,
    "engagement_trend": 0.3
  }'
```

### Test with Python

```python
import requests

url = "http://127.0.0.1:5000/learner/analyze"
student_data = {
    "student_id": "test_001",
    "total_clicks": 1500,
    "active_days": 50,
    # ... other fields
}

response = requests.post(url, json=student_data)
print(response.json())
```

---

## 🔄 Replacing with Your OULAD Models

To use your actual trained models from the OULAD dataset:

1. **Train your models** using your existing pipeline (from `learnerprofile.ipynb`)

2. **Save models** with these names:
   ```python
   import joblib
   
   # Your trained models
   joblib.dump(profile_classifier, 'artifacts/learner_profile_classifier.joblib')
   joblib.dump(outcome_predictor, 'artifacts/outcome_predictor.joblib')
   joblib.dump(embedding_pipeline, 'artifacts/embedding_pipeline.joblib')
   joblib.dump(kmeans_model, 'artifacts/kmeans_clustering.joblib')
   ```

3. **Update feature engineering** in `learner_profile_service.py` if your features differ

4. **Restart the backend** - models will auto-load on startup

---

## 📈 Next Steps

### Frontend Integration (Coming Soon)

Create a new tab in the frontend:

```typescript
// New component: LearnerAnalysisTab.tsx
- Student data input form
- Real-time profile classification
- Risk level visualization
- Personalized course recommendations display
```

### Enhanced Features

1. **Historical Tracking**
   - Store student analyses in Neo4j
   - Track profile changes over time
   - Monitor risk level trends

2. **Intervention Triggers**
   - Automatic alerts for at-risk students
   - Email notifications to advisors
   - Suggested support resources

3. **Comparative Analytics**
   - Compare student with similar profiles
   - Success patterns analysis
   - Peer learning recommendations

---

## 📚 Documentation

- **API Docs**: http://127.0.0.1:5000/docs
- **Code Documentation**: See docstrings in `learner_profile_service.py`
- **Model Details**: Check `train_learner_models.py` for training pipeline

---

## 🐛 Troubleshooting

**Models not loading?**
```bash
# Check if artifacts directory exists
ls artifacts/

# Train mock models
python train_learner_models.py

# Check model status
curl http://127.0.0.1:5000/learner/model-status
```

**Import errors?**
```bash
# Install additional dependencies
pip install scikit-learn joblib
```

**Feature mismatch?**
- Ensure your input data matches the feature list in `engineer_features()`
- Update the method if you have different OULAD features

---

## ✅ Validation Checklist

- [ ] Models trained and saved in `artifacts/`
- [ ] Backend starts without errors
- [ ] `/learner/model-status` shows all models loaded
- [ ] Test API call to `/learner/analyze` succeeds
- [ ] Profile classification returns valid profile type
- [ ] Outcome prediction returns valid outcome
- [ ] Course recommendations integrate profile data
- [ ] Documentation reviewed

---

**Questions or Issues?**
Check the API documentation at `/docs` or review the inline code comments in the service files.
