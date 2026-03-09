# Learner Profile Component — Complete Documentation

## 🎯 Overview

The **Learner Profile Component** is a comprehensive **3-stage ML prediction pipeline** that analyzes student behavior, demographics, and academic performance to provide:

1. **Learner Profile Classification** — categorizes students into behavioral clusters
2. **Academic Outcome Prediction** — forecasts final grade/completion status
3. **Early Warning Detection** — identifies at-risk students requiring intervention

The system uses **19 OULAD (Open University Learning Analytics Dataset) features** and returns personalized learning track recommendations with actionable interventions.

---

## 🏗️ Architecture

### 3-Stage ML Pipeline

```
Input (19 features) → Stage 1: Profile → Stage 2: Outcome → Stage 3: Risk → Response
                         ↓                   ↓                  ↓
                    Clustering         Gradient Boost     Early Warning
                    Classifier         Classification       Classifier
```

### Models Loaded (Artifacts)

- `profile_classifier.joblib` — learner profile (required)
- `best_model_pipeline.joblib` — outcome prediction (primary)
- `GradientBoosting_pipeline.joblib` — outcome prediction (fallback)
- `early_warning_pipeline.joblib` — risk assessment (has rule-based fallback)
- `learning_path_recommendations.json` — intervention mapping

**Location:** `backend/services/learner_profile_service.py`

---

## 📊 Input Features (19 OULAD Features)

### Categorical Features (8 fields)

| Feature | Description | Example Values |
|---------|-------------|----------------|
| `gender` | Student gender | `"M"`, `"F"` |
| `region` | UK region | `"London Region"`, `"Scotland"` |
| `highest_education` | Highest qualification | `"HE Qualification"`, `"A Level or Equivalent"` |
| `imd_band` | Deprivation index band | `"90-100%"` (least deprived) to `"0-10%"` (most deprived) |
| `age_band` | Age group | `"0-35"`, `"35-55"`, `"55<="` |
| `disability` | Declared disability | `"Y"`, `"N"` |
| `code_module` | OU module code | `"AAA"`, `"BBB"`, `"CCC"`, `"DDD"`, etc. |
| `code_presentation` | Module semester | `"2013B"`, `"2013J"`, `"2014B"`, `"2014J"` |

### Numerical Features — Engagement (7 fields)

| Feature | Description | Range | Source |
|---------|-------------|-------|--------|
| `total_clicks` | Total VLE clicks across module | ≥ 0 | Activity logs |
| `days_active` | Distinct days with at least 1 click | ≥ 0 | Activity logs |
| `max_daily_clicks` | Peak single-day click count | ≥ 0 | Activity logs |
| `mean_daily_clicks` | Average clicks per active day | ≥ 0.0 | **Auto-calculated** from total ÷ days |
| `early_clicks` | Clicks in first 2 weeks | ≥ 0 | Activity logs |
| `num_assessments` | Number of assessments submitted | ≥ 0 | Assessment records |
| `first_reg_before_start` | Days between registration and start | Any int | Negative = late registration |

### Numerical Features — Academic (4 fields)

| Feature | Description | Range |
|---------|-------------|-------|
| `mean_score` | Mean assessment score | 0–100 |
| `ever_unregistered` | Ever un-registered flag | 0 or 1 |
| `num_of_prev_attempts` | Previous module attempts | ≥ 0 |
| `studied_credits` | Total concurrent credits | ≥ 0 |

**Source:** OULAD `studentInfo`, `studentVle`, `studentAssessment` tables

---

## 🧠 Stage 1: Learner Profile Classification

**Model:** `profile_classifier.joblib` (KMeans-based supervised classifier)

**Output:** 4 learner profile clusters

| Profile | Description | Characteristics |
|---------|-------------|-----------------|
| **Balanced Learners** | Consistent, well-rounded engagement | Moderate clicks, steady assessment scores |
| **Disengaged Learners** | Low VLE interaction, poor outcomes | Low `total_clicks`, `early_clicks` < 200 |
| **Fast Learners** | High early engagement, quick mastery | High `early_clicks`, high `mean_score` |
| **Struggling Learners** | High effort, below-average results | High clicks but low assessment scores |

### Training Process

Notebook: `notebooks/05_learnerprofile.ipynb`

