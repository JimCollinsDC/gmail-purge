/**
 * Gmail Purge - Application Configuration
 * Contains all configuration constants and settings
 */

const APP_CONFIG = {
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID_HERE', // Replace with your actual client ID

  // Gmail API Configuration
  GMAIL_SCOPES: ['https://www.googleapis.com/auth/gmail.readonly'],

  // API Discovery Docs
  DISCOVERY_DOCS: [
    'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
  ],

  // Application Settings
  MAX_RESULTS_PER_BATCH: 100,
  MAX_CONCURRENT_REQUESTS: 5,
  API_RATE_LIMIT_DELAY: 100, // milliseconds

  // Storage Keys
  STORAGE_KEYS: {
    USER_PREFERENCES: 'gmail_purge_preferences',
    ANALYSIS_CACHE: 'gmail_purge_cache',
    LAST_ANALYSIS: 'gmail_purge_last_analysis',
  },

  // Default User Preferences
  DEFAULT_PREFERENCES: {
    theme: 'light',
    analysisDepth: 'medium',
    batchSize: 50,
    autoRefresh: false,
    showEmailContent: false,
    reportFormat: 'summary',
    language: 'en',
    disclaimerShown: false,
  },

  // Email Analysis Configuration
  ANALYSIS_CONFIG: {
    // Minimum number of emails to show in results
    MIN_EMAIL_THRESHOLD: 2,

    // Maximum number of senders to display initially
    MAX_SENDERS_DISPLAY: 100,

    // Maximum number of subjects to display per sender
    MAX_SUBJECTS_DISPLAY: 50,

    // Size thresholds for categorization (in bytes)
    SIZE_THRESHOLDS: {
      SMALL: 1024 * 100, // 100KB
      MEDIUM: 1024 * 1024, // 1MB
      LARGE: 1024 * 1024 * 10, // 10MB
    },
  },

  // UI Configuration
  UI_CONFIG: {
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 500,
    TOAST_DURATION: 5000,
  },

  // Error Messages
  ERROR_MESSAGES: {
    AUTH_FAILED: 'Failed to authenticate with Gmail. Please try again.',
    API_QUOTA_EXCEEDED: 'Gmail API quota exceeded. Please try again later.',
    NETWORK_ERROR: 'Network error occurred. Please check your connection.',
    GENERAL_ERROR: 'An unexpected error occurred. Please try again.',
    NO_EMAILS_FOUND: 'No emails found in your Gmail account.',
    ANALYSIS_FAILED: 'Email analysis failed. Please try again.',
  },

  // Success Messages
  SUCCESS_MESSAGES: {
    AUTH_SUCCESS: 'Successfully connected to Gmail!',
    ANALYSIS_COMPLETE: 'Email analysis completed successfully!',
    EXPORT_SUCCESS: 'Analysis results exported successfully!',
  },
};

// Validation function for configuration
const validateConfig = () => {
  if (APP_CONFIG.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
    console.warn(
      '⚠️ Gmail Purge: Please configure your Google Client ID in js/config/app-config.js'
    );
    return false;
  }
  return true;
};

// Export for ES modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APP_CONFIG, validateConfig };
}
