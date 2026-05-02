# Backend Integration Example

This document shows how to integrate the browser extension with your existing Node.js backend-auth.

## Update your Node.js Backend

### 1. Add CORS Middleware

Update your `backend-auth/src/app.js` to include CORS support:

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// Add CORS middleware
app.use(cors({
  origin: '*', // In production, specify chrome-extension://[your-extension-id]
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
```

### 2. Verify the /logs Endpoint

Make sure your existing endpoint matches this structure:

```javascript
const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');

router.post('/', async (req, res) => {
  /**
   * Log a student activity event
   */
  try {
    const { student_id, course_id, event_type, timestamp, duration, page_url, session_id, metadata } = req.body;
    
    console.log(`Received event: ${event_type} from student ${student_id}`);
    
    // Store in MongoDB
    const doc = await ActivityLog.create({
      student_id,
      course_id,
      event_type,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      duration: duration ?? null,
      page_url,
      session_id,
      metadata: metadata || {},
    });
    
    return res.status(201).json({
      status: 'success',
      message: 'Event logged successfully',
      event_id: doc.log_id
    });
  } catch (error) {
    console.error('Error logging event:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
```

### 3. MongoDB Integration

Your ActivityLog model should look like this:

```javascript
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const activityLogSchema = new mongoose.Schema({
  log_id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
  },
  student_id: {
    type: String,
    required: true,
    index: true,
  },
  course_id: {
    type: String,
    required: true,
    index: true,
  },
  event_type: {
    type: String,
    required: true,
    enum: ['page_visit', 'video_play', 'video_pause', 'video_complete', 'quiz_start', 'quiz_submit', 'resource_click'],
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  duration: {
    type: Number,
    default: null,
  },
  page_url: {
    type: String,
  },
  session_id: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
  collection: 'activity_logs',
});-auth
npm run dev
```

### 2. Test the Endpoint

Use curl or Postman to test:

```bash
curl -X POST http://localhost:5001/logs \
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
  "event_id": "generated-uuid"
}
```

### 3. Load the Extension

1. Follow the installation steps in README.md
2. Configure the extension with your student ID
3. Visit a supported course platform
4. Check your backend logs for incoming events

## Event Analysis Examples

### Query Recent Events

```javascript
router.get('/:student_id', async (req, res) => {
  /**
   * Get recent events for a student
   */
  try {
    const { student_id } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    const events = await ActivityLog.find({ student_id })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    return res.json({ events });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### Calculate Time Spent

```javascript
router.get('/analytics/time-spent/:student_id', async (req, res) => {
  /**
   * Calculate total time spent by student
   */
  try {
    const { student_id } = req.params;
    const { course_id } = req.query;
    
    const matchStage = { student_id };
    if (course_id) {
      matchStage.course_id = course_id;
    }
    
    const results = await ActivityLog.aggregate([
      { $match: matchStage },
      { $group: {
        _id: '$course_id',
        total_duration: { $sum: '$duration' }
      }}
    ]);
    
    return res.json({ results });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### Video Engagement Analytics

```javascript
router.get('/analytics/video-engagement/:student_id', async (req, res) => {
  /**
   * Analyze video engagement
   */
  try {
    const { student_id } = req.params;
    
    const results = await ActivityLog.aggregate([
      { $match: {
        student_id,
        event_type: { $in: ['video_play', 'video_pause', 'video_complete'] }
      }},
      { $group: {
        _id: '$metadata.video_id',
        plays: { $sum: 1 },
        total_watch_time: { $sum: '$metadata.watch_duration' }
      }}
    ]);
    
    return res.json({ video_engagement: results });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

## Production Considerations

### 1. Extension ID for CORS

In production, update CORS to use your extension ID:

```javascript
app.use(cors({
  origin: [
    'chrome-extension://your-extension-id-here',
    'https://yourdomain.com'
  ],
  credentials: true,
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type']
}));
```

### 2. Rate Limiting

Add rate limiting to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this IP'
});

router.post('/', apiLimiter, async (req, res) => {
  // Your logic here
});
```

### 3. Authentication (Optional)

Add API key authentication:

```javascript
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API Key' });
  }
  next();
};

router.post('/', verifyApiKey, async (req, res) => {
  // Your logic here
});
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
1. Verify CORS middleware is added to app.js
2. Check the origin includes "*" or your extension ID
3. Restart your Node.js server

### Events Not Appearing in Database

1. Check backend logs for errors
2. Verify MongoDB connection in config
3. Test endpoint directly with curl
4. Check extension console for network errors

### Performance Issues

If you're receiving too many events:
1. Increase the time tracking interval in event_tracker.js
2. Implement event aggregation on the backend
3. Add database indexes on frequently queried fields (student_id, timestamp, event_type)
