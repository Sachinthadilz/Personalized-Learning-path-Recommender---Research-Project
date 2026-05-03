# Learning Activity Tracker - Browser Extension

A Chrome/Edge browser extension (Manifest V3) that tracks student learning activities on course platforms and sends them to a Node.js backend for learning analytics.

## Features

- 📊 **Comprehensive Activity Tracking**
  - Page visits and navigation
  - Video interactions (play, pause, seek, complete)
  - Resource clicks (documents, links, materials)
  - Time spent on course pages
  - Button and UI interactions

- 🚀 **Robust Event Delivery**
  - Asynchronous event sending
  - Automatic retry mechanism for failed events
  - Offline event storage and retry
  - Non-intrusive background processing

- 🎯 **Platform Support**
  - Coursera
  - Udemy
  - edX
  - Khan Academy
  - Udacity
  - Custom platforms (easily extensible)

- ⚙️ **User Configuration**
  - Student ID management
  - Course ID tracking (auto-detected or manual)
  - Custom API endpoint configuration
  - Enable/disable tracking toggle
  - Real-time statistics dashboard

## Extension Structure

```
browser-extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker for background tasks
├── content.js            # Main content script entry point
├── event_tracker.js      # Event tracking logic
├── api_client.js         # API communication handler
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic and configuration
├── icons/                # Extension icons (16x16, 48x48, 128x128)
└── README.md             # This file
```

## Installation

### 1. Prerequisites

- Chrome, Edge, or any Chromium-based browser
- Running Node.js backend-auth with `/logs` endpoint (port 5001)

### 2. Load Extension in Development Mode

1. **Clone or download** this extension folder

2. **Open your browser's extension page**:
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the extension**:
   - Click "Load unpacked"
   - Select the `browser-extension` folder
   - The extension should now appear in your extensions list

5. **Pin the extension**:
   - Click the extensions icon (puzzle piece) in the toolbar
   - Click the pin icon next to "Learning Activity Tracker"

### 3. Create Extension Icons

Before loading the extension, create placeholder icons or use your own:

```bash
# Create icons directory
mkdir icons

# You can use any image editing tool to create:
# - icon16.png (16x16 pixels)
# - icon48.png (48x48 pixels)
# - icon128.png (128x128 pixels)
```

Or use the provided icon generation script (requires Python with Pillow):

```bash
python generate_icons.py
```

## Configuration

### Initial Setup

1. Click the extension icon in your browser toolbar
2. Configure the following settings:
   - **Student ID**: Your unique student identifier
   - **Course ID**: Leave empty for auto-detection or enter manually
   - **API URL**: Your backend URL (default: `http://localhost:5001`)
   - **Enable Tracking**: Toggle to start/stop tracking

3. Click "Save Configuration"

### Backend Configuration

Ensure your Node.js backend-auth has the `/logs` endpoint:

```javascript
const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { student_id, course_id, event_type, timestamp, duration, metadata } = req.body;
    
    const doc = await ActivityLog.create({
      student_id,
      course_id,
      event_type,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      duration: duration ?? null,
      metadata: metadata || {},
    });

    return res.status(201).json({ success: true, log_id: doc.log_id });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
```

### CORS Configuration

Add CORS middleware to your Node.js backend-auth to allow extension requests:

