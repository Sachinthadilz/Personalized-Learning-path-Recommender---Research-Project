/**
 * Popup Script - Handles UI interactions and configuration
 */

// Load configuration when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await loadStats();
  setupEventListeners();
});

/**
 * Load configuration from storage
 */
async function loadConfig() {
  try {
    const result = await chrome.storage.local.get([
      'studentId',
      'courseId',
      'apiBaseURL',
      'frontendBaseURL',
      'trackingEnabled'
    ]);

    // Get current tab info to show context
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const isCoursera = tab?.url?.includes('coursera.org');
    const isUdemy = tab?.url?.includes('udemy.com');
    const isEdX = tab?.url?.includes('edx.org');
    const currentFrontendURL = result.frontendBaseURL || 'http://localhost:3000';
    const isFrontendTab = tab?.url?.startsWith(currentFrontendURL);

    const courseIdInput = document.getElementById('courseId');
    courseIdInput.value = result.courseId || '';
    
    // Show helpful placeholder based on detected site
    if (isCoursera || isUdemy || isEdX) {
      courseIdInput.placeholder = 'Auto-detected from URL';
    } else if (isFrontendTab) {
      courseIdInput.placeholder = 'learning-platform (detected)';
    } else if (!result.courseId || result.courseId === 'unknown') {
      courseIdInput.placeholder = 'Enter course ID manually';
    }

    document.getElementById('studentId').value = result.studentId || '';
    document.getElementById('apiBaseURL').value = result.apiBaseURL || 'http://localhost:5001';
    document.getElementById('frontendBaseURL').value = currentFrontendURL;
    document.getElementById('trackingEnabled').checked = result.trackingEnabled !== false;

    updateStatus(result.trackingEnabled !== false);
  } catch (error) {
    console.error('Error loading config:', error);
    showMessage('Error loading configuration', 'error');
  }
}

/**
 * Load statistics from storage
 */
async function loadStats() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStats' });
    
    if (response.success) {
      document.getElementById('totalEvents').textContent = response.stats.totalEvents || 0;
      document.getElementById('failedEvents').textContent = response.stats.failedEventsCount || 0;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Save configuration
  document.getElementById('saveConfig').addEventListener('click', saveConfig);

  // Retry failed events
  document.getElementById('retryFailed').addEventListener('click', retryFailedEvents);

  // Update status when tracking toggle changes
  document.getElementById('trackingEnabled').addEventListener('change', (e) => {
    updateStatus(e.target.checked);
  });
}

/**
 * Save configuration
 */
async function saveConfig() {
  try {
    const courseIdValue = document.getElementById('courseId').value.trim();
    
    const config = {
      studentId: document.getElementById('studentId').value.trim() || 'anonymous',
      courseId: courseIdValue || 'not-set',
      apiBaseURL: document.getElementById('apiBaseURL').value.trim() || 'http://localhost:5001',
      frontendBaseURL: document.getElementById('frontendBaseURL').value.trim() || 'http://localhost:3000',
      trackingEnabled: document.getElementById('trackingEnabled').checked
    };

    // Validate API URL
    try {
      new URL(config.apiBaseURL);
    } catch (error) {
      showMessage('Invalid API URL', 'error');
      return;
    }

    try {
      new URL(config.frontendBaseURL);
    } catch (error) {
      showMessage('Invalid Frontend URL', 'error');
      return;
    }

    const response = await chrome.runtime.sendMessage({
      action: 'updateConfig',
      config: config
    });

    if (response.success) {
      showMessage('Configuration saved successfully!', 'success');
      updateStatus(config.trackingEnabled);
    } else {
      showMessage('Error saving configuration', 'error');
    }
  } catch (error) {
    console.error('Error saving config:', error);
    showMessage('Error saving configuration', 'error');
  }
}

/**
 * Retry failed events
 */
async function retryFailedEvents() {
  const btn = document.getElementById('retryFailed');
  btn.disabled = true;
  btn.textContent = 'Retrying...';

  try {
    // Get failed events count before retry
    const beforeStats = await chrome.runtime.sendMessage({ action: 'getStats' });
    const failedCount = beforeStats.stats?.failedEventsCount || 0;

    if (failedCount === 0) {
      showMessage('No failed events to retry', 'success');
      btn.disabled = false;
      btn.textContent = 'Retry Failed Events';
      return;
    }

    // Trigger retry in background
    const result = await chrome.storage.local.get(['failedEvents']);
    const failedEvents = result.failedEvents || [];

    // Send each failed event
    const config = await chrome.storage.local.get(['apiBaseURL']);
    const apiURL = config.apiBaseURL || 'http://localhost:5001';
    let successCount = 0;

    for (const event of failedEvents) {
      try {
        const response = await fetch(`${apiURL}/logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event)
        });

        if (response.ok) {
          successCount++;
        }
      } catch (error) {
        console.error('Retry failed for event:', error);
      }
    }

    // Clear successful events
    const remaining = failedEvents.slice(successCount);
    await chrome.storage.local.set({ failedEvents: remaining });

    showMessage(`Successfully retried ${successCount}/${failedCount} events`, 'success');
    await loadStats();
  } catch (error) {
    console.error('Error retrying failed events:', error);
    showMessage('Error retrying events', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Retry Failed Events';
  }
}

/**
 * Update status indicator
 */
function updateStatus(isActive) {
  const statusElement = document.getElementById('status');
  const statusText = statusElement.querySelector('.status-text');

  if (isActive) {
    statusElement.className = 'status';
    statusText.textContent = 'Tracking Active';
  } else {
    statusElement.className = 'status inactive';
    statusText.textContent = 'Tracking Disabled';
  }
}

/**
 * Show message to user
 */
function showMessage(text, type) {
  const messageElement = document.getElementById('message');
  messageElement.textContent = text;
  messageElement.className = `message ${type}`;
  messageElement.style.display = 'flex';

  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 3000);
}

// Refresh stats every 5 seconds when popup is open
setInterval(loadStats, 5000);
