/**
 * Main Application Entry Point
 * Coordinates all components and manages application state
 */

class GmailPurgeApp {
  constructor() {
    this.isInitialized = false;
    this.components = {};
    this.currentView = 'dashboard';
    this.appState = {
      isAuthenticated: false,
      currentEmails: [],
      currentAnalysis: null,
      selectedSender: null,
      selectedSubjects: [],
      lastAnalysisDate: null,
    };

    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('Initializing Gmail Purge Application...');

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Initialize storage
      await this.initializeStorage();

      // Initialize authentication
      await this.initializeAuth();

      // Initialize components
      this.initializeComponents();

      // Set up global event handlers
      this.setupGlobalHandlers();

      // Restore application state
      await this.restoreAppState();

      // Mark as initialized
      this.isInitialized = true;

      console.log('Gmail Purge Application initialized successfully');
      this.showReadyMessage();
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showError(`Failed to initialize application: ${error.message}`);
    }
  }

  /**
   * Initialize storage system
   */
  async initializeStorage() {
    try {
      // Check storage availability
      if (!StorageHelper.isAvailable()) {
        throw new Error(
          'Browser storage is not available. Please enable cookies and local storage.'
        );
      }

      // Initialize storage with app preferences
      const defaultPreferences = {
        theme: 'light',
        emailsPerPage: 50,
        defaultAnalysisPreset: 'all',
        autoRefreshInterval: 0, // 0 = disabled
        showEmailPreviews: true,
        compactView: false,
      };

      const preferences = StorageHelper.loadPreferences();
      if (!preferences || Object.keys(preferences).length === 0) {
        StorageHelper.savePreferences(defaultPreferences);
      }

      console.log('Storage initialized');
    } catch (error) {
      console.error('Storage initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize authentication system
   */
  async initializeAuth() {
    try {
      // Check if configuration is valid before initializing
      if (!validateConfig()) {
        console.log('⚙️ Configuration needed - showing setup instructions');
        this.showConfigurationMessage();
        return;
      }

      // Initialize Gmail authentication
      await gmailAuth.initialize();

      // Initialize Gmail API
      await gmailAPI.initialize();

      // Check if user is already authenticated
      this.appState.isAuthenticated = gmailAuth.isUserSignedIn();

      // Update UI based on initial authentication state
      if (this.appState.isAuthenticated) {
        this.updateUIForAuthenticatedUser();
      } else {
        this.updateUIForUnauthenticatedUser();
      }

      // Set up auth state listeners
      window.addEventListener('gmailAuthSuccess', (_event) => {
        this.appState.isAuthenticated = true;
        this.handleAuthStateChange(true);
      });

      window.addEventListener('gmailAuthSignOut', () => {
        this.appState.isAuthenticated = false;
        this.handleAuthStateChange(false);
      });

      console.log(
        'Authentication initialized. Authenticated:',
        this.appState.isAuthenticated
      );
    } catch (error) {
      console.error('Authentication initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize all components
   */
  initializeComponents() {
    try {
      // Initialize components (they initialize themselves via DOMContentLoaded)
      // We just keep references for coordination
      this.components = {
        dashboard: window.dashboard,
        emailList: window.emailList,
      };

      console.log('Components initialized');
    } catch (error) {
      console.error('Component initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set up global event handlers
   */
  setupGlobalHandlers() {
    // Handle window resize
    window.addEventListener(
      'resize',
      this.debounce(() => {
        this.handleWindowResize();
      }, 250)
    );

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      this.handlePopState(e.state);
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      this.handleConnectionChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleConnectionChange(false);
    });

    // Handle visibility change (tab focus)
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Handle unload (save state)
    window.addEventListener('beforeunload', () => {
      this.saveAppState();
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Auth button click handler
    const authButton = document.getElementById('auth-button');
    if (authButton) {
      authButton.addEventListener('click', async () => {
        try {
          if (gmailAuth.isUserSignedIn()) {
            await gmailAuth.signOut();
          } else {
            await gmailAuth.signIn();
          }
        } catch (error) {
          console.error('Auth button click error:', error);
          this.showMessage('Authentication failed. Please try again.', 'error');
        }
      });
    }

    console.log('Global event handlers set up');
  }

  /**
   * Restore application state from storage
   */
  async restoreAppState() {
    try {
      const savedState = StorageHelper.getItem('appState');
      if (savedState) {
        // Restore non-sensitive state
        this.appState.currentView = savedState.currentView || 'dashboard';
        this.appState.lastAnalysisDate = savedState.lastAnalysisDate;

        // Apply theme
        const preferences = StorageHelper.loadPreferences();
        if (preferences.theme) {
          this.setTheme(preferences.theme);
        }
      }

      console.log('Application state restored');
    } catch (error) {
      console.error('Failed to restore application state:', error);
    }
  }

  /**
   * Save application state to storage
   */
  saveAppState() {
    try {
      const stateToSave = {
        currentView: this.currentView,
        lastAnalysisDate: this.appState.lastAnalysisDate,
        // Don't save sensitive data like emails or auth tokens
      };

      StorageHelper.setItem('appState', stateToSave);
    } catch (error) {
      console.error('Failed to save application state:', error);
    }
  }

  /**
   * Handle authentication state changes
   * @param {boolean} isAuthenticated - Authentication status
   */
  handleAuthStateChange(isAuthenticated) {
    if (isAuthenticated) {
      this.showMessage('Successfully signed in to Gmail', 'success');
      this.updateUIForAuthenticatedUser();
    } else {
      this.showMessage('Signed out of Gmail', 'info');
      this.updateUIForUnauthenticatedUser();
    }
  }

  /**
   * Update UI for authenticated user
   */
  updateUIForAuthenticatedUser() {
    console.log('📱 Updating UI for authenticated user...');

    // Hide welcome screen and show dashboard
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
      welcomeScreen.style.display = 'none';
      console.log('✅ Welcome screen hidden');
    } else {
      console.warn('❌ Welcome screen element not found');
    }
    
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
      dashboard.style.display = 'block';
      console.log('✅ Dashboard shown');
    } else {
      console.warn('❌ Dashboard element not found');
    }

    // Show user info container
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
      userInfo.style.display = 'block';
      console.log('✅ User info container shown');
    }

    // Update auth button
    const authButton = document.getElementById('auth-button');
    if (authButton) {
      authButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sign Out';
      authButton.className = 'btn btn-secondary';
    }

    // Show logout button if it exists
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.style.display = 'inline-flex';
    }

    // Enable analysis features
    const analyzeBtn = document.getElementById('analyze-button');
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      console.log('✅ Analysis button enabled');
    } else {
      console.warn('❌ Analysis button not found');
    }

    // Show user info if available
    this.displayUserInfo();
    
    console.log('📱 UI update for authenticated user complete');
  }

  /**
   * Update UI for unauthenticated user
   */
  updateUIForUnauthenticatedUser() {
    // Show welcome screen and hide dashboard
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
      welcomeScreen.style.display = 'block';
    }
    
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
      dashboard.style.display = 'none';
    }

    // Update auth button
    const authButton = document.getElementById('auth-button');
    if (authButton) {
      authButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Connect Gmail';
      authButton.className = 'btn btn-primary';
    }

    // Hide logout button if it exists
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.style.display = 'none';
    }

    // Disable analysis features
    const analyzeBtn = document.getElementById('analyze-button');
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
    }

    // Clear sensitive data
    this.clearSensitiveData();
  }

  /**
   * Display user information
   */
  async displayUserInfo() {
    try {
      const userInfo = await gmailAuth.getCurrentUser();
      if (userInfo) {
        const userElement = document.getElementById('user-info');
        if (userElement) {
          userElement.innerHTML = `
            <div class="user-display">
              <div class="user-avatar">
                <i class="fas fa-user-circle" style="font-size: 32px; color: #5f6368;"></i>
              </div>
              <div class="user-details">
                <div class="user-email">${userInfo.email}</div>
                <div class="user-stats">
                  ${userInfo.messagesTotal ? `${userInfo.messagesTotal.toLocaleString()} messages` : 'Loading...'}
                </div>
              </div>
            </div>
          `;
        }

        // Also update the user name element if it exists
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
          userNameElement.textContent = userInfo.email;
        }
      }
    } catch (error) {
      console.error('Failed to get user info:', error);
      
      // Show fallback user info
      const userElement = document.getElementById('user-info');
      if (userElement) {
        userElement.innerHTML = `
          <div class="user-display">
            <div class="user-avatar">
              <i class="fas fa-user-circle" style="font-size: 32px; color: #5f6368;"></i>
            </div>
            <div class="user-details">
              <div class="user-email">Gmail User</div>
              <div class="user-stats">Authenticated</div>
            </div>
          </div>
        `;
      }
    }
  }

  /**
   * Sign in to Gmail
   */
  async signIn() {
    try {
      this.showMessage('Signing in...', 'info');
      await gmailAuth.signIn();
    } catch (error) {
      console.error('Sign-in failed:', error);
      this.showError(`Sign-in failed: ${error.message}`);
    }
  }

  /**
   * Sign out of Gmail
   */
  async signOut() {
    try {
      this.showMessage('Signing out...', 'info');
      await gmailAuth.signOut();
      this.clearSensitiveData();
    } catch (error) {
      console.error('Sign-out failed:', error);
      this.showError(`Sign-out failed: ${error.message}`);
    }
  }

  /**
   * Clear sensitive data from memory and storage
   */
  clearSensitiveData() {
    this.appState.currentEmails = [];
    this.appState.currentAnalysis = null;
    this.appState.selectedSender = null;
    this.appState.selectedSubjects = [];

    // Clear from components
    if (this.components.dashboard) {
      this.components.dashboard.currentAnalysis = null;
    }

    if (this.components.emailList) {
      this.components.emailList.currentEmails = [];
      this.components.emailList.hideEmailList();
    }

    // Clear cached data
    StorageHelper.clearCache();

    console.log('Sensitive data cleared');
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    // Update responsive layouts
    this.updateResponsiveLayouts();

    // Save window state
    const preferences = StorageHelper.loadPreferences();
    preferences.windowSize = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    StorageHelper.savePreferences(preferences);
  }

  /**
   * Update responsive layouts
   */
  updateResponsiveLayouts() {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    document.body.classList.toggle('mobile-layout', isMobile);
    document.body.classList.toggle('tablet-layout', isTablet);
    document.body.classList.toggle('desktop-layout', !isMobile && !isTablet);
  }

  /**
   * Handle browser back/forward navigation
   * @param {Object} state - Browser state
   */
  handlePopState(state) {
    if (state && state.view) {
      this.switchView(state.view, false); // Don't push to history
    }
  }

  /**
   * Handle connection status changes
   * @param {boolean} isOnline - Connection status
   */
  handleConnectionChange(isOnline) {
    if (isOnline) {
      this.showMessage('Connection restored', 'success');
      // Retry any failed operations
      this.retryFailedOperations();
    } else {
      this.showMessage(
        'Connection lost. Operating in offline mode.',
        'warning'
      );
    }

    // Update UI to reflect connection status
    document.body.classList.toggle('offline', !isOnline);
  }

  /**
   * Handle tab visibility changes
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Tab is now hidden
      this.saveAppState();
    } else {
      // Tab is now visible
      this.handleTabActivation();
    }
  }

  /**
   * Handle tab activation (coming back to tab)
   */
  handleTabActivation() {
    // Check if we need to refresh data
    const preferences = StorageHelper.loadPreferences();
    if (preferences.autoRefreshInterval > 0) {
      const lastRefresh = StorageHelper.getItem('lastRefresh');
      const now = Date.now();

      if (
        !lastRefresh ||
        now - lastRefresh > preferences.autoRefreshInterval * 60000
      ) {
        this.autoRefreshData();
      }
    }
  }

  /**
   * Auto-refresh data if enabled
   */
  async autoRefreshData() {
    if (this.appState.isAuthenticated && this.appState.currentAnalysis) {
      try {
        console.log('Auto-refreshing data...');
        await this.components.dashboard?.refreshData();
        StorageHelper.setItem('lastRefresh', Date.now());
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('email-search');
      if (searchInput) {
        searchInput.focus();
      }
    }

    // Ctrl/Cmd + R: Refresh data
    if ((e.ctrlKey || e.metaKey) && e.key === 'r' && !e.shiftKey) {
      e.preventDefault();
      this.components.dashboard?.refreshData();
    }

    // Escape: Clear selection or close modals
    if (e.key === 'Escape') {
      // Close any open modals
      const modals = document.querySelectorAll('.modal-overlay');
      modals.forEach((modal) => modal.remove());

      // Clear email selections
      if (this.components.emailList) {
        this.components.emailList.toggleSelectAll(false);
      }
    }
  }

  /**
   * Switch application view
   * @param {string} view - View name
   * @param {boolean} pushState - Whether to push to browser history
   */
  switchView(view, pushState = true) {
    this.currentView = view;

    // Update browser history
    if (pushState) {
      history.pushState({ view }, '', `#${view}`);
    }

    // Delegate to dashboard component
    if (this.components.dashboard) {
      this.components.dashboard.switchView(view);
    }

    // Save state
    this.saveAppState();
  }

  /**
   * Set application theme
   * @param {string} theme - Theme name ('light', 'dark', 'auto')
   */
  setTheme(theme) {
    document.body.setAttribute('data-theme', theme);

    // Save preference
    const preferences = StorageHelper.loadPreferences();
    preferences.theme = theme;
    StorageHelper.savePreferences(preferences);

    console.log('Theme set to:', theme);
  }

  /**
   * Retry failed operations
   */
  async retryFailedOperations() {
    // Implement retry logic for failed API calls
    console.log('Retrying failed operations...');
  }

  /**
   * Show ready message
   */
  showReadyMessage() {
    const readyMsg = document.getElementById('app-ready-message');
    if (readyMsg) {
      readyMsg.style.display = 'block';
      setTimeout(() => {
        readyMsg.style.display = 'none';
      }, 3000);
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    if (this.components.dashboard) {
      this.components.dashboard.showError(message);
    } else {
      console.error('App Error:', message);
      alert(`Error: ${message}`); // Fallback
    }
  }

  /**
   * Show info message with fallback for component availability
   * @param {string} message - Message text
   * @param {string} type - Message type
   */
  showMessage(message, type = 'info') {
    // Try to use dashboard component first
    if (this.components.dashboard && typeof this.components.dashboard.showMessage === 'function') {
      this.components.dashboard.showMessage(message, type);
    } else if (window.dashboard && typeof window.dashboard.showMessage === 'function') {
      // Fallback to global dashboard
      window.dashboard.showMessage(message, type);
    } else {
      // Final fallback - create our own message display
      this._showFallbackMessage(message, type);
    }
  }

  /**
   * Fallback message display when dashboard component is not available
   * @private
   */
  _showFallbackMessage(message, type = 'info') {
    // Create temporary message element
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
      color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
      border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 10000;
      max-width: 300px;
      font-family: Inter, sans-serif;
      font-size: 14px;
    `;
    
    messageEl.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        margin-left: 8px;
        color: inherit;
      ">×</button>
    `;

    document.body.appendChild(messageEl);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageEl.parentElement) {
        messageEl.remove();
      }
    }, 5000);

    // Also log to console
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  /**
   * Show configuration setup message
   */
  showConfigurationMessage() {
    // Show the configuration notice
    const configNotice = document.getElementById('config-notice');
    if (configNotice) {
      configNotice.style.display = 'block';
    }

    // Hide the auth button since it won't work without configuration
    const authButton = document.getElementById('auth-button');
    if (authButton) {
      authButton.style.display = 'none';
    }

    // Update the auth button text to indicate configuration needed
    const welcomeContent = document.querySelector('.welcome-content h2');
    if (welcomeContent) {
      welcomeContent.textContent = 'Configuration Required';
    }

    const welcomeDesc = document.querySelector('.welcome-content > p');
    if (welcomeDesc) {
      welcomeDesc.textContent =
        'Please configure your Google Client ID to get started with Gmail analysis.';
    }
  }

  /**
   * Get application statistics
   * @returns {Object} App statistics
   */
  getAppStats() {
    return {
      isInitialized: this.isInitialized,
      isAuthenticated: this.appState.isAuthenticated,
      currentView: this.currentView,
      emailCount: this.appState.currentEmails.length,
      hasAnalysis: !!this.appState.currentAnalysis,
      lastAnalysis: this.appState.lastAnalysisDate,
      memoryUsage: this.getMemoryUsage(),
    };
  }

  /**
   * Get memory usage estimate
   * @returns {Object} Memory usage info
   */
  getMemoryUsage() {
    return {
      emails: this.appState.currentEmails.length,
      analysisData: this.appState.currentAnalysis
        ? Object.keys(this.appState.currentAnalysis).length
        : 0,
      cacheSize: StorageHelper.getCacheSize(),
    };
  }

  /**
   * Debounce utility function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize the application
const gmailPurgeApp = new GmailPurgeApp();

// Expose to global scope for debugging
window.gmailPurgeApp = gmailPurgeApp;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GmailPurgeApp;
}

// Application ready event
document.addEventListener('DOMContentLoaded', () => {
  console.log('Gmail Purge Application is ready');
});
