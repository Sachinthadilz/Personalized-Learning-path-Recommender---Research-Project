/**
 * Background Service Worker for Learning Activity Tracker
 * Handles extension lifecycle, manages storage, and coordinates with content scripts
 */

const DEFAULT_API_BASE_URL = 'http://localhost:5001';
const DEFAULT_FRONTEND_BASE_URL = 'http://localhost:3000';
const SYNC_DEBOUNCE_MS = 2000;
const FAILED_EVENT_DEDUP_MS = 5000;
const TRACKABLE_HOSTS = [
  'coursera.org',
  'udemy.com',
  'edx.org',
  'khanacademy.org',
  'udacity.com',
  'localhost',
  '127.0.0.1'
];

let _syncInFlight = null;
let _lastSyncAt = 0;

function normalizeBaseURL(value, fallback) {
  try {
    const parsed = new URL((value || '').trim() || fallback);
    return parsed.origin;
  } catch {
    return fallback;
  }
}

async function getFrontendBaseURL() {
  const result = await chrome.storage.local.get(['frontendBaseURL']);
  return normalizeBaseURL(result.frontendBaseURL, DEFAULT_FRONTEND_BASE_URL);
}

async function isFrontendTabURL(url) {
  if (!url) return false;
  try {
    const frontendBaseURL = await getFrontendBaseURL();
    return new URL(url).origin === new URL(frontendBaseURL).origin;
  } catch {
    return false;
  }
}

function isTrackableTabURL(url) {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname;
    return TRACKABLE_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function getEventHash(eventData) {
  const payload = [
    eventData.student_id || '',
    eventData.event_type || '',
    eventData.timestamp || '',
    eventData.course_id || ''
  ].join('|');

  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return `evt_${Math.abs(hash)}`;
}

function addOrMergeFailedEvent(events, eventData) {
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();
  const eventHash = getEventHash(eventData);

  const duplicateIndex = events.findIndex((candidate) => {
    if (!candidate || candidate.eventHash !== eventHash) {
      return false;
    }
    const previousMs = Date.parse(candidate.failedAt || '');
    return Number.isFinite(previousMs) && (nowMs - previousMs) <= FAILED_EVENT_DEDUP_MS;
  });

  if (duplicateIndex >= 0) {
    events[duplicateIndex] = {
      ...events[duplicateIndex],
      ...eventData,
      eventHash,
      failedAt: nowIso,
    };
    return;
  }

  events.push({
    ...eventData,
    eventHash,
    failedAt: nowIso,
  });
}

/**
 * Read the logged-in user from the frontend's localStorage and save
 * their ID to chrome.storage so content scripts on Coursera/etc can use it.
 * The frontend stores user as JSON under the key "user" on localhost:5173.
 */
async function _syncUserFromFrontendCore() {
  try {
    const tabs = await chrome.tabs.query({});
    const frontendBaseURL = await getFrontendBaseURL();
    const frontendOrigin = new URL(frontendBaseURL).origin;
    const tab = tabs.find((candidate) => {
      try {
        return new URL(candidate.url).origin === frontendOrigin;
      } catch {
        return false;
      }
    });

    if (!tab) return; // frontend not open

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        try {
          // Prefer the flat key written by authService on every login/register
          const directId = localStorage.getItem('student_id');
          if (directId && directId !== 'anonymous') return directId;
          // Fall back to parsing the user JSON object
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

function syncUserFromFrontend(options = {}) {
  const force = options.force === true;
  const now = Date.now();

  if (_syncInFlight) {
    return _syncInFlight;
  }

  if (!force && now - _lastSyncAt < SYNC_DEBOUNCE_MS) {
    return Promise.resolve();
  }

  _lastSyncAt = now;
  _syncInFlight = _syncUserFromFrontendCore().finally(() => {
    _syncInFlight = null;
  });
  return _syncInFlight;
}

// Extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Learning Activity Tracker installed', details);

  if (details.reason === 'install') {
    // First-time install: set all defaults
    chrome.storage.local.set({
      studentId: 'anonymous',
      courseId: 'not-set',
      apiBaseURL: DEFAULT_API_BASE_URL,
      frontendBaseURL: DEFAULT_FRONTEND_BASE_URL,
      trackingEnabled: true
    });
  } else {
    // Extension update: only migrate stale port, preserve user settings
    chrome.storage.local.get(['apiBaseURL', 'frontendBaseURL'], (result) => {
      if (!result.apiBaseURL || result.apiBaseURL.includes('localhost:8000') || result.apiBaseURL.includes('localhost:8080')) {
        console.log('Migrating apiBaseURL to port 5001');
        chrome.storage.local.set({ apiBaseURL: DEFAULT_API_BASE_URL });
      }
      if (!result.frontendBaseURL) {
        chrome.storage.local.set({ frontendBaseURL: DEFAULT_FRONTEND_BASE_URL });
      }
    });
  }

  // Set up retry alarm
  chrome.alarms.create('retryFailedEvents', { periodInMinutes: 5 });
  // Periodically sync the logged-in user ID from the frontend
  chrome.alarms.create('syncStudentIdAlarm', { periodInMinutes: 1 });
  syncUserFromFrontend({ force: true });
});

// Sync user and migrate stale port on every browser startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Learning Activity Tracker started');
  
  chrome.storage.local.get(['apiBaseURL'], (result) => {
    if (!result.apiBaseURL || result.apiBaseURL.includes('localhost:8000') || result.apiBaseURL.includes('localhost:8080')) {
      console.log('Startup migration: apiBaseURL → 5001');
      chrome.storage.local.set({ apiBaseURL: DEFAULT_API_BASE_URL });
    }
  });
  
  // Sync user ID and retry failed events on startup
  syncUserFromFrontend({ force: true });
  retryFailedEvents();
});

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'retryFailedEvents') {
    retryFailedEvents();
  } else if (alarm.name === 'syncStudentIdAlarm') {
    syncUserFromFrontend();
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  switch (request.action) {
    case 'logEvent':
      // Refresh student ID from the frontend before logging so we never
      // record an event as 'anonymous' if the user has since logged in.
      syncUserFromFrontend()
        .catch(() => {})
        .then(() => chrome.storage.local.get(['studentId']))
        .then(({ studentId }) => {
          // Patch the event if it was built before the ID was synced
          if (studentId && studentId !== 'anonymous') {
            request.data.student_id = studentId;
          }
          return handleLogEvent(request.data);
        })
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

    case 'contentScriptReady':
      // Content script loaded — try to sync the student ID immediately
      syncUserFromFrontend().catch(() => {});
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Sync user when the frontend tab finishes loading (e.g. after login)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) {
    return;
  }

  isFrontendTabURL(tab.url)
    .then((isFrontendTab) => {
      if (isFrontendTab) {
        return syncUserFromFrontend({ force: true });
      }
      return undefined;
    })
    .catch(() => {});
});

