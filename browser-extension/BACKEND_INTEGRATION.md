# Backend Integration Example

This document shows how to integrate the browser extension with your existing FastAPI backend.

## Update your FastAPI Backend

### 1. Add CORS Middleware

Update your `backend/main.py` to include CORS support:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify chrome-extension://[your-extension-id]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Verify the /log-event Endpoint

Make sure your existing endpoint matches this structure:

```python
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

class ActivityEvent(BaseModel):
    student_id: str
    course_id: str
    event_type: str
    timestamp: str
    duration: int
    page_url: str
    session_id: Optional[str] = None
    metadata: Optional[Dict] = None

@app.post("/log-event")
async def log_event(event: ActivityEvent):
    """
    Log a student activity event
    """
    try:
        # Your existing logging logic here
        print(f"Received event: {event.event_type} from student {event.student_id}")
        
        # Store in your database (MongoDB, PostgreSQL, etc.)
        # await store_event_in_db(event)
        
        return {
            "status": "success",
            "message": "Event logged successfully",
            "event_id": f"evt_{datetime.now().timestamp()}"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
```

### 3. MongoDB Integration (Optional)

If you're using MongoDB (as indicated by your mongo_activity.py):

```python
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# MongoDB connection (add to your config)
mongo_client = AsyncIOMotorClient("mongodb://localhost:27017")
db = mongo_client.learning_analytics
activity_collection = db.activity_logs

@app.post("/log-event")
async def log_event(event: ActivityEvent):
    """
    Log activity event to MongoDB
    """
    try:
        # Prepare document
        document = {
            "student_id": event.student_id,
            "course_id": event.course_id,
            "event_type": event.event_type,
            "timestamp": datetime.fromisoformat(event.timestamp.replace('Z', '+00:00')),
            "duration": event.duration,
            "page_url": event.page_url,
            "session_id": event.session_id,
            "metadata": event.metadata or {},
            "created_at": datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = await activity_collection.insert_one(document)
        
        return {
            "status": "success",
            "event_id": str(result.inserted_id)
        }
    except Exception as e:
        print(f"Error logging event: {e}")
        return {
            "status": "error",
            "message": str(e)
        }
```

## Testing the Integration

### 1. Start Your Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 2. Test the Endpoint

Use curl or Postman to test:

```bash
curl -X POST http://localhost:8000/log-event \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test_student",
    "course_id": "test_course",
    "event_type": "page_visit",
    "timestamp": "2026-03-08T10:00:00.000Z",
    "duration": 0,
    "page_url": "https://example.com",
    "session_id": "test_session",
    "metadata": {}
  }'
```

Expected response:
```json
{
  "status": "success",
  "event_id": "evt_1234567890"
}
```

### 3. Load the Extension

1. Follow the installation steps in README.md
2. Configure the extension with your student ID
3. Visit a supported course platform
4. Check your backend logs for incoming events

## Event Analysis Examples

### Query Recent Events

```python
@app.get("/events/{student_id}")
async def get_student_events(student_id: str, limit: int = 100):
    """
    Get recent events for a student
    """
    events = await activity_collection.find(
        {"student_id": student_id}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {"events": events}
```

### Calculate Time Spent

```python
@app.get("/analytics/time-spent/{student_id}")
async def get_time_spent(student_id: str, course_id: str = None):
    """
    Calculate total time spent by student
    """
    query = {"student_id": student_id}
    if course_id:
        query["course_id"] = course_id
    
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": "$course_id",
            "total_duration": {"$sum": "$duration"}
        }}
    ]
    
    results = await activity_collection.aggregate(pipeline).to_list(None)
    return {"results": results}
```

### Video Engagement Analytics

```python
@app.get("/analytics/video-engagement/{student_id}")
async def get_video_engagement(student_id: str):
    """
    Analyze video engagement
    """
    pipeline = [
        {"$match": {
            "student_id": student_id,
            "event_type": {"$in": ["video_play", "video_pause", "video_complete"]}
        }},
        {"$group": {
            "_id": "$metadata.video_id",
            "plays": {"$sum": 1},
            "total_watch_time": {"$sum": "$metadata.watch_duration"}
        }}
    ]
    
    results = await activity_collection.aggregate(pipeline).to_list(None)
    return {"video_engagement": results}
```

## Production Considerations

### 1. Extension ID for CORS

In production, update CORS to use your extension ID:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://your-extension-id-here",
        "https://yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)
```

### 2. Rate Limiting

Add rate limiting to prevent abuse:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/log-event")
@limiter.limit("100/minute")
async def log_event(request: Request, event: ActivityEvent):
    # Your logic here
    pass
```

### 3. Authentication (Optional)

Add API key authentication:

```python
from fastapi import Header, HTTPException

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != "your-secret-api-key":
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return x_api_key

@app.post("/log-event")
async def log_event(
    event: ActivityEvent,
    api_key: str = Depends(verify_api_key)
):
    # Your logic here
    pass
```

Then update the extension's `api_client.js`:

```javascript
async sendEvent(eventData) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your-secret-api-key'
    },
    body: JSON.stringify(eventData)
  });
}
```

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:
1. Verify CORS middleware is added
2. Check the allow_origins includes "*" or your extension ID
3. Restart your FastAPI server

### Events Not Appearing in Database

1. Check backend logs for errors
2. Verify MongoDB connection
3. Test endpoint directly with curl
4. Check extension console for network errors

### Performance Issues

If you're receiving too many events:
1. Increase the time tracking interval in event_tracker.js
2. Implement event aggregation on the backend
3. Add database indexes on frequently queried fields
