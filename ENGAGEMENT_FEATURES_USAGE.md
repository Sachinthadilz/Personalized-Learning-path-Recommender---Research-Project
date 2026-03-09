# Engagement Features Usage Guide

## 📋 Overview

The **Engagement Feature Service** computes 6 ML-ready features from MongoDB activity logs using high-performance server-side aggregation pipelines.

**Critical Update:** All feature computations now **REQUIRE** both `student_id` AND `course_id` to ensure accurate per-course engagement metrics.

---

## 🔧 Service API

### Function Signature

```python
async def generate_engagement_features(
    student_id: str,
    course_id: str
) -> Dict[str, Any]
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `student_id` | str | ✅ Yes | Student identifier |
| `course_id` | str | ✅ Yes | Course identifier (filters MongoDB logs) |

### Returns

Dictionary with computed features:

```python
{
    "student_id": "student_123",
    "course_id": "ml-fundamentals",
    "code_module": "DDD",           # Mapped from course_id
    "code_presentation": "2014J",   # Mapped from course_id
    "total_clicks": 450,            # Total click events
    "days_active": 24,              # Distinct days with activity
    "max_daily_clicks": 63,         # Peak daily engagement
    "mean_daily_clicks": 18.75,     # Average clicks per active day
    "early_clicks": 120,            # Clicks in first 14 days
    "num_assessments": 5            # Assessment submissions
}
```

---

## 📊 Computed Features

### 1. `total_clicks`
Total number of click events (video_play, page_view, etc.) for the student in the course.

**MongoDB Aggregation:**
```javascript
db.activity_logs.aggregate([
  {
    $match: {
      student_id: "student_123",
      course_id: "ml-fundamentals",
      event_type: { $in: ["video_play", "page_view", "resource_download", ...] }
    }
  },
  { $count: "total" }
])
```

### 2. `days_active`
Number of distinct days the student had click activity.

**MongoDB Aggregation:**
```javascript
db.activity_logs.aggregate([
  {
    $match: {
      student_id: "student_123",
      course_id: "ml-fundamentals",
      event_type: { $in: ["video_play", "page_view", ...] }
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
    }
  },
  { $count: "days" }
])
```

### 3. `max_daily_clicks`
Maximum number of clicks in any single day.

**MongoDB Aggregation:**
```javascript
db.activity_logs.aggregate([
  {
    $match: {
      student_id: "student_123",
      course_id: "ml-fundamentals",
      event_type: { $in: ["video_play", "page_view", ...] }
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 1 }
])
```

### 4. `mean_daily_clicks`
Average clicks per active day (computed in Python).

**Calculation:**
```python
mean_daily_clicks = total_clicks / days_active if days_active > 0 else 0.0
mean_daily_clicks = round(mean_daily_clicks, 1)
```

### 5. `early_clicks`
Number of clicks in the first 14 days after the student's first event.

**MongoDB Aggregation:**
```javascript
// First, find earliest event timestamp
first_event = db.activity_logs.findOne(
  { student_id: "student_123", course_id: "ml-fundamentals" },
  { sort: { timestamp: 1 } }
)

// Then count clicks within 14 days
cutoff_time = first_event.timestamp + 14 days

db.activity_logs.aggregate([
  {
    $match: {
      student_id: "student_123",
      course_id: "ml-fundamentals",
      event_type: { $in: ["video_play", "page_view", ...] },
      timestamp: { $lte: cutoff_time }
    }
  },
  { $count: "total" }
])
```

### 6. `num_assessments`
Number of assessment submissions (quiz_submit, exam_submit, etc.).

**MongoDB Aggregation:**
```javascript
db.activity_logs.aggregate([
  {
    $match: {
      student_id: "student_123",
      course_id: "ml-fundamentals",
      event_type: { $in: ["assessment_submit", "quiz_submit", "exam_submit"] }
    }
  },
  { $count: "total" }
])
```

---

## 🚀 Usage Examples

### Example 1: Direct Service Call

```python
from services.engagement_feature_service import EngagementFeatureService

# Compute features for a student in a specific course
features = await EngagementFeatureService.generate_engagement_features(
    student_id="student_123",
    course_id="ml-fundamentals"
)

print(f"Total clicks: {features['total_clicks']}")
print(f"Days active: {features['days_active']}")
print(f"Engagement rate: {features['mean_daily_clicks']:.1f} clicks/day")
```

**Output:**
```
Total clicks: 450
Days active: 24
Engagement rate: 18.8 clicks/day
```

### Example 2: Get Pydantic Model

```python
from services.engagement_feature_service import EngagementFeatureService

# Returns EngagementFeatures Pydantic model
features = await EngagementFeatureService.generate_engagement_features_as_model(
    student_id="student_123",
    course_id="ml-fundamentals"
)

# Access as model attributes
print(features.total_clicks)
print(features.days_active)
print(features.mean_daily_clicks)
```

### Example 3: API Endpoint Call

```bash
# GET request with query parameter
curl "http://localhost:5000/activity/engagement-features/student_123?course_id=ml-fundamentals"
```

**Response:**
```json
{
  "student_id": "student_123",
  "code_module": "DDD",
  "code_presentation": "2014J",
  "total_clicks": 450,
  "days_active": 24,
  "max_daily_clicks": 63,
  "mean_daily_clicks": 18.8,
  "early_clicks": 120,
  "num_assessments": 5
}
```

### Example 4: Integration with Auto Prediction

```python
# In main.py - Auto prediction endpoint
@app.post("/predict-learner-profile/auto")
async def predict_learner_profile_auto(request: AutoLearnerProfileRequest):
    student_id = request.student_id
    course_id = request.course_id
    
    # 1. Fetch student demographics
    student_features = StudentDataService.get_student_features(...)
    
    # 2. Fetch engagement features (REQUIRES course_id)
    engagement_features = await EngagementFeatureService.generate_engagement_features_as_model(
        student_id=student_id,
        course_id=course_id  # REQUIRED parameter
    )
    
    # 3. Merge into 19-feature dict
    features = {
        # Demographics (8 features)
        "gender": student_features["gender"],
        "region": student_features["region"],
        ...
        
        # Engagement (6 features)
        "total_clicks": engagement_features.total_clicks,
        "days_active": engagement_features.days_active,
        "max_daily_clicks": engagement_features.max_daily_clicks,
        "mean_daily_clicks": engagement_features.mean_daily_clicks,
        "early_clicks": engagement_features.early_clicks,
        "num_assessments": engagement_features.num_assessments,
        
        # Academic (4 features)
        "mean_score": student_features["mean_score"],
        ...
    }
    
    # 4. Run ML prediction
    result = LearnerProfileService.predict(features)
    return result
```

---

## 🔄 MongoDB Aggregation Pipeline

### Complete Single-Query Pipeline

The service uses a **single MongoDB aggregation** with `$facet` to compute all features efficiently:

```python
from activity_log_model import CLICK_EVENT_TYPES, ASSESSMENT_EVENT_TYPES

click_types = [et.value for et in CLICK_EVENT_TYPES]
assessment_types = [et.value for et in ASSESSMENT_EVENT_TYPES]

pipeline = [
    # CRITICAL: Filter by BOTH student_id AND course_id
    {
        "$match": {
            "student_id": student_id,
            "course_id": course_id
        }
    },
    
    # Compute multiple features in parallel using $facet
    {
        "$facet": {
            # Feature 1: Total clicks
            "clicks": [
                {"$match": {"event_type": {"$in": click_types}}},
                {"$count": "total"}
            ],
            
            # Feature 2: Assessment count
            "assessments": [
                {"$match": {"event_type": {"$in": assessment_types}}},
                {"$count": "total"}
            ],
            
            # Feature 3: First event timestamp (for early_clicks)
            "first_event": [
                {"$match": {"event_type": {"$in": click_types}}},
                {"$sort": {"timestamp": 1}},
                {"$limit": 1},
                {"$project": {"timestamp": 1}}
            ]
        }
    }
]

# Execute aggregation
results = await collection.aggregate(pipeline).to_list(length=1)
```

### Additional Pipelines

**Days Active:**
```python
pipeline = [
    {
        "$match": {
            "student_id": student_id,
            "course_id": course_id,
            "event_type": {"$in": click_types}
        }
    },
    {
        "$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}}
        }
    },
    {"$count": "days"}
]
```

**Max Daily Clicks:**
```python
pipeline = [
    {
        "$match": {
            "student_id": student_id,
            "course_id": course_id,
            "event_type": {"$in": click_types}
        }
    },
    {
        "$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "count": {"$sum": 1}
        }
    },
    {"$sort": {"count": -1}},
    {"$limit": 1}
]
```

---

## ⚠️ Migration from Old API

### Breaking Changes

**Before (Optional course_id):**
```python
# ❌ Old API - course_id was optional
features = await EngagementFeatureService.generate_engagement_features(
    student_id="student_123"
    # course_id was optional - aggregated across ALL courses
)
```

**After (Required course_id):**
```python
# ✅ New API - course_id is REQUIRED
features = await EngagementFeatureService.generate_engagement_features(
    student_id="student_123",
    course_id="ml-fundamentals"  # REQUIRED parameter
)
```

### Why This Change?

**Problem:** When `course_id` was optional, engagement features mixed activity across multiple courses, leading to inaccurate metrics.

**Example:**
- Student takes "Python Basics" (100 clicks) and "ML Fundamentals" (300 clicks)
- Old API returned: `total_clicks: 400` (combined both courses)
- ML model predicts based on 400 clicks, but student only has 300 in ML course
- **Result:** Inaccurate predictions

**Solution:** Require `course_id` to ensure all features are scoped to a single course.

---

## 🎯 Best Practices

### 1. Always Pass course_id

```python
# ✅ CORRECT - Pass both parameters
features = await EngagementFeatureService.generate_engagement_features(
    student_id="student_123",
    course_id="ml-fundamentals"
)