1. KMeans clustering (n_clusters=4) on feature embeddings
2. Manual cluster labeling based on engagement/performance metrics
3. RandomForest/GradientBoost supervised classifier trained on labeled clusters

**Confidence:** `max(predict_proba)` — highest class probability

---

## 🎓 Stage 2: Academic Outcome Prediction

**Model:** `best_model_pipeline.joblib` (GradientBoost with preprocessing pipeline)

**Output:** 4 academic outcomes

| Outcome | Description | Typical Features |
|---------|-------------|------------------|
| **Distinction** | Top grade (70%+) | `mean_score` > 70, high engagement |
| **Pass** | Passing grade (40–69%) | Moderate engagement, `mean_score` 40–70 |
| **Fail** | Failed module | `mean_score` < 40, low assessments |
| **Withdrawn** | Dropped out before completion | Very low `days_active`, `total_clicks` < 500 |

### Pipeline Components

- Categorical encoding (OneHotEncoder)
- Numerical scaling (StandardScaler)
- GradientBoostingClassifier with tuned hyperparameters

**Fallback:** If `best_model_pipeline.joblib` fails to load, uses `GradientBoosting_pipeline.joblib`

**Confidence:** `max(predict_proba)`

---

## ⚠️ Stage 3: Early Warning / At-Risk Detection

**Model:** `early_warning_pipeline.joblib` (XGBoost binary classifier)

**Output:** Binary risk classification

| Risk Prediction | Risk Score | Intervention Priority |
|-----------------|------------|----------------------|
| **Not At-Risk** | < 0.5 | Low — routine monitoring |
| **At-Risk** | ≥ 0.5 | High — immediate support |

### Risk Factors (Thresholds)

- `total_clicks` < 500
- `days_active` < 15
- `mean_score` < 40.0

### Rule-Based Fallback

If XGBoost model fails, uses threshold-based scoring:

```python
risk_points = (total_clicks < 500) + (days_active < 15) + (mean_score < 40)
risk_score = risk_points / 3
risk_label = "At-Risk" if risk_score >= 0.5 else "Not At-Risk"
```

**Confidence:** `risk_score` (0–1 scale)

---

## 📚 Learning Path Recommendations

**Source:** `backend/artifacts/learning_path_recommendations.json`

Maps each **predicted outcome** to a structured intervention plan:

| Outcome | Learning Path | Alert Level | Intervention |
|---------|---------------|-------------|--------------|
| **Distinction** | Advanced Track | None | Enrichment (extension modules, peer mentoring) |
| **Pass** | Standard Track | Low | Encouragement (checkpoints, optional exercises) |
| **Fail** | Supported Track | High | Academic Support (tutor meetings, study plans) |
| **Withdrawn** | Re-engagement Track | **Critical** | Retention & Welfare (48h contact, barrier identification) |

### JSON Structure

Each recommendation includes:

- `profile` — learner type label
- `description` — contextual explanation
- `learning_path` — pathway name
- `actions` — 5–6 specific intervention steps
- `alert_level` — escalation priority (`"None"`, `"Low"`, `"High"`, `"Critical"`)
- `intervention` — category label

### Example: "Withdrawn" Recommendation

```json
{
  "profile": "Disengaged Learner",
  "description": "Low LMS engagement and academic participation. High withdrawal risk.",
  "learning_path": "Re-engagement Track",
  "actions": [
    "Initiate welfare check — contact student directly within 48 hours",
    "Assign a dedicated personal tutor / advisor for regular contact",
    "Offer flexible study options (recorded lectures, async materials)",
    "Identify and address barriers (financial, health, personal)",
    "Set minimum weekly engagement targets with progress nudges",
    "Escalate to student retention office if no contact within 5 days"
  ],
  "alert_level": "Critical",
  "intervention": "Retention & Welfare"
}
```

---

## 🎨 Frontend Component

**File:** `frontend/src/components/LearnerStatusTab.tsx`

### Features

#### 1. Three-Section Form

- **Section 1: Student Background** (8 categorical dropdowns)
- **Section 2: Engagement Behaviour** (7 numeric fields, `mean_daily_clicks` auto-calculated)
- **Section 3: Academic Performance** (4 numeric fields)

#### 2. Interactive Controls

- **Analyse Learner** — triggers prediction
- **Load Example Student** — populates with realistic OULAD data
- **Reset** — clears form

#### 3. Results Display (4 KPI Cards)