```javascript
const cors = require('cors');

app.use(cors({
  origin: '*', // In production, specify your extension ID
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Event Types

The extension tracks the following event types:

| Event Type | Description | Metadata |
|------------|-------------|----------|
| `page_visit` | User visits a course page | page_title, referrer |
| `time_tracking` | Periodic active time updates (every 30s) | page_title |
| `page_exit` | User leaves a page | total_time_spent |
| `video_play` | Video playback starts | video_id, current_time, duration |
| `video_pause` | Video playback pauses | video_id, watch_duration, current_time |
| `video_seek` | User seeks to different timestamp | video_id, current_time |
| `video_complete` | Video playback completes | video_id, total_watch_time |
| `resource_click` | User clicks a resource link | resource_url, resource_type |
| `button_click` | User clicks a button | button_text, button_class |

## Event Data Structure

Each event sent to the backend contains:

```json
{
  "student_id": "student123",
  "course_id": "ml-fundamentals",
  "event_type": "video_play",
  "timestamp": "2026-03-08T10:30:00.000Z",
  "duration": 0,
  "page_url": "https://www.coursera.org/learn/ml-fundamentals/lecture/1",
  "session_id": "session_1709892600000_abc123",
  "metadata": {
    "video_id": "lecture-1-intro",
    "current_time": 0,
    "duration": 600
  }
}
```

## Features in Detail

### Time Tracking

- Tracks **active time** only (user is interacting with page)
- Detects **idle periods** (60 seconds of inactivity)
- Pauses tracking when page is hidden/inactive
- Sends updates every 30 seconds
- Final time report when user leaves page

### Video Tracking

- Automatically detects `<video>` elements
- Handles dynamically loaded videos
- Tracks play, pause, seek, and completion events
- Calculates total watch time
- Works with most HTML5 video players

### Resource Tracking

- Monitors clicks on links and downloadable resources
- Categorizes resource types (PDF, video, image, etc.)
- Captures resource URLs and descriptive text

### Offline Support

- Failed events are stored locally
- Automatic retry every 5 minutes
- Manual retry via popup interface
- Keeps up to 100 failed events

### Session Management

- Unique session ID for each page visit
- Groups related events together
- Helps analyze user learning sessions

## Development

### Testing

1. Open a supported course platform (e.g., Coursera)
2. Open browser DevTools (F12)
3. Check the Console tab for tracking logs
4. Click the extension icon to view statistics

### Debugging

Enable verbose logging by checking the console:
- **Content Script logs**: Page console
- **Background Script logs**: Extension service worker console
  - Chrome: `chrome://extensions/` → Click "service worker"
  - Edge: `edge://extensions/` → Click "service worker"

### Extending Platform Support

To add support for new platforms, update `manifest.json`:

```json
{
  "content_scripts": [{
    "matches": [
      "*://your-new-platform.com/*"
    ]
  }]
}
```

Update `extractCourseId()` in `event_tracker.js` to parse course IDs from the new platform.

## Privacy and Security

- All data is sent to YOUR specified backend only
- No data is sent to third parties
- Student ID can be anonymized
- Tracking can be disabled at any time
- All communication is logged for transparency

## Troubleshooting

### Events Not Being Sent

1. Check that your backend is running and accessible
2. Verify the API URL in extension settings
3. Check browser console for errors
4. Ensure CORS is properly configured on backend
5. Try the "Retry Failed Events" button in the popup

### Extension Not Tracking

1. Verify tracking is enabled in extension popup
2. Check that you're on a supported platform
3. Refresh the page after enabling tracking
4. Check console for any JavaScript errors

### Icons Not Displaying

1. Create the `icons/` directory in the extension folder
2. Add PNG images: `icon16.png`, `icon48.png`, `icon128.png`
3. Reload the extension

## Performance Considerations

- Events are sent **asynchronously** - no page blocking
- Minimal CPU usage (passive event listeners)
- Memory-efficient (cleans up old data)
- Network-friendly (batches time tracking, uses retry logic)

## Future Enhancements

- [ ] Quiz/assessment interaction tracking
- [ ] Forum participation tracking
- [ ] Assignment submission tracking
- [ ] Dashboard with detailed analytics
- [ ] Export activity data
- [ ] Multiple student profiles
- [ ] Encrypted data transmission
- [ ] Batch event sending

## API Reference

### Background Script Messages

```javascript
// Log event
chrome.runtime.sendMessage({
  action: 'logEvent',
  data: eventData
});

// Get configuration
chrome.runtime.sendMessage({
  action: 'getConfig'
});

// Update configuration
chrome.runtime.sendMessage({
  action: 'updateConfig',
  config: configData
});

// Get statistics
chrome.runtime.sendMessage({
  action: 'getStats'
});
```

## License

This extension is provided as-is for educational and research purposes.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console logs
3. Verify backend configuration
4. Check network requests in DevTools

## Credits

Built with ❤️ for learning analytics and educational research.