# ❌ INCORRECT - Missing course_id
features = await EngagementFeatureService.generate_engagement_features(
    student_id="student_123"
)  # TypeError: missing required argument 'course_id'
```

### 2. Use Course Mapping for Consistency

```python
from services.course_mapping_service import CourseMappingService

# Map browser extension course_id to OULAD fields
mapping = CourseMappingService.map_course("ml-fundamentals")
# {'code_module': 'DDD', 'code_presentation': '2014J'}

# Use the same course_id for engagement features
features = await EngagementFeatureService.generate_engagement_features(
    student_id="student_123",
    course_id="ml-fundamentals"  # Same course_id
)
```

### 3. Handle Missing Data

```python
features = await EngagementFeatureService.generate_engagement_features(
    student_id="student_123",
    course_id="ml-fundamentals"
)

# Check if student has any activity
if features["total_clicks"] == 0:
    print(f"Warning: No activity logs found for student {student_id} in course {course_id}")
    # Handle edge case - use default values or skip prediction
```

### 4. Validate Before Prediction

```python
# Ensure minimum engagement before running ML prediction
MIN_CLICKS = 10
MIN_DAYS = 3

features = await EngagementFeatureService.generate_engagement_features(
    student_id="student_123",
    course_id="ml-fundamentals"
)

