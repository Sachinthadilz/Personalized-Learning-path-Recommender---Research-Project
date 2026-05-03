/**
 * Event Tracker for monitoring learning activities
 */

class EventTracker {
  constructor() {
    this.defaultFrontendBaseURL = 'http://localhost:3000';
    this.pageLoadTime = Date.now();
    this.lastActivityTime = Date.now();
    this.isActive = true;
    this.idleThreshold = 60000; // 1 minute of inactivity
    this.sendInterval = 30000; // Send time tracking every 30 seconds
    this.activeTime = 0;
    this.sessionId = this.generateSessionId();
    this.videoElements = new Map();
    this.frontendBaseURL = this.defaultFrontendBaseURL;
    this.isFrontendPage = false;
    
    this.init();
  }

  /**
   * Read the logged-in user's ID from the page's localStorage.
    * Works on the configured frontend where authService writes both the flat
   * "student_id" key and the "user" JSON object.
   * Returns null if nothing is found.
   */
  _readStudentIdFromLocalStorage() {
    try {
      const directId = localStorage.getItem('student_id');
      if (directId && directId !== 'anonymous') return directId;
      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.id) return String(user.id);
      }
    } catch (_) {}
    return null;
  }

  /**
   * Get the most reliable student ID available right now.
   * On the configured frontend URL we can read localStorage directly.
   * On external sites (Coursera etc.) we rely on chrome.storage that was
   * synced earlier by content.js / background.js.
   */
  async _resolveStudentId() {
    // On our own frontend, localStorage is the source of truth
    if (this.isFrontendPage) {
      const id = this._readStudentIdFromLocalStorage();
      if (id) {
        this.studentId = id;
        return id;
      }
    }
    
    // On external sites, read from chrome.storage (set by background sync)
    // Check if extension context is still valid first
    const isExtensionValid = typeof chrome !== 'undefined' && 
                            chrome.runtime && 
                            chrome.runtime.id;
    
    if (!isExtensionValid) {
      return this.studentId || 'anonymous';
    }
    
    try {
      const { studentId } = await chrome.storage.local.get(['studentId']);
      if (studentId && studentId !== 'anonymous') {
        this.studentId = studentId;
        return studentId;
      }
    } catch (_) {}
    return this.studentId || 'anonymous';
  }

  /**
   * Initialize the event tracker
   */
  async init() {
    await this.loadConfig();
    this.setupEventListeners();
    this.startTimeTracking();
    this.detectVideos();
    this.trackPageVisit();

    // Poll every 5 s to pick up the real user ID once synced
    // Stop polling if extension context becomes invalid
    this.pollingInterval = setInterval(async () => {
      const isExtensionValid = typeof chrome !== 'undefined' && 
                              chrome.runtime && 
                              chrome.runtime.id;
      
      if (!isExtensionValid) {
        console.log('Extension context invalidated, stopping ID polling');
        clearInterval(this.pollingInterval);
        return;
      }
      
      const id = await this._resolveStudentId();
      if (id && id !== 'anonymous' && id !== this.studentId) {
        this.studentId = id;
      }
    }, 5000);
  }

  /**
   * Load configuration from storage
   */
  async loadConfig() {
    try {
      // Check if extension context is still valid
      const isExtensionValid = typeof chrome !== 'undefined' && 
                              chrome.runtime && 
                              chrome.runtime.id;
      
      if (!isExtensionValid) {
        console.warn('Extension context invalidated, using defaults');
        this.studentId = 'anonymous';
        this.frontendBaseURL = this.defaultFrontendBaseURL;
        this.isFrontendPage = window.location.origin === new URL(this.defaultFrontendBaseURL).origin;
        this.courseId = this.extractCourseId();
        return;
      }

      const result = await chrome.storage.local.get(['studentId', 'courseId', 'apiBaseURL', 'frontendBaseURL']);

      this.frontendBaseURL = result.frontendBaseURL || this.defaultFrontendBaseURL;
      try {
        this.isFrontendPage = window.location.origin === new URL(this.frontendBaseURL).origin;
      } catch {
        this.isFrontendPage = window.location.origin === new URL(this.defaultFrontendBaseURL).origin;
      }

      // On configured frontend, read student ID directly from localStorage
      if (this.isFrontendPage) {
        const localId = this._readStudentIdFromLocalStorage();
        this.studentId = localId || result.studentId || 'anonymous';
      } else {
        this.studentId = result.studentId || 'anonymous';
      }
      this.courseId = result.courseId || this.extractCourseId();

      if (window.apiClient) {
        // Migrate stale port 8000/8080 → 5001 from Chrome storage
        let apiBaseURL = result.apiBaseURL || 'http://localhost:5001';
        if (apiBaseURL.includes('localhost:8000') || apiBaseURL.includes('localhost:8080')) {
          apiBaseURL = 'http://localhost:5001';
          if (isExtensionValid) {
            chrome.storage.local.set({ apiBaseURL });
          }
          console.log('Migrated apiBaseURL in storage → 5001');
        }
        window.apiClient.setBaseURL(apiBaseURL);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      this.frontendBaseURL = this.defaultFrontendBaseURL;
      this.isFrontendPage = window.location.origin === new URL(this.defaultFrontendBaseURL).origin;
      this.studentId = 'anonymous';
      this.courseId = this.extractCourseId();
    }
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract course ID from URL
   */
  extractCourseId() {
    const url = window.location.href;
    const hostname = window.location.hostname;
    
    // For configured frontend - try to extract from page context
    if (this.isFrontendPage) {
      // Try to find course ID from page elements (e.g., viewing a specific course)
      try {
        // Check if we can find course info in the page
        const courseElements = document.querySelectorAll('[data-course-id], [id*="course"]');
        if (courseElements.length > 0) {
          for (const el of courseElements) {
            const courseId = el.getAttribute('data-course-id') || el.id;
            if (courseId && courseId !== 'courses' && !courseId.includes('Tab')) {
              return courseId;
            }
          }
        }
        
        // Fallback: use 'learning-platform' for our own frontend
        return 'learning-platform';
      } catch (e) {
        return 'learning-platform';
      }
    }
    
    // Extract course ID based on platform
    if (hostname.includes('coursera.org')) {
      const match = url.match(/learn\/([^\/\?#]+)/);
      return match ? match[1] : 'not-set';
    } else if (hostname.includes('udemy.com')) {
      const match = url.match(/course\/([^\/\?#]+)/);
      return match ? match[1] : 'not-set';
    } else if (hostname.includes('edx.org')) {
      const match = url.match(/course\/([^\/\?#]+)/);
      return match ? match[1] : 'not-set';
    } else if (hostname.includes('udacity.com')) {
      const match = url.match(/course\/([^\/\?#]+)/);
      return match ? match[1] : 'not-set';
    } else if (hostname.includes('khanacademy.org')) {
      const match = url.match(/\/([^\/\?#]+)$/);
      return match ? match[1] : 'not-set';
    }
    
    return 'not-set';
  }

  /**
   * Setup event listeners for various interactions
   */
  setupEventListeners() {
    // Track user activity for idle detection
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, () => this.updateActivity(), { passive: true });
    });

    // Track clicks on resources (links, buttons, etc.)
    document.addEventListener('click', (e) => this.handleClick(e), true);

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

    // Track beforeunload to send final time tracking
    window.addEventListener('beforeunload', () => this.handlePageUnload());
  }

  /**
   * Update last activity time
   */
  updateActivity() {
    const now = Date.now();
    const wasIdle = !this.isActive;
    
    this.lastActivityTime = now;
    this.isActive = true;

    if (wasIdle) {
      console.log('User became active');
    }
  }

  /**
   * Check if user is idle
   */
  checkIdleStatus() {
    const now = Date.now();
    const idleTime = now - this.lastActivityTime;
    
    if (idleTime > this.idleThreshold && this.isActive) {
      this.isActive = false;
      console.log('User is idle');
    }
  }

  /**
   * Map extension event types to backend EventType enum values
   */
  mapEventType(type) {
    const mapping = {
      'page_visit': 'click',
      'page_exit': 'click',
      'time_tracking': 'click',
      'video_play': 'video_play',
      'video_pause': 'video_pause',
      'video_complete': 'video_complete',
      'video_seek': 'video_play',
      'resource_click': 'resource_view',
      'button_click': 'click'
    };
    return mapping[type] || 'click';
  }

  /**
   * Build an event payload compatible with the backend ActivityLogEntry schema.
   * Resolves the student ID from the best available source each time.
   */
  async buildEvent(eventType, duration, extraMetadata = {}) {
    const studentId = await this._resolveStudentId();
    return {
      student_id: studentId,
      course_id: this.courseId,
      event_type: this.mapEventType(eventType),
      timestamp: new Date().toISOString(),
      duration: duration || null,
      metadata: {
        page_url: window.location.href,
        session_id: this.sessionId,
        original_event: eventType,
        ...extraMetadata
      }
    };
  }

  /**
   * Track page visit
   */
  async trackPageVisit() {
    const event = await this.buildEvent('page_visit', null, {
      page_title: document.title,
      referrer: document.referrer
    });

    await this.sendEvent(event);
  }

  /**
   * Start time tracking
   */
  startTimeTracking() {
    this.timeTrackingInterval = setInterval(() => {
      const isExtensionValid = typeof chrome !== 'undefined' && 
                              chrome.runtime && 
                              chrome.runtime.id;
      
      if (!isExtensionValid) {
        console.log('Extension context invalidated, stopping time tracking');
        clearInterval(this.timeTrackingInterval);
        return;
      }
      
      this.checkIdleStatus();
      
      if (this.isActive && !document.hidden) {
        this.activeTime += this.sendInterval;
        this.sendTimeTracking();
      }
    }, this.sendInterval);
  }

  /**
   * Send time tracking event
   */
  async sendTimeTracking() {
    const event = await this.buildEvent('time_tracking', Math.floor(this.activeTime / 1000), {
      page_title: document.title
    });

    await this.sendEvent(event);
  }

  /**
   * Handle click events
   */
  async handleClick(e) {
    const target = e.target;
    
    // Check if it's a link or resource
    const link = target.closest('a');
    if (link) {
      await this.trackResourceClick(link);
    }

    // Check if it's a button or interactive element
    const button = target.closest('button, [role="button"]');
    if (button) {
      await this.trackInteraction('button_click', {
        button_text: button.textContent.trim().substring(0, 100),
        button_class: button.className
      });
    }
  }

  /**
   * Track resource click
   */
  async trackResourceClick(link) {
    const href = link.href;
    const text = link.textContent.trim();

    const event = await this.buildEvent('resource_click', null, {
      resource_url: href,
      resource_text: text.substring(0, 100),
      resource_type: this.getResourceType(href)
    });

    await this.sendEvent(event);
  }

  /**
   * Detect and track video elements
   */
  detectVideos() {
    // Look for video elements
    const videos = document.querySelectorAll('video');
    videos.forEach(video => this.attachVideoListeners(video));

    // Use MutationObserver to detect dynamically added videos
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'VIDEO') {
            this.attachVideoListeners(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('video').forEach(video => {
              this.attachVideoListeners(video);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Attach listeners to video elements
   */
  attachVideoListeners(video) {
    const videoId = this.getVideoId(video);
    
    if (this.videoElements.has(videoId)) {
      return; // Already tracking this video
    }

    const videoData = {
      element: video,
      startTime: null,
      totalWatchTime: 0
    };

    this.videoElements.set(videoId, videoData);

    video.addEventListener('play', () => this.handleVideoPlay(videoId));
    video.addEventListener('pause', () => this.handleVideoPause(videoId));
    video.addEventListener('ended', () => this.handleVideoEnd(videoId));
    video.addEventListener('seeked', () => this.handleVideoSeek(videoId));
  }

  /**
   * Get unique identifier for video
   */
  getVideoId(video) {
    return video.src || video.currentSrc || `video_${Date.now()}_${Math.random()}`;
  }

  /**
   * Handle video play
   */
  async handleVideoPlay(videoId) {
    const videoData = this.videoElements.get(videoId);
    if (videoData) {
      videoData.startTime = Date.now();
      
      await this.trackInteraction('video_play', {
        video_id: videoId,
        current_time: videoData.element.currentTime,
        duration: videoData.element.duration
      });
    }
  }

  /**
   * Handle video pause
   */
  async handleVideoPause(videoId) {
    const videoData = this.videoElements.get(videoId);
    if (videoData && videoData.startTime) {
      const watchDuration = Date.now() - videoData.startTime;
      videoData.totalWatchTime += watchDuration;
      videoData.startTime = null;

      const watchSecs = Math.floor(watchDuration / 1000);
      // Build event directly so we can set duration = watchSecs on the event
      const event = await this.buildEvent('video_pause', watchSecs, {
        video_id: videoId,
        watch_duration: watchSecs,
        current_time: videoData.element.currentTime,
        total_watch_time: Math.floor(videoData.totalWatchTime / 1000)
      });
      await this.sendEvent(event);
    }
  }

  /**
   * Handle video end
   */
  async handleVideoEnd(videoId) {
    const videoData = this.videoElements.get(videoId);
    if (videoData) {
      if (videoData.startTime) {
        const watchDuration = Date.now() - videoData.startTime;
        videoData.totalWatchTime += watchDuration;
      }

      const totalWatchSecs = Math.floor(videoData.totalWatchTime / 1000);
      // Build event directly so we can set duration = totalWatchSecs on the event
      const event = await this.buildEvent('video_complete', totalWatchSecs, {
        video_id: videoId,
        total_watch_time: totalWatchSecs,
        video_duration: videoData.element.duration
      });
      await this.sendEvent(event);
    }
  }

  /**
   * Handle video seek
   */
  async handleVideoSeek(videoId) {
    const videoData = this.videoElements.get(videoId);
    if (videoData) {
      await this.trackInteraction('video_seek', {
        video_id: videoId,
        current_time: videoData.element.currentTime
      });
    }
  }

  /**
   * Track general interaction
   */
  async trackInteraction(interactionType, metadata = {}) {
    const event = await this.buildEvent(interactionType, null, metadata);

    await this.sendEvent(event);
  }

  /**
   * Handle visibility change
   */
  handleVisibilityChange() {
    if (document.hidden) {
      console.log('Page hidden');
      this.isActive = false;
    } else {
      console.log('Page visible');
      this.updateActivity();
    }
  }

  /**
   * Handle page unload
   */
  handlePageUnload() {
    // Send final time tracking synchronously via sendBeacon (can't await)
    // On configured frontend we can read localStorage synchronously for the real ID
    let studentId = this.studentId;
    if (this.isFrontendPage) {
      const localId = this._readStudentIdFromLocalStorage();
      if (localId) studentId = localId;
    }
    if (this.activeTime > 0) {
      const event = {
        student_id: studentId,
        course_id: this.courseId,
        event_type: 'click',
        timestamp: new Date().toISOString(),
        duration: Math.floor(this.activeTime / 1000),
        metadata: {
          page_url: window.location.href,
          session_id: this.sessionId,
          original_event: 'page_exit'
        }
      };

      // Use sendBeacon for reliable delivery on page unload
      const url = `${window.apiClient.baseURL}${window.apiClient.endpoint}`;
      const blob = new Blob([JSON.stringify(event)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    }
  }

  /**
   * Get resource type from URL
   */
  getResourceType(url) {
    const extension = url.split('.').pop().toLowerCase().split('?')[0];
    const typeMap = {
      'pdf': 'document',
      'doc': 'document',
      'docx': 'document',
      'ppt': 'presentation',
      'pptx': 'presentation',
      'mp4': 'video',
      'mp3': 'audio',
      'zip': 'archive',
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image'
    };

    return typeMap[extension] || 'link';
  }

  /**
   * Send event via background script so it can patch the student ID
   * from the frontend's localStorage before forwarding to the backend.
   * Falls back to direct fetch if the background message fails.
   */
  /**
   * Send event to backend via background script or direct fetch
   */
  async sendEvent(event) {
    // Check if extension context is still valid
    const isExtensionValid = typeof chrome !== 'undefined' && 
                            chrome.runtime && 
                            chrome.runtime.id;
    
    if (isExtensionValid) {
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            { action: 'logEvent', data: event },
            (resp) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (resp && resp.success) {
                resolve(resp);
              } else {
                reject(new Error(resp?.error || 'logEvent failed'));
              }
            }
          );
        });
        console.log('Event logged successfully:', response.data);
        return;
      } catch (bgError) {
        console.warn('Background send failed, using direct fetch:', bgError.message);
      }
    }
    
    // Fallback: send directly via apiClient
    try {
      if (window.apiClient) {
        await window.apiClient.sendEvent(event);
        console.log('Event sent via direct fetch');
      }
    } catch (error) {
      console.error('Error sending event:', error);
      // Store in localStorage as last resort when chrome.storage is unavailable
      this.storeFailedEventLocally(event);
    }
  }

  /**
   * Store failed event in localStorage when extension context is invalidated
   */
  storeFailedEventLocally(event) {
    try {
      const key = 'learningTracker_failedEvents';
      const stored = localStorage.getItem(key);
      const failedEvents = stored ? JSON.parse(stored) : [];
      
      failedEvents.push({
        ...event,
        failedAt: new Date().toISOString()
      });
      
      // Keep only last 50 events in localStorage
      if (failedEvents.length > 50) {
        failedEvents.splice(0, failedEvents.length - 50);
      }
      
      localStorage.setItem(key, JSON.stringify(failedEvents));
      console.log('Event stored in localStorage for later retry');
    } catch (error) {
      console.error('Failed to store event locally:', error);
    }
  }
}

// Initialize event tracker when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.eventTracker = new EventTracker();
  });
} else {
  window.eventTracker = new EventTracker();
}
