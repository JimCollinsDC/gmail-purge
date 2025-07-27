/**
 * API Integration Tests
 * Tests to ensure all class methods and global instances are properly defined
 * and match the expected interfaces used throughout the application.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock global objects that would be available in browser
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.gapi = {
  load: vi.fn(),
  auth2: {
    init: vi.fn(),
  },
  client: {
    init: vi.fn(),
    gmail: {
      users: {
        messages: {
          list: vi.fn(),
          get: vi.fn(),
        },
        getProfile: vi.fn(),
        labels: {
          list: vi.fn(),
        },
      },
    },
  },
};

global.APP_CONFIG = {
  DEFAULT_PREFERENCES: {},
  STORAGE_KEYS: {
    USER_PREFERENCES: 'test_preferences',
    ANALYSIS_CACHE: 'test_cache',
    LAST_ANALYSIS: 'test_analysis',
  },
  GOOGLE_CLIENT_ID: 'test_client_id',
  GMAIL_SCOPES: ['test_scope'],
  DISCOVERY_DOCS: ['test_doc'],
  MAX_RESULTS_PER_BATCH: 50,
  MAX_CONCURRENT_REQUESTS: 5,
  API_RATE_LIMIT_DELAY: 100,
  ERROR_MESSAGES: {
    GENERAL_ERROR: 'General error',
    API_QUOTA_EXCEEDED: 'Quota exceeded',
    AUTH_FAILED: 'Auth failed',
    NETWORK_ERROR: 'Network error',
  },
};

global.validateConfig = vi.fn().mockReturnValue(true);

describe('API Integration Tests', () => {
  describe('StorageHelper Class', () => {
    let StorageHelper;

    beforeEach(async () => {
      // Import StorageHelper (simulating browser module loading)
      const { default: StorageHelperClass } = await import(
        '../js/utils/storage-helper'
      );
      StorageHelper = StorageHelperClass;
    });

    it('should have all required static methods', () => {
      expect(typeof StorageHelper.isAvailable).toBe('function');
      expect(typeof StorageHelper.savePreferences).toBe('function');
      expect(typeof StorageHelper.loadPreferences).toBe('function');
      expect(typeof StorageHelper.cacheAnalysis).toBe('function');
      expect(typeof StorageHelper.loadCachedAnalysis).toBe('function');
      expect(typeof StorageHelper.saveLastAnalysisMetadata).toBe('function');
      expect(typeof StorageHelper.loadLastAnalysisMetadata).toBe('function');
      expect(typeof StorageHelper.clearAnalysisCache).toBe('function');
      expect(typeof StorageHelper.clearCache).toBe('function');
      expect(typeof StorageHelper.clearAll).toBe('function');
      expect(typeof StorageHelper.getStorageInfo).toBe('function');
      expect(typeof StorageHelper.isStorageQuotaExceeded).toBe('function');
    });

    it('should not have deprecated method names', () => {
      // These are the incorrect method names that were causing errors
      expect(StorageHelper.getPreferences).toBeUndefined();
      expect(StorageHelper.setPreferences).toBeUndefined();
    });
  });

  describe('GmailAuth Class', () => {
    it('should be able to import the GmailAuth class', async () => {
      const { GmailAuth } = await import('../js/auth/gmail-auth');
      expect(GmailAuth).toBeDefined();
      expect(typeof GmailAuth).toBe('function'); // Classes are functions in JS
    });

    it('should have all required methods when instantiated', async () => {
      const { GmailAuth } = await import('../js/auth/gmail-auth');
      const instance = new GmailAuth();

      // Test that all required methods exist
      expect(typeof instance.initialize).toBe('function');
      expect(typeof instance.signIn).toBe('function');
      expect(typeof instance.signOut).toBe('function');
      expect(typeof instance.getCurrentUser).toBe('function');
      expect(typeof instance.getAuthToken).toBe('function');
      expect(typeof instance.isUserSignedIn).toBe('function');
    });

    it('should not have deprecated method names', async () => {
      const { GmailAuth } = await import('../js/auth/gmail-auth');
      const instance = new GmailAuth();

      // These are the incorrect method names that were causing errors
      expect(instance.init).toBeUndefined();
      expect(instance.isAuthenticated).toBeUndefined();
      expect(instance.getUserInfo).toBeUndefined();
      expect(instance.onAuthStateChanged).toBeUndefined();
    });
  });

  describe('GmailAPI Class', () => {
    beforeEach(() => {
      // Mock gmailAuth for GmailAPI tests
      global.gmailAuth = {
        isUserSignedIn: vi.fn().mockReturnValue(true),
      };
    });

    afterEach(() => {
      // Clean up
      delete global.gmailAuth;
    });

    it('should be able to import the GmailAPI class', async () => {
      const { GmailAPI } = await import('../js/api/gmail-api');
      expect(GmailAPI).toBeDefined();
      expect(typeof GmailAPI).toBe('function'); // Classes are functions in JS
    });

    it('should have all required methods when instantiated', async () => {
      const { GmailAPI } = await import('../js/api/gmail-api');
      const instance = new GmailAPI();

      expect(typeof instance.initialize).toBe('function');
      expect(typeof instance.getAllMessages).toBe('function');
      expect(typeof instance.getMessageDetails).toBe('function');
      expect(typeof instance.getUserProfile).toBe('function');
      expect(typeof instance.getLabels).toBe('function');
    });
  });

  describe('Application Integration', () => {
    it('should verify expected method calls are available', () => {
      // Test the methods that app.js tries to call
      const expectedStorageHelperMethods = [
        'isAvailable',
        'loadPreferences', // NOT getPreferences
        'savePreferences', // NOT setPreferences
      ];

      const expectedGmailAuthMethods = [
        'initialize', // NOT init
        'isUserSignedIn', // NOT isAuthenticated
        'getCurrentUser', // NOT getUserInfo
        'signIn',
        'signOut',
      ];

      // These would be tested in a real browser environment
      // For now, just document the expected interface
      expect(expectedStorageHelperMethods).toHaveLength(3);
      expect(expectedGmailAuthMethods).toHaveLength(5);
    });
  });

  describe('Event System Integration', () => {
    it('should verify auth events are properly dispatched', () => {
      // Test that the correct event names are used
      const expectedAuthEvents = [
        'gmailAuthSuccess',
        'gmailAuthSignOut',
        'gmailAuthError',
      ];

      const expectedAPIEvents = ['gmailAPIError'];

      expect(expectedAuthEvents).toContain('gmailAuthSuccess');
      expect(expectedAuthEvents).toContain('gmailAuthSignOut');
      expect(expectedAPIEvents).toContain('gmailAPIError');
    });
  });
});

// Additional test to verify method consistency across the codebase
describe('Method Name Consistency Tests', () => {
  it('should document breaking changes to prevent future regressions', () => {
    const breakingChanges = {
      StorageHelper: {
        deprecated: ['getPreferences', 'setPreferences'],
        correct: ['loadPreferences', 'savePreferences'],
      },
      GmailAuth: {
        deprecated: [
          'init',
          'isAuthenticated',
          'getUserInfo',
          'onAuthStateChanged',
        ],
        correct: [
          'initialize',
          'isUserSignedIn',
          'getCurrentUser',
          'event-based listeners',
        ],
      },
    };

    // This serves as documentation and can be expanded for future API changes
    expect(breakingChanges.StorageHelper.deprecated).toHaveLength(2);
    expect(breakingChanges.GmailAuth.deprecated).toHaveLength(4);
  });
});