if features["total_clicks"] < MIN_CLICKS or features["days_active"] < MIN_DAYS:
    raise ValueError(
        f"Insufficient engagement data: {features['total_clicks']} clicks, "
        f"{features['days_active']} days active. Minimum: {MIN_CLICKS} clicks, {MIN_DAYS} days."
    )
```

---

## 🔒 Data Privacy

All MongoDB queries are scoped to:
1. **student_id** - Ensures data isolation per student
2. **course_id** - Ensures feature accuracy per course

No cross-student or cross-course data leakage.

---

## 📈 Performance Optimization

### Server-Side Aggregation Benefits

✅ **Reduced Network Transfer**: Computation happens in MongoDB, only results sent to Python  
✅ **Lower Memory Usage**: No need to load thousands of log documents into memory  
✅ **Parallel Processing**: `$facet` computes multiple features simultaneously  
✅ **Index Utilization**: MongoDB uses indexes on `student_id` and `course_id` fields

### Expected Performance

| Logs per Student | Query Time |
|------------------|------------|
| 100 | ~50ms |
| 1,000 | ~150ms |
| 10,000 | ~500ms |
| 100,000+ | ~2-3s |

### Optimization Tips

1. **Create Compound Index:**
```javascript
db.activity_logs.createIndex({ student_id: 1, course_id: 1, timestamp: 1 })
```

2. **Add Event Type Index:**
```javascript
db.activity_logs.createIndex({ event_type: 1 })
```

3. **Monitor Slow Queries:**
```python
import logging
logging.getLogger("motor").setLevel(logging.DEBUG)
```

---

## 🧪 Testing

### Unit Test Example

```python
import pytest
from services.engagement_feature_service import EngagementFeatureService

@pytest.mark.asyncio
async def test_generate_engagement_features():
    # Test with sample student and course
    features = await EngagementFeatureService.generate_engagement_features(
        student_id="student_123",
        course_id="ml-fundamentals"
    )
    
    # Verify all features are present
    assert "total_clicks" in features
    assert "days_active" in features
    assert "max_daily_clicks" in features
    assert "mean_daily_clicks" in features
    assert "early_clicks" in features
    assert "num_assessments" in features
    
    # Verify types
    assert isinstance(features["total_clicks"], int)
    assert isinstance(features["days_active"], int)
    assert isinstance(features["mean_daily_clicks"], float)
    
    # Verify logic
    if features["days_active"] > 0:
        expected_mean = round(features["total_clicks"] / features["days_active"], 1)
        assert features["mean_daily_clicks"] == expected_mean


@pytest.mark.asyncio
async def test_missing_course_id():
    # Verify course_id is required
    with pytest.raises(TypeError):
        await EngagementFeatureService.generate_engagement_features(
            student_id="student_123"
            # Missing course_id - should raise TypeError
        )
```

---

## 📚 Related Documentation

- [Activity Logging System](LEARNER_PROFILE_COMPONENT.md)
- [Course Mapping Guide](COURSE_MAPPING_GUIDE.md)
- [Auto Prediction Endpoint](AUTOMATIC_PREDICTION_GUIDE.md)
- [MongoDB Aggregation](https://docs.mongodb.com/manual/aggregation/)