- **Learner Profile** — icon + label + confidence bar
- **Predicted Outcome** — color-coded by outcome type
- **Early Warning** — shield icons (red for At-Risk, green for safe)
- **Intervention** — alert level badge + action summary

#### 4. Learning Track Panel

- Recommended pathway name
- Description
- Bulleted action list

#### 5. Engagement Timeline Integration

- Accepts `student_id` input
- Renders `StudentEngagementTimeline` component below results
- Shows daily activity aggregation chart

### UI/UX Details

**Styling:** Tailwind CSS with Lucide icons

**Color Coding:**
- Distinction: Emerald (green)
- Pass: Blue
- Fail: Rose (red)
- Withdrawn: Amber (orange)

**Tooltips:** Each input field has help text explaining the feature

### API Integration

```typescript
const data = await predictLearnerProfile(input);
// POST /predict-learner-profile
```

**API Client:** `frontend/src/api.ts`

---

## ⚙️ Backend Implementation

### FastAPI Route

**File:** `backend/main.py` (lines 301-331)

```python
@app.post("/predict-learner-profile", response_model=LearnerProfileResponse)
def predict_learner_profile(request: LearnerProfileRequest):
    """
    Predict learner profile, academic outcome, and early-warning risk.

    Runs a three-stage ML pipeline on 19 OULAD student features.
    """
    try:
        features = request.model_dump()
        result = LearnerProfileService.predict(features)
        return LearnerProfileResponse(**result.to_dict())
    except Exception as e:
        logger.error("Error in learner profile prediction: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
```

**Endpoint:** `POST /predict-learner-profile`

### Request Schema

**File:** `backend/models.py`

```python
class LearnerProfileRequest(BaseModel):
    # Categorical (8)
    gender: str
    region: str
    highest_education: str
    imd_band: str
    age_band: str
    disability: str
    code_module: str
    code_presentation: str
    
    # Numerical — Engagement (7)
    total_clicks: int
    days_active: int
    max_daily_clicks: int
    mean_daily_clicks: float
    early_clicks: int
    num_assessments: int
    first_reg_before_start: int
    
    # Numerical — Academic (4)
    mean_score: float
    ever_unregistered: int
    num_of_prev_attempts: int
    studied_credits: int
```

### Response Schema

**File:** `backend/models.py`

```python
class LearnerProfileResponse(BaseModel):
    learner_profile: str              # e.g., "Balanced learners"
    profile_confidence: float         # 0–1
    predicted_outcome: str            # "Distinction"|"Pass"|"Fail"|"Withdrawn"
    outcome_confidence: float         # 0–1
    risk_prediction: str              # "At-Risk"|"Not At-Risk"
    risk_score: float                 # 0–1
    learning_path_recommendation: Dict[str, Any]  # JSON object
```

### Service Layer

**File:** `backend/services/learner_profile_service.py`

#### Key Classes

**1. `_ModelRegistry` (singleton)**
- Loads all 4 model artifacts at module import time
- Prevents per-request loading overhead
- Handles missing models gracefully with fallbacks

**2. `LearnerProfilePrediction` (data container)**
- Plain Python object with `__slots__`
- `to_dict()` method for Pydantic serialization

**3. `LearnerProfileService` (stateless service)**
- `predict(features: dict) -> LearnerProfilePrediction`
- Orchestrates 3 stages sequentially
- Returns enriched result with learning path

#### Pipeline Flow

