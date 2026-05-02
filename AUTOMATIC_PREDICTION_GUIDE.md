# Automatic Student-Based Learner Profile Prediction

## Overview

The learner profile prediction system has been **upgraded to support automatic predictions** based on logged-in student IDs. The system automatically fetches:

- **Student demographics** from OULAD CSV files (`studentInfo.csv`)
- **Engagement features** from activity log database (MongoDB)
- **Assessment scores** from OULAD data (`studentAssessment.csv`)
- **Registration information** from OULAD data (`studentRegistration.csv`)

No manual entry of 19 features is required. The system builds the full input internally and runs the 3-stage ML pipeline automatically.

---

## Architecture Changes

### 1. New Backend Service

**File:** `backend/services/student_data_service.py`

Provides three main functions:

- `get_student_demographics()` — Fetches 8 demographic fields from `studentInfo.csv`
- `get_assessment_metrics()` — Computes `mean_score` from `studentAssessment.csv`
- `get_registration_info()` — Extracts `first_reg_before_start` and `ever_unregistered` from `studentRegistration.csv`
- `build_student_features()` — Combines all static features (11 fields total)

### 2. New API Endpoint

**Endpoint:** `POST /predict-learner-profile/auto`

**Request Schema:**

```json
{
  "student_id": "11391",
  "code_module": "AAA",          // Optional
  "code_presentation": "2013J"   // Optional
}
```

**Response:** Same as manual endpoint (`LearnerProfileResponse`)

### 3. Data Flow

```
User Login → Frontend gets user.id → POST /predict-learner-profile/auto
                                              ↓
                        ┌──────────────────────────────────────┐
                        │ FastAPI Route                         │
                        │ (backend/main.py)                     │
                        └───────────────┬──────────────────────┘
                                        │
                            ┌───────────┴───────────┐
                            │                       │
                ┌───────────▼───────────┐ ┌─────────▼──────────┐
                │ StudentDataService     │ │ ActivityLogService │
                │ (OULAD CSV files)      │ │ (MongoDB logs)     │
                └───────────┬───────────┘ └─────────┬──────────┘
                            │                       │
                            │  11 fields            │  8 fields
                            │  (demographics +      │  (engagement
                            │   assessments +       │   features)
                            │   registration)       │
                            └───────────┬───────────┘
                                        │
                                  ┌─────▼─────┐
                                  │ Merge to  │
                                  │ 19 fields │
                                  └─────┬─────┘
                                        │
                            ┌───────────▼──────────────┐
                            │ LearnerProfileService    │
                            │ (3-stage ML pipeline)    │
                            └───────────┬──────────────┘
                                        │
                                        ▼
                                 Response (JSON)
```

---

## Frontend Component

**File:** `frontend/src/components/AutoLearnerProfileTab.tsx`

### Features

✅ **Automatic user detection** — uses `useAuth()` hook to get logged-in user ID  
✅ **Optional filters** — can specify `student_id`, `code_module`, `code_presentation`  
✅ **Same result display** — reuses 4 KPI cards + learning track panel  
✅ **Engagement timeline** — automatically loads timeline for the student

### Usage

```tsx
import AutoLearnerProfileTab from "./components/AutoLearnerProfileTab";

// In your app router
<Route path="/learner-profile-auto" element={<AutoLearnerProfileTab />} />
```

The component:
1. Detects if user is logged in via `useAuth()`
2. Defaults to using `user.id` as `student_id`
3. Allows override for admins/testing
4. Calls `POST /predict-learner-profile/auto`
5. Displays results identically to manual form

---

## How to Use

### For Students (Frontend)

1. **Log in** to the system
2. Navigate to **"Auto Learner Profile"** tab
3. Click **"Analyze My Profile"** button
4. View results:
   - Learner Profile category
   - Predicted academic outcome
   - Risk assessment
   - Recommended learning path with actionable steps

**No data entry required!**

### For Admins/Educators (Frontend)

Same as students, but can override:
- **Student ID** — analyze any student in the OULAD dataset
- **Module filter** — restrict to specific course
- **Presentation filter** — restrict to specific semester

### Via API (Direct HTTP)

```bash
curl -X POST http://localhost:8000/predict-learner-profile/auto \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "11391",
    "code_module": "AAA",
    "code_presentation": "2013J"
  }'
```

### Via Python

