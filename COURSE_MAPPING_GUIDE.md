# Course Mapping System - Usage Guide

## 📋 Overview

The **Course Mapping System** bridges the gap between browser extension activity logs and OULAD-compatible ML pipeline inputs by automatically converting `course_id` values to the required `code_module` and `code_presentation` fields.

---

## 🏗️ Architecture

```
Browser Extension → course_id → Mapping Service → code_module + code_presentation → ML Pipeline
```

**Components:**
- 📁 **`backend/data/course_mapping.json`** - Mapping dictionary
- 🔧 **`backend/services/course_mapping_service.py`** - Mapping service
- 🚀 **`POST /predict-learner-profile/auto`** - Auto prediction endpoint

---

## 📖 Course Mapping Dictionary

**Location:** `backend/data/course_mapping.json`

### Structure

```json
{
  "_comment": "Mapping documentation",
  
  "course_id_1": {
    "code_module": "AAA",
    "code_presentation": "2014J"
  },
  
  "_default": {
    "code_module": "AAA",
    "code_presentation": "2014J"
  }
}
```

### Current Mappings

| Course ID | Module | Presentation | Category |
|-----------|--------|--------------|----------|
| `ml-fundamentals` | DDD | 2014J | AI/ML |
| `python-basics` | AAA | 2013J | Programming |
| `data-science-intro` | BBB | 2014B | Data Science |
| `web-development` | CCC | 2014J | Web Dev |
| `algorithms-and-complexity` | DDD | 2013J | CS Theory |
| `statistics-foundations` | EEE | 2014B | Math/Stats |
| `database-systems` | FFF | 2014J | Databases |
| `software-engineering` | GGG | 2014J | SE Practices |
| `deep-learning-specialization` | DDD | 2014B | AI/ML |
| `natural-language-processing` | EEE | 2014J | AI/ML |
| `computer-networks` | FFF | 2013B | Networking |
| `operating-systems` | GGG | 2014B | Systems |
| `linear-algebra` | BBB | 2013J | Math |
| `calculus-for-engineers` | BBB | 2014J | Math |
| `react-complete-guide` | CCC | 2014B | Frontend |
| `nodejs-backend-development` | CCC | 2013J | Backend |
| `cloud-computing-aws` | FFF | 2014B | Cloud |
| `devops-pipeline` | GGG | 2013J | DevOps |
| `cybersecurity-basics` | FFF | 2013J | Security |
| `mobile-app-development` | CCC | 2014B | Mobile |
| `artificial-intelligence` | DDD | 2014J | AI/ML |
| `blockchain-fundamentals` | FFF | 2014J | Blockchain |
| `ux-ui-design` | AAA | 2014B | Design |
| `data-visualization` | BBB | 2014B | Visualization |

### Default Mapping

When `course_id` is not found, the system uses:
```json
{
  "code_module": "AAA",
  "code_presentation": "2014J"
}
```

---

## 🔧 CourseMapping Service API

### Import

```python
from services.course_mapping_service import CourseMappingService, CourseMappingError
```

### Methods

#### `map_course(course_id: str) -> dict`

Maps a course ID to OULAD fields.

**Parameters:**
- `course_id` (str) - Browser extension course identifier

**Returns:**
```python
{
    "code_module": "DDD",
    "code_presentation": "2014J"
}
```

**Raises:**
- `CourseMappingError` - If course_id not found and no default configured

**Example:**
```python
try:
    mapping = CourseMappingService.map_course("ml-fundamentals")
    print(mapping)
    # {'code_module': 'DDD', 'code_presentation': '2014J'}
except CourseMappingError as e:
    print(f"Mapping failed: {e}")
```

#### `list_mappings() -> dict`

Returns all configured mappings (excluding internal keys like `_default`).

**Example:**
```python
all_mappings = CourseMappingService.list_mappings()
print(f"Total courses mapped: {len(all_mappings)}")
```