```python
df = pd.DataFrame([features], columns=FEATURE_NAMES)

# Stage 1
learner_profile, profile_confidence = _predict_profile(df)

# Stage 2
predicted_outcome, outcome_confidence = _predict_outcome(df)

# Stage 3
risk_prediction, risk_score = _predict_risk(df, features)

# Enrich
learning_path_recommendation = _ModelRegistry.learning_path_map.get(
    predicted_outcome, {}
)

# Return
return LearnerProfilePrediction(...)
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────┐
│  Frontend Form  │  19 features entered by user/educator
└────────┬────────┘
         │ POST /predict-learner-profile
         ↓
┌─────────────────────────────────────────────────────────┐
│  FastAPI Route (backend/main.py)                        │
│  • Validates LearnerProfileRequest schema               │
│  • Calls LearnerProfileService.predict(features)        │
└────────┬────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────┐
│  LearnerProfileService (backend/services/)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Stage 1: profile_classifier.joblib                │  │
│  │ → Predict learner profile (4 classes)             │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     ↓                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Stage 2: best_model_pipeline.joblib               │  │
│  │ → Predict academic outcome (4 classes)            │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     ↓                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Stage 3: early_warning_pipeline.joblib            │  │
│  │ → Predict at-risk status (binary)                 │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     ↓                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Enrich with learning_path_recommendations.json    │  │
│  │ → Map outcome → intervention plan                 │  │
│  └──────────────────────────────────────────────────┘  │
└────────┬────────────────────────────────────────────────┘
         │ LearnerProfileResponse (JSON)
         ↓
┌─────────────────────────────────────────────────────────┐
│  Frontend Results Display                               │
│  • 4 KPI cards (profile, outcome, risk, intervention)   │
│  • Learning track panel with actions                    │
│  • Engagement timeline chart                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 How to Use

### Via Frontend UI

1. Navigate to **"Learner Status"** tab
2. Fill in:
   - **Student Background** (gender, region, education, etc.)
   - **Engagement Behaviour** (clicks, days active, assessments)
   - **Academic Performance** (scores, attempts, credits)
3. Click **"Analyse Learner"**
4. View results in 4 KPI cards + learning track panel
5. (Optional) Enter `student_id` to view engagement timeline

### Via API (cURL)

```bash
curl -X POST http://localhost:8000/predict-learner-profile \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "F",
    "region": "South East Region",
    "highest_education": "A Level or Equivalent",
    "imd_band": "50-60%",
    "age_band": "35-55",
    "disability": "N",
    "code_module": "DDD",
    "code_presentation": "2013J",
    "total_clicks": 2340,
    "days_active": 62,
    "max_daily_clicks": 210,
    "mean_daily_clicks": 37.7,
    "early_clicks": 580,
    "mean_score": 74.2,
    "num_assessments": 6,
    "first_reg_before_start": 45,
    "ever_unregistered": 0,
    "num_of_prev_attempts": 1,
    "studied_credits": 120
  }'
```

### Example Response

```json
{
  "learner_profile": "Balanced learners",
  "profile_confidence": 0.8523,
  "predicted_outcome": "Distinction",
  "outcome_confidence": 0.7891,
  "risk_prediction": "Not At-Risk",
  "risk_score": 0.1234,
  "learning_path_recommendation": {
    "profile": "High Achiever",
    "learning_path": "Advanced Track",
    "actions": [
      "Unlock advanced/extension modules and challenge problems",
      "Recommend peer mentoring or study group leadership roles",
      "Suggest research projects or external certifications",
      "Provide early access to next-level course materials",
      "Offer enrichment seminars and guest lecture invitations"
    ],
    "alert_level": "None",
    "intervention": "Enrichment",
    "description": "Consistently strong performer with high engagement and excellent assessment results."
  }
}
```

### Via Python (requests)

```python
import requests

payload = {
    "gender": "M",
    "region": "London Region",
    "highest_education": "HE Qualification",
    "imd_band": "90-100%",
    "age_band": "0-35",
    "disability": "N",
    "code_module": "BBB",
    "code_presentation": "2014J",
    "total_clicks": 1200,
    "days_active": 45,
    "max_daily_clicks": 150,
    "mean_daily_clicks": 26.7,
    "early_clicks": 320,
    "mean_score": 68.5,
    "num_assessments": 5,
    "first_reg_before_start": 30,
    "ever_unregistered": 0,
    "num_of_prev_attempts": 0,
    "studied_credits": 60
}

response = requests.post(
    "http://localhost:8000/predict-learner-profile",
    json=payload
)