```python
import requests

response = requests.post(
    "http://localhost:8000/predict-learner-profile/auto",
    json={
        "student_id": "11391",
        "code_module": "AAA",
        "code_presentation": "2013J"
    }
)

result = response.json()
print(f"Profile: {result['learner_profile']}")
print(f"Outcome: {result['predicted_outcome']}")
print(f"Risk: {result['risk_prediction']}")
```

---

## Data Requirements

### OULAD CSV Files (Backend)

Must be present in `backend/data/oulad/`:

- ✅ `studentInfo.csv` — demographics (gender, region, education, IMD, age, disability, credits, prev attempts)
- ✅ `studentAssessment.csv` — assessment scores
- ✅ `studentRegistration.csv` — registration dates and un-registration status

### Activity Logs (MongoDB)

The system requires activity logs in MongoDB collection `activity_logs` to compute engagement features:
- `total_clicks`
- `days_active`
- `max_daily_clicks`
- `mean_daily_clicks`
- `early_clicks`
- `num_assessments`

These are generated from the **browser extension** or manual log insertions.

If no activity logs exist for a student, engagement features default to 0.

---

## Feature Mapping

### Static Features (from StudentDataService)

| Feature | Source File | CSV Column |
|---------|-------------|------------|
| `gender` | studentInfo.csv | `gender` |
| `region` | studentInfo.csv | `region` |
| `highest_education` | studentInfo.csv | `highest_education` |
| `imd_band` | studentInfo.csv | `imd_band` |
| `age_band` | studentInfo.csv | `age_band` |
| `disability` | studentInfo.csv | `disability` |
| `code_module` | studentInfo.csv | `code_module` |
| `code_presentation` | studentInfo.csv | `code_presentation` |
| `num_of_prev_attempts` | studentInfo.csv | `num_of_prev_attempts` |
| `studied_credits` | studentInfo.csv | `studied_credits` |
| `mean_score` | studentAssessment.csv | Aggregated from `score` |
| `first_reg_before_start` | studentRegistration.csv | `date_registration` |
| `ever_unregistered` | studentRegistration.csv | Derived from `date_unregistration` |

### Dynamic Features (from ActivityLogService)

| Feature | Source | Computation |
|---------|--------|-------------|
| `total_clicks` | MongoDB `activity_logs` | Count of click events |
| `days_active` | MongoDB `activity_logs` | Distinct days with clicks |
| `max_daily_clicks` | MongoDB `activity_logs` | Peak single-day clicks |
| `mean_daily_clicks` | MongoDB `activity_logs` | total_clicks ÷ days_active |
| `early_clicks` | MongoDB `activity_logs` | Clicks in first 14 days |
| `num_assessments` | MongoDB `activity_logs` | Count of assessment events |

Total: **19 features** (as required by ML pipeline)

---

## Error Handling

### Student Not Found (404)

If `student_id` does not exist in OULAD CSV files:

```json
{
  "detail": "Student not found: No demographic data found for student_id=99999 ..."
}
```

### No Activity Logs (200 with defaults)

If student exists in OULAD but has no MongoDB activity logs, engagement features default to 0. The prediction still runs but may have lower confidence.

### Invalid Module/Presentation (200 with first match)

If multiple registrations exist for a student, the service returns the first match. Specify `code_module` and `code_presentation` to filter precisely.

---

## Comparison: Manual vs. Automatic

| Aspect | Manual Endpoint | Automatic Endpoint |
|--------|-----------------|-------------------|
| **Endpoint** | `POST /predict-learner-profile` | `POST /predict-learner-profile/auto` |
| **Input** | 19 features (full form) | `student_id` + optional filters |
| **Data Source** | User-provided | OULAD CSVs + MongoDB |
| **Use Case** | Testing, hypotheticals, admin overrides | Normal student predictions |
| **Frontend** | `LearnerStatusTab.tsx` (complex form) | `AutoLearnerProfileTab.tsx` (simple) |
| **Auth Required** | No | Yes (to get logged-in user) |

---

## Implementation Files

### Backend

| File | Purpose |
|------|---------|
| `backend/services/student_data_service.py` | **New** — OULAD data loader |
| `backend/models.py` | Added `AutoLearnerProfileRequest` |
| `backend/main.py` | Added `POST /predict-learner-profile/auto` route |
| `backend-auth/src/routes/logsRoutes.js` | **New** — Node.js engagement features endpoint |
| `backend-auth/src/routes/predictRoutes.js` | **New** — Proxy to Python ML backend |

