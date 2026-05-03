/**
 * API Client for communicating with the Node.js backend
 */

class APIClient {
  constructor() {
    this.baseURL = 'http://localhost:5001';
    this.endpoint = '/logs';
    this.retryAttempts = 3;
    this.retryDelay = 1000; // ms
    this.duplicateWindowMs = 5000;
  }

  /**
   * Build a stable hash for an event to deduplicate retries.
   */
  getEventHash(eventData) {
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

  addOrMergeFailedEvent(events, eventData) {
    const nowIso = new Date().toISOString();
    const eventHash = this.getEventHash(eventData);
    const nowMs = Date.now();

    const duplicateIndex = events.findIndex((candidate) => {
      if (!candidate || candidate.eventHash !== eventHash) {
        return false;
      }
      const previousMs = Date.parse(candidate.failedAt || '');
      return Number.isFinite(previousMs) && (nowMs - previousMs) <= this.duplicateWindowMs;
    });

    if (duplicateIndex >= 0) {
      events[duplicateIndex] = {
        ...events[duplicateIndex],
        ...eventData,
        eventHash,
        failedAt: nowIso,
      };
      return events;
    }

    events.push({
      ...eventData,
      eventHash,
      failedAt: nowIso,
    });
    return events;
  }

  /**
   * Send an activity event to the backend
   * @param {Object} eventData - The event data to send
   * @returns {Promise<Object>} - Response from the backend
   */
  async sendEvent(eventData) {
    const url = `${this.baseURL}${this.endpoint}`;
    
    try {
      const response = await this.fetchWithRetry(url, {
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
      console.log('Event logged successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending event:', error);
      // Store failed events for later retry
      await this.storeFailedEvent(eventData);
      throw error;
    }
  }

  /**
   * Fetch with retry logic
   * @param {string} url - The URL to fetch
   * @param {Object} options - Fetch options
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Response>}
   */
  async fetchWithRetry(url, options, attempt = 1) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.log(`Retry attempt ${attempt + 1}/${this.retryAttempts}`);
        await this.delay(this.retryDelay * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Store failed events in chrome storage or localStorage as fallback
   * @param {Object} eventData - The event data that failed to send
   */
  async storeFailedEvent(eventData) {
    // Check if extension context is still valid
    const isExtensionValid = typeof chrome !== 'undefined' && 
                            chrome.runtime && 
                            chrome.runtime.id;
    
    if (isExtensionValid) {
      try {
        const result = await chrome.storage.local.get(['failedEvents']);
        const failedEvents = result.failedEvents || [];
        this.addOrMergeFailedEvent(failedEvents, eventData);
        
        // Keep only last 100 events
        if (failedEvents.length > 100) {
          failedEvents.splice(0, failedEvents.length - 100);
        }
        
        await chrome.storage.local.set({ failedEvents });
        console.log('Failed event stored in chrome.storage for later retry');
        return;
      } catch (error) {
        console.warn('Chrome storage unavailable, using localStorage:', error.message);
      }
    }
    
    // Fallback to localStorage when extension context is invalidated
    try {
      const key = 'learningTracker_failedEvents';
      const stored = localStorage.getItem(key);
      const failedEvents = stored ? JSON.parse(stored) : [];
      
      this.addOrMergeFailedEvent(failedEvents, eventData);
      
      // Keep only last 50 events in localStorage
      if (failedEvents.length > 50) {
        failedEvents.splice(0, failedEvents.length - 50);
      }
      
      localStorage.setItem(key, JSON.stringify(failedEvents));
      console.log('Failed event stored in localStorage for later retry');
    } catch (error) {
      console.error('Error storing failed event:', error);
    }
  }

  /**
   * Retry sending failed events
   */
  async retryFailedEvents() {
    try {
      const result = await chrome.storage.local.get(['failedEvents']);
      const failedEvents = result.failedEvents || [];
      
      if (failedEvents.length === 0) {
        return;
      }

      console.log(`Retrying ${failedEvents.length} failed events`);
      const remainingEvents = [];

      for (const event of failedEvents) {
        try {
          await this.sendEvent(event);
          console.log('Retry successful for event:', event);
        } catch (error) {
          // Keep events that still fail
          remainingEvents.push(event);
        }
      }

      await chrome.storage.local.set({ failedEvents: remainingEvents });
    } catch (error) {
      console.error('Error retrying failed events:', error);
    }
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update the base URL for the API
   * @param {string} url - New base URL
   */
  setBaseURL(url) {
    this.baseURL = url;
  }
}

// Create a singleton instance
const apiClient = new APIClient();

// Make it available globally if in content script context
if (typeof window !== 'undefined') {
  window.apiClient = apiClient;
}
