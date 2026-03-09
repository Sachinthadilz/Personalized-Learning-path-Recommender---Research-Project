/**
 * Background Service Worker for Learning Activity Tracker
 * Handles extension lifecycle, manages storage, and coordinates with content scripts
 */

/**
 * Read the logged-in user from the frontend's localStorage and save
 * their ID to chrome.storage so content scripts on Coursera/etc can use it.
 * The frontend stores user as JSON under the key "user" on localhost:5173.
 */
async function syncUserFromFrontend() {
  try {
    const [tab] = await chrome.tabs.query({ url: 'http://localhost:3000/*' });
    if (!tab) return; // frontend not open

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        try {
          const raw = localStorage.getItem('user');
          if (!raw) return null;
          const user = JSON.parse(raw);
          return user?.id ? String(user.id) : null;
        } catch (e) {
          return null;
        }
      }
    });

    if (result) {
      await chrome.storage.local.set({ studentId: result });
      console.log('[tracker] student ID synced from frontend:', result);
    }
  } catch (e) {
    // scripting.executeScript throws if the tab is not injectable (e.g. still loading)
    console.debug('[tracker] syncUserFromFrontend skipped:', e.message);
  }
}

// Extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Learning Activity Tracker installed', details);

  if (details.reason === 'install') {
    // First-time install: set all defaults
    chrome.storage.local.set({
      studentId: 'anonymous',
      courseId: 'unknown',
      apiBaseURL: 'http://localhost:5000',
      trackingEnabled: true
    });
  } else {
    // Extension update: only migrate stale port, preserve user settings
    chrome.storage.local.get(['apiBaseURL'], (result) => {
      if (!result.apiBaseURL || result.apiBaseURL.includes('localhost:8000') || result.apiBaseURL.includes('localhost:8080')) {
        console.log('Migrating apiBaseURL to port 5000');
        chrome.storage.local.set({ apiBaseURL: 'http://localhost:5000' });
      }
    });
  }

  // Set up retry alarm
  chrome.alarms.create('retryFailedEvents', { periodInMinutes: 5 });
  syncUserFromFrontend();
});

// Sync user and migrate stale port on every browser startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['apiBaseURL'], (result) => {
    if (!result.apiBaseURL || result.apiBaseURL.includes('localhost:8000') || result.apiBaseURL.includes('localhost:8080')) {
      console.log('Startup migration: apiBaseURL → 5000');
      chrome.storage.local.set({ apiBaseURL: 'http://localhost:5000' });
    }
  });
  syncUserFromFrontend();
});

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'retryFailedEvents') {
    retryFailedEvents();
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  switch (request.action) {
    case 'logEvent':
      handleLogEvent(request.data)
        .then(response => sendResponse({ success: true, data: response }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response

    case 'syncStudentId':
      // Sent by the content script running on localhost:3000 after reading localStorage
      if (request.studentId && request.studentId !== 'anonymous') {
        chrome.storage.local.set({ studentId: request.studentId }, () => {
          console.log('[tracker] student ID synced from frontend page:', request.studentId);
        });
      }
      sendResponse({ success: true });
      break;

    case 'getConfig':
      // Also try to refresh the student ID from the frontend on every config fetch
      syncUserFromFrontend().catch(() => {});
      getConfig()
        .then(config => sendResponse({ success: true, config }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'updateConfig':
      updateConfig(request.config)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getStats':
      getStats()
        .then(stats => sendResponse({ success: true, stats }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Sync user when the frontend tab finishes loading (e.g. after login)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http://localhost:3000')) {
    syncUserFromFrontend();
  }
});

/**
 * Handle log event from content script
 */
async function handleLogEvent(eventData) {
  try {
    const config = await getConfig();
    const url = `${config.apiBaseURL}/activity/log-event`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Update stats
    await incrementEventCount();
    
    return result;
  } catch (error) {
    console.error('Error logging event:', error);
    
    // Store failed event
    await storeFailedEvent(eventData);
    
    throw error;
  }
}

/**
 * Get configuration from storage
 */
async function getConfig() {
  const result = await chrome.storage.local.get([
    'studentId',
    'courseId',
    'apiBaseURL',
    'trackingEnabled'
  ]);
  
  return {
    studentId: result.studentId || 'anonymous',
    courseId: result.courseId || 'unknown',
    apiBaseURL: result.apiBaseURL || 'http://localhost:5000',
    trackingEnabled: result.trackingEnabled !== false
  };
}

/**
 * Update configuration in storage
 */
async function updateConfig(config) {
  await chrome.storage.local.set(config);
  console.log('Configuration updated:', config);
  
  // Notify all content scripts of config change
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, {
      action: 'configUpdated',
      config
    }).catch(() => {
      // Ignore errors for tabs without content scripts
    });
  });
}

/**
 * Store failed event for later retry
 */
async function storeFailedEvent(eventData) {
  const result = await chrome.storage.local.get(['failedEvents']);
  const failedEvents = result.failedEvents || [];
  
  failedEvents.push({
    ...eventData,
    failedAt: new Date().toISOString()
  });
  
  // Keep only last 100 failed events
  if (failedEvents.length > 100) {
    failedEvents.splice(0, failedEvents.length - 100);
  }
  
  await chrome.storage.local.set({ failedEvents });
  console.log('Failed event stored, total:', failedEvents.length);
}

/**
 * Retry failed events
 */
async function retryFailedEvents() {
  const result = await chrome.storage.local.get(['failedEvents']);
  const failedEvents = result.failedEvents || [];
  
  if (failedEvents.length === 0) {
    return;
  }

  console.log(`Retrying ${failedEvents.length} failed events`);
  const config = await getConfig();
  const url = `${config.apiBaseURL}/activity/log-event`;
  const remainingEvents = [];

  for (const event of failedEvents) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });

      if (response.ok) {
        console.log('Retry successful for event');
        await incrementEventCount();
      } else {
        remainingEvents.push(event);
      }
    } catch (error) {
      console.error('Retry failed:', error);
      remainingEvents.push(event);
    }
  }

  await chrome.storage.local.set({ failedEvents: remainingEvents });
  console.log(`Retry complete. Remaining failed events: ${remainingEvents.length}`);
}

/**
 * Increment event count in stats
 */
async function incrementEventCount() {
  const result = await chrome.storage.local.get(['stats']);
  const stats = result.stats || { totalEvents: 0, lastEventTime: null };
  
  stats.totalEvents++;
  stats.lastEventTime = new Date().toISOString();
  
  await chrome.storage.local.set({ stats });
}

/**
 * Get statistics
 */
async function getStats() {
  const result = await chrome.storage.local.get(['stats', 'failedEvents']);
  const stats = result.stats || { totalEvents: 0, lastEventTime: null };
  const failedEvents = result.failedEvents || [];
  
  return {
    ...stats,
    failedEventsCount: failedEvents.length
  };
}

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Learning Activity Tracker started');
  
  // Retry failed events on startup
  retryFailedEvents();
});

console.log('Background service worker loaded');