### Frontend

| File | Purpose |
|------|---------|
| `frontend/src/components/AutoLearnerProfileTab.tsx` | **New** — automatic prediction UI |
| `frontend/src/api.ts` | Added `predictLearnerProfileAuto()` function |
| `frontend/src/contexts/AuthContext.tsx` | Existing — provides `useAuth()` hook |

---

## Testing

### Test with Real OULAD Student

```bash
# Backend test
cd backend
python -c "
from services.student_data_service import StudentDataService
features = StudentDataService.build_student_features('11391')
print('Success! Keys:', list(features.keys()))
print('Gender:', features['gender'])
print('Mean Score:', features['mean_score'])
"
```

Expected output:
```
INFO:services.student_data_service:Loaded 32593 records from studentInfo.csv
INFO:services.student_data_service:Loaded 173912 records from studentAssessment.csv
INFO:services.student_data_service:Loaded 32593 records from studentRegistration.csv
INFO:services.student_data_service:Built student features for student_id=11391 (module=AAA, presentation=2013J)
Success! Keys: ['gender', 'region', 'highest_education', 'imd_band', 'age_band', 'num_of_prev_attempts', 'studied_credits', 'disability', 'code_module', 'code_presentation', 'mean_score', 'first_reg_before_start', 'ever_unregistered']
Gender: M
Mean Score: 69.2
```

### Test API Endpoint

```bash
# Start backend
cd backend
uvicorn main:app --reload

# In another terminal
curl -X POST http://localhost:8000/predict-learner-profile/auto \
  -H "Content-Type: application/json" \
  -d '{"student_id": "11391"}' | jq
```

### Test Frontend

1. Start frontend: `npm run dev`
2. Log in with any user account
3. Navigate to Auto Learner Profile tab
4. Override Student ID with `11391`
5. Click "Analyze My Profile"
6. Verify results display

---

## Migration Notes

### For Existing Users

The **manual prediction form still exists** at `POST /predict-learner-profile`. Both endpoints are available:

- **Manual**: For testing, admin overrides, hypothetical scenarios
- **Automatic**: For logged-in students accessing their own data

### Database Mapping

**Important:** The automatic system uses OULAD student IDs (numeric like `11391`). Your authentication system's user IDs must map to these:

**Option 1:** Store OULAD `id_student` in user profile
```javascript
// In User model
{
  id: "user_abc123",
  oulad_student_id: "11391",  // Add this field
  ...
}
```

**Option 2:** Use OULAD IDs directly as user IDs
```javascript
// During registration
{
  id: "11391",  // Use OULAD student ID
  email: "student@example.com",
  ...
}
```

**Current implementation assumes:** `user.id` = OULAD `id_student`

If your user IDs differ, modify the frontend to use `user.oulad_student_id` instead of `user.id`.

---

## Future Enhancements

- [ ] Real-time prediction updates as activity log grows
- [ ] Batch prediction for entire cohorts
- [ ] Caching of student features to avoid repeated CSV reads
- [ ] Database migration — move OULAD data from CSV to MongoDB/PostgreSQL
- [ ] Permission system — restrict who can analyze which students
- [ ] Historical prediction tracking — store predictions over time to measure student progress
- [ ] Explainable AI — SHAP values to show which features drove the prediction

---

## Troubleshooting

### "Student not found" error

**Cause:** Student ID doesn't exist in `studentInfo.csv`

**Solution:** Verify the student ID is a valid OULAD `id_student`. Check `backend/data/oulad/studentInfo.csv`.

### All engagement features are 0

**Cause:** No activity logs in MongoDB for this student

**Solution:**
1. Use the browser extension to generate logs
2. Manually insert test logs via `POST /activity/log-event`
3. Or accept 0s and proceed (prediction will run with low engagement)

### "Could not convert string to numeric" error

**Cause:** `studentAssessment.csv` has non-numeric scores (e.g., `?`)

**Solution:** Already fixed! The service now uses `pd.to_numeric(errors='coerce')` to handle this.

### Frontend shows "You must be logged in"

**Cause:** User not authenticated or `useAuth()` returns `null`

**Solution:**
1. Log in via the auth system
2. Verify `AuthProvider` wraps your app
3. Check browser console for auth errors

---

**Last Updated:** March 9, 2026  
**Version:** 2.0.0  
**Feature:** Automatic Student-Based Predictions