result = response.json()
print(f"Profile: {result['learner_profile']}")
print(f"Outcome: {result['predicted_outcome']}")
print(f"Risk: {result['risk_prediction']}")
```

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `backend/services/learner_profile_service.py` | Core ML pipeline service |
| `backend/models.py` | Pydantic schemas (Request/Response) |
| `backend/main.py` | FastAPI route definition |
| `backend/artifacts/profile_classifier.joblib` | Stage 1 model |
| `backend/artifacts/best_model_pipeline.joblib` | Stage 2 model (primary) |
| `backend/artifacts/GradientBoosting_pipeline.joblib` | Stage 2 model (fallback) |
| `backend/artifacts/early_warning_pipeline.joblib` | Stage 3 model |
| `backend/artifacts/learning_path_recommendations.json` | Intervention mapping |
| `frontend/src/components/LearnerStatusTab.tsx` | React UI component |
| `frontend/src/api.ts` | API client (`predictLearnerProfile`) |
| `notebooks/05_learnerprofile.ipynb` | ML training notebook |

---

## 🎓 Research Context

### Dataset

**Open University Learning Analytics Dataset (OULAD)**
- **32,593** student records
- **7** modules, **4** presentations (2013B–2014J)
- **10+ million** VLE interaction logs
- Assessment scores and outcomes

### Methodology

1. **Clustering** — KMeans (n=4) on feature embeddings to discover learner archetypes
2. **Supervised Learning** — Train classifiers on labeled clusters
3. **Outcome Prediction** — GradientBoost on full feature set
4. **Risk Detection** — Binary classification with engineered thresholds

### Performance Metrics

From `notebooks/05_learnerprofile.ipynb`:

- Profile classifier: **~85% accuracy**
- Outcome prediction: **~78% accuracy**
- Early warning: **~82% recall** for At-Risk class

### Feature Importance

Top predictors:
1. `mean_score` — strongest outcome predictor
2. `total_clicks` — key engagement metric
3. `early_clicks` — early warning signal
4. `days_active` — consistency indicator
5. `num_assessments` — completion proxy

---

## 🔧 Technical Requirements

### Backend Dependencies

```
fastapi
uvicorn
pydantic
pandas
numpy
scikit-learn
joblib
xgboost  # optional, has rule-based fallback
```

### Frontend Dependencies

```
react
typescript
axios
recharts
lucide-react
tailwindcss
```

### Model Artifacts

All models must be present in `backend/artifacts/`:
- ✅ `profile_classifier.joblib` (required)
- ✅ `best_model_pipeline.joblib` or `GradientBoosting_pipeline.joblib` (one required)
- ⚠️ `early_warning_pipeline.joblib` (optional, has fallback)
- ✅ `learning_path_recommendations.json` (required)

---

## 🚨 Error Handling

### Missing Models

- **Profile classifier missing** → returns `"Unknown"` with 0.0 confidence
- **Outcome model missing** → falls back to `GradientBoosting_pipeline.joblib`
- **Early warning missing** → uses rule-based threshold scoring

### Invalid Input

- FastAPI validates all 19 required fields
- Type mismatches return `422 Unprocessable Entity`
- Missing fields return `422 Unprocessable Entity`

### Prediction Failures

- Service-level exceptions return `500 Internal Server Error`
- Individual stage failures are logged but don't crash the pipeline
- Fallback mechanisms ensure partial results are still returned

---

## 📈 Use Cases

### 1. **Proactive Intervention**
Identify at-risk students early in the semester and trigger support workflows

### 2. **Resource Allocation**
Prioritize tutoring/mentoring resources based on risk scores and alert levels

### 3. **Personalized Learning Paths**
Route students to appropriate difficulty tracks based on predicted outcomes

### 4. **Trend Analysis**
Aggregate predictions across cohorts to identify systemic issues

### 5. **Early Warning Dashboard**
Real-time monitoring of student engagement and risk flags

---

## 🔮 Future Enhancements

- [ ] Real-time prediction updates as activity logs stream in
- [ ] Batch prediction API for entire cohorts
- [ ] Explainable AI (SHAP values) for feature importance per student
- [ ] Historical prediction tracking to measure intervention effectiveness
- [ ] Integration with LMS webhooks for automated alerts
- [ ] Multi-language support for international students
- [ ] Mobile-optimized dashboard

---

## 📄 License & Citation

This system is based on research using the **Open University Learning Analytics Dataset (OULAD)**:

> Kuzilek J., Hlosta M., Zdrahal Z. Open University Learning Analytics dataset
> Sci. Data 4:170171 doi: 10.1038/sdata.2017.171 (2017).

For academic use, please cite the original dataset and acknowledge this prediction pipeline.

---

## 👥 Support

For technical issues or questions:
1. Check model artifacts are present in `backend/artifacts/`
2. Verify FastAPI is running on port 8000
3. Check browser console for frontend errors
4. Review backend logs for service exceptions

---

**Last Updated:** March 9, 2026  
**Version:** 1.0.0  
**Maintainer:** Research Team