#### `reload()`

Force-reload the mapping from JSON file (useful after editing).

**Example:**
```python
# After editing course_mapping.json
CourseMappingService.reload()
```

---

## 🚀 API Endpoint Usage

### Endpoint

```
POST /predict-learner-profile/auto
```

### Two Input Modes

#### **Mode 1: Browser Extension (Recommended)**

Provide `course_id` from activity logs:

**Request:**
```json
{
  "student_id": "student_123",
  "course_id": "ml-fundamentals"
}
```

**Process:**
1. ✅ Maps `ml-fundamentals` → `DDD` / `2014J`
2. ✅ Fetches demographics from OULAD
3. ✅ Computes engagement features from MongoDB (filtered by `course_id`)
4. ✅ Runs ML prediction

**Response:**
```json
{
  "learner_profile": "Fast Learners",
  "profile_confidence": 0.87,
  "predicted_outcome": "Distinction",
  "outcome_confidence": 0.92,
  "risk_prediction": "Not At-Risk",
  "risk_score": 0.15,
  "learning_path_recommendation": {...}
}
```

---

#### **Mode 2: Direct OULAD**

Provide OULAD fields directly (no mapping needed):

**Request:**
```json
{
  "student_id": "student_123",
  "code_module": "DDD",
  "code_presentation": "2014J"
}
```

**Process:**
1. ✅ Uses provided OULAD fields directly
2. ✅ Fetches demographics
3. ✅ Computes engagement features
4. ✅ Runs ML prediction

---

### Error Handling

#### Unknown course_id (with default)

**Request:**
```json
{
  "student_id": "123",
  "course_id": "unknown-course"
}
```

**Behavior:**
- ⚠️ Logs warning
- ✅ Falls back to default mapping (`AAA` / `2014J`)
- ✅ Continues with prediction

**Server Log:**
```
WARNING: course_id 'unknown-course' not in mapping — using default (AAA / 2014J)
```

---

#### Unknown course_id (no default)

If `_default` is removed from JSON:

**Request:**
```json
{
  "student_id": "123",
  "course_id": "unknown-course"
}
```

**Response (400 Bad Request):**
```json
{
  "detail": "Invalid course_id: Unknown course_id 'unknown-course' and no _default mapping configured."
}
```

---

#### Missing course identifiers

**Request:**
```json
{
  "student_id": "123"
}
```

**Response (400 Bad Request):**
```json
{
  "detail": "Must provide either 'course_id' OR both 'code_module' and 'code_presentation'"
}
```

---

## 📝 Adding New Course Mappings

### Step 1: Edit JSON File

```bash
# Open mapping file
nano backend/data/course_mapping.json
```

### Step 2: Add Entry

```json
{
  "your-new-course": {
    "code_module": "DDD",
    "code_presentation": "2014J"
  }
}
```

### Step 3: Reload (Optional)

If backend is running, reload the mapping:

```python
from services.course_mapping_service import CourseMappingService
CourseMappingService.reload()
```

Or restart the backend server.

---

## 🔄 Integration Flow

### Complete Data Pipeline

```
1. STUDENT ACTIVITY
   Browser Extension tracks: "ml-fundamentals" course
   
2. ACTIVITY LOGGING
   POST /activity/log-event
   {
     "student_id": "123",
     "course_id": "ml-fundamentals",
     "event_type": "video_play"
   }
   
3. ENGAGEMENT COMPUTATION
   MongoDB aggregates events by course_id
   
4. AUTOMATIC PREDICTION
   POST /predict-learner-profile/auto
   {
     "student_id": "123",
     "course_id": "ml-fundamentals"
   }
   
5. COURSE MAPPING
   CourseMappingService.map_course("ml-fundamentals")
   → {"code_module": "DDD", "code_presentation": "2014J"}
   
6. FEATURE FETCHING
   - Demographics: StudentDataService (DDD/2014J)
   - Engagement: EngagementFeatureService (course_id="ml-fundamentals")
   
7. ML PREDICTION
   19 features → 3-stage pipeline → Profile + Outcome + Risk
   
8. RESPONSE
   Learner insights + recommendations
```

