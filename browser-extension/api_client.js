/**
 * API Client for communicating with the FastAPI backend
 */

class APIClient {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.endpoint = '/activity/log-event';
    this.retryAttempts = 3;
    this.retryDelay = 1000; // ms
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
      this.storeFailedEvent(eventData);
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
   * Store failed events in local storage for retry
   * @param {Object} eventData - The event data that failed to send
   */
  async storeFailedEvent(eventData) {
    try {
      const result = await chrome.storage.local.get(['failedEvents']);
      const failedEvents = result.failedEvents || [];
      failedEvents.push({
        ...eventData,
        failedAt: new Date().toISOString()
      });
      await chrome.storage.local.set({ failedEvents });
      console.log('Failed event stored for later retry');
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
