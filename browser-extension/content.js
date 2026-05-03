/**
 * Content Script - Main entry point
 * Coordinates with the event tracker and communicates with the background script
 */

console.log('Learning Activity Tracker - Content script loaded');

const DEFAULT_FRONTEND_BASE_URL = 'http://localhost:3000';

async function getFrontendBaseURL() {
  try {
    const result = await chrome.storage.local.get(['frontendBaseURL']);
    return result.frontendBaseURL || DEFAULT_FRONTEND_BASE_URL;
  } catch {
    return DEFAULT_FRONTEND_BASE_URL;
  }
}

// ── Frontend user-ID sync ─────────────────────────────────────────────────
// When this script runs on the configured frontend URL, it can read
// localStorage directly and push the user ID to the background service worker.
let _lastSyncedId = null;

async function maybeSyncFrontendUserId() {
  const frontendBaseURL = await getFrontendBaseURL();
  let frontendOrigin;
  try {
    frontendOrigin = new URL(frontendBaseURL).origin;
  } catch {
    frontendOrigin = new URL(DEFAULT_FRONTEND_BASE_URL).origin;
  }

  if (window.location.origin !== frontendOrigin) {
    return;
  }

  function pushUserIdToBackground() {
    try {
      // Try the flat key first (written by authService on login/register)
      let id = localStorage.getItem('student_id') || null;

      // Fall back to parsing the full user JSON object
      if (!id) {
        const raw = localStorage.getItem('user');
        if (raw) {
          const user = JSON.parse(raw);
          id = user?.id ? String(user.id) : null;
        }
      }

      if (id) {
        // Directly patch the event tracker running in the same page (instant, no async)
        if (window.eventTracker && window.eventTracker.studentId !== id) {
          window.eventTracker.studentId = id;
        }

        // Also push to background so Coursera tabs and chrome.storage stay in sync
        if (id !== _lastSyncedId) {
          _lastSyncedId = id;
          chrome.runtime.sendMessage({ action: 'syncStudentId', studentId: id })
            .catch(() => {});
        }
      }
    } catch (e) {}
  }

  // Push immediately on page load, then poll every 3 s to catch login
  pushUserIdToBackground();
  
  // Keep a single polling interval; stop when extension context is invalid.
  const userIdInterval = setInterval(() => {
    const isExtensionValid = typeof chrome !== 'undefined' && 
                            chrome.runtime && 
                            chrome.runtime.id;
    
    if (!isExtensionValid) {
      console.log('Extension context invalidated, stopping user ID sync');
      clearInterval(userIdInterval);
      return;
    }
    
    pushUserIdToBackground();
  }, 5000);
}

maybeSyncFrontendUserId().catch(() => {});
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
