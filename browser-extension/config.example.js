/**
 * Example Configuration File
 * 
 * This file shows the configuration structure used by the extension.
 * The actual configuration is stored in Chrome's local storage.
 */

const exampleConfig = {
  // Student identifier (required)
  // This can be any unique identifier for the student
  studentId: "student_12345",
  
  // Course identifier (optional - auto-detected from URL)
  // Override this if automatic detection doesn't work
  courseId: "ml-fundamentals",
  
  // Backend API URL (required)
  // Point this to your FastAPI backend
  apiBaseURL: "http://localhost:5000",
  
  // Enable/disable tracking (default: true)
  trackingEnabled: true
};

/**
 * Example Event Structure
 * 
 * This is what gets sent to your backend for each event
 */
const exampleEvent = {
  // Student identifier
  student_id: "student_12345",
  
  // Course identifier
  course_id: "ml-fundamentals",
  
  // Type of event (see list below)
  event_type: "video_play",
  
  // ISO 8601 timestamp
  timestamp: "2026-03-08T10:30:00.000Z",
  
  // Duration in seconds (for time tracking events)
  duration: 0,
  
  // Current page URL
  page_url: "https://www.coursera.org/learn/ml-fundamentals/lecture/1",
  
  // Session identifier (groups related events)
  session_id: "session_1709892600000_abc123",
  
  // Additional event-specific data
  metadata: {
    video_id: "lecture-1-intro",
    current_time: 15.5,
    duration: 600
  }
};

/**
 * Event Types
 * 
 * The extension tracks these types of events:
 */
const eventTypes = {
  // Page navigation
  PAGE_VISIT: "page_visit",           // User visits a page
  PAGE_EXIT: "page_exit",             // User leaves a page
  
  // Time tracking
  TIME_TRACKING: "time_tracking",     // Periodic active time update (every 30s)
  
  // Video interactions
  VIDEO_PLAY: "video_play",           // Video starts playing
  VIDEO_PAUSE: "video_pause",         // Video is paused
  VIDEO_SEEK: "video_seek",           // User seeks to different timestamp
  VIDEO_COMPLETE: "video_complete",   // Video playback completes
  
  // Resource interactions
  RESOURCE_CLICK: "resource_click",   // User clicks a resource link
  
  // UI interactions
  BUTTON_CLICK: "button_click"        // User clicks a button
};

/**
 * Supported Platforms
 * 
 * The extension works on these platforms out of the box:
 */
const supportedPlatforms = [
  "coursera.org",
  "udemy.com",
  "edx.org",
  "khanacademy.org",
  "udacity.com",
  "localhost"  // For testing
];

/**
 * Configuration via Extension Popup
 * 
 * Users can configure the extension through the popup UI:
 * 1. Click the extension icon in the browser toolbar
 * 2. Fill in the Student ID
 * 3. Optionally set a Course ID (or leave blank for auto-detection)
 * 4. Set the API URL (default: http://localhost:5000)
 * 5. Toggle tracking on/off
 * 6. Click "Save Configuration"
 */

/**
 * Programmatic Configuration (for developers)
 * 
 * You can also set configuration programmatically:
 */

// In browser console or content script
chrome.storage.local.set({
  studentId: "student_12345",
  courseId: "ml-fundamentals",
  apiBaseURL: "http://localhost:5000",
  trackingEnabled: true
}, () => {
  console.log("Configuration saved");
});

// Read configuration
chrome.storage.local.get([
  'studentId',
  'courseId',
  'apiBaseURL',
  'trackingEnabled'
], (result) => {
  console.log("Current configuration:", result);
});

/**
 * Custom Event Tracking (for developers)
 * 
 * You can send custom events from your own scripts:
 */

async function sendCustomEvent(eventType, metadata = {}) {
  const config = await chrome.storage.local.get([
    'studentId',
    'courseId',
    'apiBaseURL'
  ]);
  
  const event = {
    student_id: config.studentId || 'anonymous',
    course_id: config.courseId || 'unknown',
    event_type: eventType,
    timestamp: new Date().toISOString(),
    duration: 0,
    page_url: window.location.href,
    session_id: 'custom_session',
    metadata: metadata
  };
  
  // Send via API client
  if (window.apiClient) {
    await window.apiClient.sendEvent(event);
  }
}

// Example: Track custom quiz interaction
// sendCustomEvent('quiz_submit', {
//   quiz_id: 'week1-quiz',
//   score: 85,
//   attempts: 2
// });