/**
 * Handle log event from content script
 */
async function handleLogEvent(eventData) {
  try {
    const config = await getConfig();
    const url = `${config.apiBaseURL}/logs`;

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
    'frontendBaseURL',
    'trackingEnabled'
  ]);
  
  return {
    studentId: result.studentId || 'anonymous',
    courseId: result.courseId || 'not-set',
    apiBaseURL: normalizeBaseURL(result.apiBaseURL, DEFAULT_API_BASE_URL),
    frontendBaseURL: normalizeBaseURL(result.frontendBaseURL, DEFAULT_FRONTEND_BASE_URL),
    trackingEnabled: result.trackingEnabled !== false
  };
}

/**
 * Update configuration in storage
 */
async function updateConfig(config) {
  const normalizedConfig = {
    ...config,
    apiBaseURL: normalizeBaseURL(config.apiBaseURL, DEFAULT_API_BASE_URL),
    frontendBaseURL: normalizeBaseURL(config.frontendBaseURL, DEFAULT_FRONTEND_BASE_URL),
  };

  await chrome.storage.local.set(normalizedConfig);
  console.log('Configuration updated:', config);
  
  // Notify only trackable tabs to reduce noisy sendMessage failures.
  const tabs = await chrome.tabs.query({});
  tabs.filter((tab) => isTrackableTabURL(tab.url)).forEach(tab => {
    chrome.tabs.sendMessage(tab.id, {
      action: 'configUpdated',
      config: normalizedConfig
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
  
  addOrMergeFailedEvent(failedEvents, eventData);
  
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
  const url = `${config.apiBaseURL}/logs`;
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

console.log('Background service worker loaded');
