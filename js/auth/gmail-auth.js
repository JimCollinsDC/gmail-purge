/**
 * Gmail Authentication Handler
 * Manages OAuth 2.0 authentication with Google Gmail API
 */

class GmailAuth {
  constructor() {
    this.isSignedIn = false;
    this.currentUser = null;
    this.authInstance = null;
  }

  /**
   * Initialize Google API and set up authentication
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      // Validate configuration first
      if (!validateConfig()) {
        throw new Error(
          'Invalid configuration. Please check your Google Client ID.'
        );
      }

      // Load Google API
      await this._loadGoogleAPI();

      // Initialize auth
      await this._initializeAuth();

      // Set up auth state listener
      this._setupAuthListener();

      console.log('✅ Gmail Auth initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Gmail Auth initialization failed:', error);
      this._handleAuthError(error);
      return false;
    }
  }

  /**
   * Sign in to Gmail
   * @returns {Promise<boolean>} Success status
   */
  async signIn() {
    try {
      if (!this.authInstance) {
        throw new Error('Authentication not initialized');
      }

      await this.authInstance.signIn();
      console.log('✅ User signed in successfully');
      return true;
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      this._handleAuthError(error);
      return false;
    }
  }

  /**
   * Sign out from Gmail
   * @returns {Promise<boolean>} Success status
   */
  async signOut() {
    try {
      if (!this.authInstance) {
        throw new Error('Authentication not initialized');
      }

      await this.authInstance.signOut();
      console.log('✅ User signed out successfully');
      return true;
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      return false;
    }
  }

  /**
   * Get current user information
   * @returns {Object|null} User information
   */
  getCurrentUser() {
    if (!this.isSignedIn || !this.currentUser) {
      return null;
    }

    const profile = this.currentUser.getBasicProfile();
    return {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      imageUrl: profile.getImageUrl(),
    };
  }

  /**
   * Get authentication token for API calls
   * @returns {string|null} Access token
   */
  getAuthToken() {
    if (!this.isSignedIn || !this.currentUser) {
      return null;
    }

    const authResponse = this.currentUser.getAuthResponse();
    return authResponse.access_token;
  }

  /**
   * Check if user is currently signed in
   * @returns {boolean} Sign in status
   */
  isUserSignedIn() {
    return this.isSignedIn;
  }

  // Private methods

  /**
   * Load Google API library
   * @private
   */
  async _loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (typeof gapi === 'undefined') {
        reject(
          new Error(
            'Google API library not loaded. Please check your internet connection.'
          )
        );
        return;
      }

      // Load both auth2 and client libraries
      gapi.load('auth2:client', {
        callback: () => {
          console.log('✅ Google Auth2 API loaded successfully');
          resolve();
        },
        onerror: (error) => {
          const errorMessage =
            error?.message || error?.toString() || 'Unknown API loading error';
          reject(new Error(`Failed to load Google Auth2: ${errorMessage}`));
        },
      });
    });
  }

  /**
   * Initialize Google Auth2
   * @private
   */
  async _initializeAuth() {
    try {
      // First initialize the client
      await gapi.client.init({
        discoveryDocs: APP_CONFIG.DISCOVERY_DOCS,
      });

      // Then initialize auth2
      this.authInstance = await gapi.auth2.init({
        client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
        scope: APP_CONFIG.GMAIL_SCOPES.join(' '),
      });

      if (!this.authInstance) {
        throw new Error('Failed to initialize Google Auth2 instance');
      }

      // Check if user is already signed in
      this.isSignedIn = this.authInstance.isSignedIn.get();
      if (this.isSignedIn) {
        this.currentUser = this.authInstance.currentUser.get();
      }
    } catch (error) {
      const errorMessage =
        error?.message || error?.toString() || 'Unknown authentication error';
      throw new Error(`Auth initialization failed: ${errorMessage}`);
    }
  }

  /**
   * Set up authentication state listener
   * @private
   */
  _setupAuthListener() {
    if (!this.authInstance) return;

    this.authInstance.isSignedIn.listen((isSignedIn) => {
      this.isSignedIn = isSignedIn;

      if (isSignedIn) {
        this.currentUser = this.authInstance.currentUser.get();
        this._onSignIn();
      } else {
        this.currentUser = null;
        this._onSignOut();
      }
    });
  }

  /**
   * Handle successful sign in
   * @private
   */
  _onSignIn() {
    console.log('📧 User signed in to Gmail');

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent('gmailAuthSuccess', {
        detail: this.getCurrentUser(),
      })
    );
  }

  /**
   * Handle sign out
   * @private
   */
  _onSignOut() {
    console.log('👋 User signed out from Gmail');

    // Clear any cached data
    StorageHelper.clearCache();

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('gmailAuthSignOut'));
  }

  /**
   * Handle authentication errors
   * @private
   * @param {Error} error - The error that occurred
   */
  _handleAuthError(error) {
    let errorMessage = APP_CONFIG.ERROR_MESSAGES.AUTH_FAILED;

    // Customize error message based on error type
    if (error.message.includes('popup_blocked')) {
      errorMessage = 'Please allow popups for this site and try again.';
    } else if (error.message.includes('access_denied')) {
      errorMessage =
        'Access denied. Please grant permissions to analyze your Gmail.';
    } else if (error.message.includes('network')) {
      errorMessage = APP_CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
    }

    // Dispatch error event
    window.dispatchEvent(
      new CustomEvent('gmailAuthError', {
        detail: { error, message: errorMessage },
      })
    );
  }
}

// Create global instance and expose it globally
const gmailAuth = new GmailAuth();

// Expose to global scope (works in both browser and Node.js)
if (typeof window !== 'undefined') {
  // Browser environment
  window.gmailAuth = gmailAuth;
  window.GmailAuth = GmailAuth;
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.gmailAuth = gmailAuth;
  global.GmailAuth = GmailAuth;
}

// Export for Node.js/testing environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GmailAuth, gmailAuth };
}
