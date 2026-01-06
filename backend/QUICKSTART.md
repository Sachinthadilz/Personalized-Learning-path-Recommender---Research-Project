# Learner Profile Classifier - Quick Start Guide

## ✅ Prerequisites

You should have:
- ✓ Trained models in `backend/artifacts/` folder
- ✓ Python dependencies installed (`pip install -r requirements.txt`)
- ✓ Neo4j database running with course data

## 📦 Required Model Files

Place your trained models in `backend/artifacts/`:

```
backend/artifacts/
├── learner_profile_classifier.joblib   (Required)
├── outcome_predictor.joblib            (Required)
├── embedding_pipeline.joblib           (Optional)
└── kmeans_clustering.joblib            (Optional)
```

## 🚀 Start the Backend

```bash
cd backend
python main.py
```

You should see:
```
INFO:     Started server process
✓ Loaded learner profile classifier from artifacts/learner_profile_classifier.joblib
✓ Loaded outcome predictor from artifacts/outcome_predictor.joblib
📊 Loaded 2/4 models successfully
INFO:     Uvicorn running on http://127.0.0.1:5000
```

## 🧪 Test the Integration

### Option 1: Web Browser
Visit: http://127.0.0.1:5000/docs

### Option 2: Run Test Script
```bash
cd backend
python test_learner_api.py
```

### Option 3: cURL Command
```bash
# Check model status
curl http://127.0.0.1:5000/learner/model-status

# Analyze a student
curl -X POST http://127.0.0.1:5000/learner/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test_001",
    "total_clicks": 2500,
    "active_days": 75,
    "avg_clicks_per_day": 33.3,
    "avg_assessment_score": 78.5,
    "assessments_completed": 8,
    "age_band": "0-35",
    "gender": "M",
    "disability": "N",
    "highest_education": "A Level or Equivalent",
    "num_prev_attempts": 0,
    "studied_credits": 60,
    "days_since_registration": 90
  }'
```

## 📊 Sample Request & Response

**Request:**
```json
POST /learner/analyze

{
  "student_id": "student_123",
  "total_clicks": 2500,
  "active_days": 75,
  "avg_clicks_per_day": 33.3,
  "avg_assessment_score": 78.5,
  "assessments_completed": 8,
  "age_band": "0-35",
  "gender": "M",
  "num_prev_attempts": 0,
  "studied_credits": 60,
  "days_since_registration": 90
}
```

**Response:**
```json
{
  "student_id": "student_123",
  "profile": {
    "profile": "Balanced",
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
    "confidence": 0.82,
    "risk_level": "Low",
    "is_at_risk": false
  },
  "recommendations": [
    {
      "type": "course_difficulty",
      "message": "Continue with Intermediate level courses",
      "priority": "medium"
    }
  ]
}
```

## 🎯 Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/learner/model-status` | GET | Check loaded models |
| `/learner/analyze` | POST | Complete student analysis |
| `/learner/classify-profile` | POST | Profile classification only |
| `/learner/predict-outcome` | POST | Outcome prediction only |
| `/learner/batch-analyze` | POST | Analyze multiple students |
| `/learner/recommend-courses` | POST | Get profile-based course recommendations |

## 🔧 Troubleshooting

### Models Not Loading?

**Check artifacts directory:**
```bash
ls artifacts/
```

**Expected output:**
```
learner_profile_classifier.joblib
outcome_predictor.joblib
```

### Feature Mismatch Error?

If you get errors about missing features, your model expects different features than provided. 

**Solution:** Update `learner_profile_service.py` → `engineer_features()` method to match your training features.

### Import Errors?

```bash
pip install scikit-learn==1.5.2 joblib pandas numpy
```

## 📈 Integration with Course Recommendations

The system automatically combines learner profiles with course recommendations:

```python
# Student with "Struggling" profile gets:
# - Beginner level courses
# - High-rated courses (better instruction)
# - Additional support recommendations

# Student with "Fast Learner" profile gets:
# - Advanced level courses
# - Challenge-based courses
# - Optional enrichment suggestions
```

## 🎓 Profile Types

1. **Fast Learner** - High engagement + high performance
2. **Balanced** - Moderate engagement + good performance
3. **Struggling** - Low engagement + lower performance
4. **Disengaged** - Very low engagement

## 🚨 Risk Levels

- **Very Low** - Distinction predicted
- **Low** - Pass predicted (high confidence)
- **Moderate** - Uncertain or low-confidence pass
- **High** - Fail/Withdrawn predicted
- **Very High** - Fail/Withdrawn (>75% confidence)

## 📚 Full Documentation

See [LEARNER_PROFILE_INTEGRATION.md](../LEARNER_PROFILE_INTEGRATION.md) for complete API documentation.

## ✨ Next Steps

1. ✅ Test all endpoints using `test_learner_api.py`
2. 📱 Create frontend UI for student analysis
3. 📊 Store analysis results in Neo4j for tracking
4. 🔔 Set up alerts for at-risk students
5. 📈 Add historical trend analysis

---

**Need Help?** Check the API documentation at http://127.0.0.1:5000/docs
