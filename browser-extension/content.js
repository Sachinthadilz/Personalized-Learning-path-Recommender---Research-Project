/**
 * Content Script - Main entry point
 * Coordinates with the event tracker and communicates with the background script
 */

console.log('Learning Activity Tracker - Content script loaded');

// ── Frontend user-ID sync ─────────────────────────────────────────────────
// When this script runs on our own frontend (localhost:3000) it can read
// localStorage directly.  Push the logged-in user ID to the background so
// content scripts on Coursera/etc always have the real student ID.
if (window.location.hostname === 'localhost' && window.location.port === '3000') {
  let _lastSyncedId = null;

  function pushUserIdToBackground() {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return;
      const user = JSON.parse(raw);
      const id = user?.id ? String(user.id) : null;
      if (id && id !== _lastSyncedId) {
        _lastSyncedId = id;
        chrome.runtime.sendMessage({ action: 'syncStudentId', studentId: id })
          .catch(() => {});
        console.log('[tracker] pushed student ID from frontend:', id);
      }
    } catch (e) {}
  }

  // Push immediately on page load, then poll every 3 s to catch login
  pushUserIdToBackground();
  setInterval(pushUserIdToBackground, 3000);
}
// ─────────────────────────────────────────────────────────────────────────────

// Check if tracking is enabled
chrome.storage.local.get(['trackingEnabled'], (result) => {
  if (result.trackingEnabled === false) {
    console.log('Tracking is disabled');
    return;
  }

  console.log('Tracking is enabled for:', window.location.href);
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'configUpdated') {
    console.log('Configuration updated, reloading tracker...');
    
    // Reload the event tracker with new config
    if (window.eventTracker) {
      window.eventTracker.loadConfig().then(() => {
        console.log('Tracker configuration reloaded');
      });
    }
    
    sendResponse({ success: true });
  }
  
  return true;
});

// Listen for page visibility to pause/resume tracking
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('Page hidden - tracking paused');
  } else {
    console.log('Page visible - tracking resumed');
  }
});

// Notify background script that content script is ready
chrome.runtime.sendMessage({
  action: 'contentScriptReady',
  url: window.location.href
}).catch(error => {
  console.log('Could not notify background script:', error);
});

// Handle errors
window.addEventListener('error', (event) => {
  console.error('Content script error:', event.error);
});

// Log when the user is about to leave the page
window.addEventListener('beforeunload', () => {
  console.log('User leaving page:', window.location.href);
});

console.log('Content script initialization complete');
