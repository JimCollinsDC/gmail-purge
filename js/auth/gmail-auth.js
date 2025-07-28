/**
 * Gmail Authentication Handler
 * Uses Google Identity Services (GIS) - the new authentication library
 * Replaces deprecated gapi.auth2
 */

class GmailAuth {
  constructor() {
    this.isSignedIn = false;
    this.currentUser = null;
    this.accessToken = null;
    this.tokenClient = null;
  }

  /**
   * Initialize Google Identity Services and set up authentication
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

      // Load Google API client library
      await this._loadGoogleAPI();

      // Initialize Google Identity Services
      await this._initializeGIS();

      console.log('✅ Gmail Auth initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Gmail Auth initialization failed:', error);
      this._handleAuthError(error);
      return false;
    }
  }

  /**
   * Sign in to Gmail using Google Identity Services
   * @returns {Promise<boolean>} Success status
   */
  async signIn() {
    try {
      if (!this.tokenClient) {
        throw new Error('Google Identity Services not initialized');
      }

      // Request access token with better error handling
      await new Promise((resolve, reject) => {
        this.tokenClient.callback = (response) => {
          if (response.error) {
            // Handle specific OAuth errors
            if (response.error === 'popup_closed_by_user') {
              reject(new Error('Sign-in was cancelled. Please try again.'));
            } else if (response.error === 'access_denied') {
              reject(new Error('Access denied. Please grant permissions to analyze your Gmail account.'));
            } else {
              reject(new Error(`Authentication failed: ${response.error}`));
            }
            return;
          }
          
          this.accessToken = response.access_token;
          this.isSignedIn = true;
          this._onSignIn();
          resolve();
        };
        
        // Use hint to potentially skip account chooser if user has a preferred account
        this.tokenClient.requestAccessToken({ 
          prompt: '',
          hint: localStorage.getItem('gmail_user_hint') || undefined
        });
      });

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
      if (this.accessToken) {
        // Revoke the access token
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.accessToken}`, {
          method: 'POST',
          headers: {
            'Content-type': 'application/x-www-form-urlencoded'
          }
        });
      }

      // Clear auth state
      this.accessToken = null;
      this.isSignedIn = false;
      this.currentUser = null;
      this._onSignOut();

      console.log('✅ User signed out successfully');
      return true;
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      return false;
    }
  }

  /**
   * Get current user information from Gmail API
   * @returns {Object|null} User information
   */
  async getCurrentUser() {
    if (!this.isSignedIn || !this.accessToken) {
      return null;
    }

    try {
      // Use the Gmail API to get user profile information
      const response = await gapi.client.gmail.users.getProfile({
        userId: 'me'
      });
      
      const profile = response.result;
      this.currentUser = {
        email: profile.emailAddress,
        messagesTotal: profile.messagesTotal,
        threadsTotal: profile.threadsTotal
      };
      
      return this.currentUser;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Get authentication token for API calls
   * @returns {string|null} Access token
   */
  getAuthToken() {
    return this.accessToken;
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

      if (typeof google === 'undefined') {
        reject(
          new Error(
            'Google Identity Services library not loaded. Please check your internet connection.'
          )
        );
        return;
      }

      // Load only the client library (auth2 is deprecated)
      gapi.load('client', {
        callback: () => {
          console.log('✅ Google API client loaded successfully');
          resolve();
        },
        onerror: (error) => {
          const errorMessage =
            error?.message || error?.toString() || 'Unknown API loading error';
          reject(new Error(`Failed to load Google API client: ${errorMessage}`));
        },
      });
    });
  }

  /**
   * Initialize Google Identity Services
   * @private
   */
  async _initializeGIS() {
    try {
      // Initialize the Google API client for Gmail API calls
      await gapi.client.init({
        discoveryDocs: APP_CONFIG.DISCOVERY_DOCS,
      });

      // Initialize the Google Identity Services token client
      // Using popup mode with proper error handling for COOP warnings
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
        scope: APP_CONFIG.GMAIL_SCOPES.join(' '),
        callback: '', // Will be set dynamically during sign-in
      });

      if (!this.tokenClient) {
        throw new Error('Failed to initialize Google Identity Services token client');
      }
      
    } catch (error) {
      // Better error message extraction with specific handling for common issues
      let errorMessage = 'Unknown authentication error';
      
      if (error?.message) {
        errorMessage = error.message;
        
        // Handle specific Google Auth errors - though these should be less common with GIS
        if (errorMessage.includes('idpiframe_initialization_failed')) {
          errorMessage = `Google Auth initialization failed. This error should be rare with the new Google Identity Services. Please check:
1. Your domain (${window.location.origin}) is authorized in Google Console
2. Content Security Policy allows Google domains
3. Browser allows third-party cookies
4. Pop-ups are enabled for this site`;
        } else if (errorMessage.includes('popup_blocked_by_browser')) {
          errorMessage = 'Pop-up was blocked by the browser. Please allow pop-ups for this site and try again.';
        } else if (errorMessage.includes('access_denied')) {
          errorMessage = 'Access denied. Please grant permissions to analyze your Gmail account.';
        } else if (errorMessage.includes('popup_blocked_by_browser')) {
          errorMessage = 'Pop-up was blocked by the browser. Please allow pop-ups for this site and try again.';
        } else if (errorMessage.includes('access_denied')) {
          errorMessage = 'Access denied. Please grant permissions to analyze your Gmail account.';
        }
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error) {
        // Try to get more details from the error object
        errorMessage = JSON.stringify(error, null, 2);
      }
      
      throw new Error(`Auth initialization failed: ${errorMessage}`);
    }
  }

  /**
   * Handle successful sign in
   * @private
   */
  _onSignIn() {
    console.log('📧 User signed in to Gmail');

    // Set the access token for gapi client
    gapi.client.setToken({
      access_token: this.accessToken
    });

    // Try to get and store user email for future sign-in hints
    this.getCurrentUser().then(user => {
      if (user && user.email) {
        localStorage.setItem('gmail_user_hint', user.email);
      }
    }).catch(() => {
      // Ignore errors in hint storage
    });

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent('gmailAuthSuccess', {
        detail: { isSignedIn: true, hasToken: !!this.accessToken },
      })
    );
  }

  /**
   * Handle sign out
   * @private
   */
  _onSignOut() {
    console.log('👋 User signed out from Gmail');

    // Clear the access token from gapi client
    gapi.client.setToken(null);

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