---

## 🧪 Testing

### Test Mapping Service

```python
from services.course_mapping_service import CourseMappingService

# Test valid course
mapping = CourseMappingService.map_course("ml-fundamentals")
assert mapping["code_module"] == "DDD"
assert mapping["code_presentation"] == "2014J"

# Test default fallback
mapping = CourseMappingService.map_course("unknown-course-999")
assert mapping["code_module"] == "AAA"  # default

# Test list all
all_courses = CourseMappingService.list_mappings()
print(f"Total courses: {len(all_courses)}")
```

### Test API Endpoint

```bash
# Test with course_id (browser extension mode)
curl -X POST http://localhost:5000/predict-learner-profile/auto \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student_123",
    "course_id": "ml-fundamentals"
  }'

# Test with direct OULAD fields
curl -X POST http://localhost:5000/predict-learner-profile/auto \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student_123",
    "code_module": "DDD",
    "code_presentation": "2014J"
  }'
```

---

## 🎯 Best Practices

### 1. Course ID Naming

Use kebab-case for consistency:
```
✅ "ml-fundamentals"
✅ "web-development-advanced"
❌ "ML_Fundamentals"
❌ "WebDevelopmentAdvanced"
```

### 2. Module Assignment

Group related courses by module:
- **AAA**: General/introductory courses
- **BBB**: Math and statistics
- **CCC**: Web development
- **DDD**: AI/ML
- **EEE**: Advanced analytics
- **FFF**: Systems/infrastructure
- **GGG**: Software engineering

### 3. Presentation Assignment

Choose semester based on course launch:
- **2013B** - October start
- **2013J** - February start
- **2014B** - October start
- **2014J** - February start

### 4. Default Mapping

Always configure `_default` to prevent errors:
```json
"_default": {
  "code_module": "AAA",
  "code_presentation": "2014J"
}
```

### 5. Validation

Validate new mappings against OULAD modules:
```python
VALID_MODULES = ["AAA", "BBB", "CCC", "DDD", "EEE", "FFF", "GGG"]
VALID_PRESENTATIONS = ["2013B", "2013J", "2014B", "2014J"]
```

---

## 🔒 Security Notes

- ✅ Mapping file is server-side only (not exposed to frontend)
- ✅ course_id validated before database queries
- ✅ All errors logged for monitoring
- ✅ No sensitive data in mapping file

---

## 📊 Monitoring

### Log Messages

**Successful mapping:**
```
INFO: Mapped course_id 'ml-fundamentals' → DDD / 2014J
```

**Default fallback:**
```
WARNING: course_id 'unknown-course' not in mapping — using default (AAA / 2014J)
```

**Mapping error:**
```
ERROR: Unknown course_id 'bad-course' and no _default mapping configured
```

---

## 🚀 Quick Start

### For Developers

```python
# Add to your service
from services.course_mapping_service import CourseMappingService

def process_activity_log(log):
    # Map course_id from browser extension
    mapping = CourseMappingService.map_course(log["course_id"])
    
    # Use OULAD fields
    code_module = mapping["code_module"]
    code_presentation = mapping["code_presentation"]
    
    # Continue processing...
```

### For API Users

```bash
# Just use course_id in your requests
curl -X POST .../predict-learner-profile/auto \
  -d '{"student_id": "123", "course_id": "ml-fundamentals"}'
```

---

## 📚 Related Documentation

- [Activity Logging System](../LEARNER_PROFILE_COMPONENT.md)
- [Auto Prediction Endpoint](../AUTOMATIC_PREDICTION_GUIDE.md)
- [Node.js Engagement Features](../backend-auth/src/routes/logsRoutes.js)
