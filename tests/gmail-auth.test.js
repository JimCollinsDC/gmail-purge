import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock APP_CONFIG and validateConfig before importing
const mockAppConfig = {
  GOOGLE_CLIENT_ID: 'test-client-id',
  GMAIL_SCOPES: ['https://www.googleapis.com/auth/gmail.readonly'],
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
  ERROR_MESSAGES: {
    AUTH_FAILED: 'Authentication failed',
    NETWORK_ERROR: 'Network error occurred',
  },
};

const mockValidateConfig = vi.fn().mockReturnValue(true);

// Mock Google Identity Services (GIS)
const mockGoogle = {
  accounts: {
    oauth2: {
      initTokenClient: vi.fn(),
    },
  },
};

// Mock gapi (for Gmail API)
const mockGapi = {
  load: vi.fn(),
  client: {
    init: vi.fn(),
    setToken: vi.fn(),
  },
};

// Mock token client
const mockTokenClient = {
  requestAccessToken: vi.fn(),
};

// Mock user data
const mockUserToken = {
  access_token: 'test-token-123',
  expires_in: 3600,
  scope: 'https://www.googleapis.com/auth/gmail.readonly',
};

// Set up globals before any imports
global.APP_CONFIG = mockAppConfig;
global.validateConfig = mockValidateConfig;
global.google = mockGoogle;
global.gapi = mockGapi;
global.window = {
  dispatchEvent: vi.fn(),
};
global.console = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

// Import Gmail Auth after setting up globals
const { GmailAuth, gmailAuth } = await import('../js/auth/gmail-auth');

describe('Gmail Auth Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockGapi.load.mockImplementation((modules, config) => {
      if (config.callback) config.callback();
    });
    mockGapi.client.init.mockResolvedValue(undefined);
    mockGoogle.accounts.oauth2.initTokenClient.mockReturnValue(mockTokenClient);
    mockTokenClient.requestAccessToken.mockImplementation((options) => {
      if (options.callback) {
        options.callback(mockUserToken);
      }
    });
  });

  afterEach(() => {
    // Clean up
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create a new GmailAuth instance with default values', () => {
      const auth = new GmailAuth();
      
      expect(auth.isSignedIn).toBe(false);
      expect(auth.currentUser).toBe(null);
      expect(auth.tokenClient).toBe(null);
    });
  });

  describe('initialize()', () => {
    it('should successfully initialize with valid configuration', async () => {
      const auth = new GmailAuth();
      const result = await auth.initialize();
      
      expect(result).toBe(true);
      expect(mockValidateConfig).toHaveBeenCalled();
      expect(mockGapi.load).toHaveBeenCalled();
      expect(mockGapi.client.init).toHaveBeenCalledWith({
        discoveryDocs: mockAppConfig.DISCOVERY_DOCS,
      });
      expect(mockGoogle.accounts.oauth2.initTokenClient).toHaveBeenCalled();
    });

    it('should fail initialization when configuration is invalid', async () => {
      mockValidateConfig.mockReturnValueOnce(false);
      
      const auth = new GmailAuth();
      const result = await auth.initialize();
      
      expect(result).toBe(false);
      expect(mockValidateConfig).toHaveBeenCalled();
    });
  });

  describe('signIn()', () => {
    it('should successfully call signIn and return true', async () => {
      const auth = new GmailAuth();
      await auth.initialize();
      
      const result = await auth.signIn();
      
      expect(result).toBe(true);
      expect(mockTokenClient.requestAccessToken).toHaveBeenCalled();
      expect(auth.isSignedIn).toBe(true);
      expect(auth.currentUser).toEqual(mockUserToken);
    });

    it('should fail when not initialized', async () => {
      const auth = new GmailAuth();
      
      const result = await auth.signIn();
      
      expect(result).toBe(false);
    });

    it('should handle signIn errors', async () => {
      const auth = new GmailAuth();
      await auth.initialize();
      
      mockTokenClient.requestAccessToken.mockImplementation((options) => {
        if (options.error_callback) {
          options.error_callback(new Error('Sign in failed'));
        }
      });
      
      const result = await auth.signIn();
      
      expect(result).toBe(false);
      expect(mockTokenClient.requestAccessToken).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser()', () => {
    it('should return user when signed in', async () => {
      const auth = new GmailAuth();
      await auth.initialize();
      await auth.signIn();
      
      const user = await auth.getCurrentUser();
      
      expect(user).toEqual(mockUserToken);
    });

    it('should return null when not signed in', async () => {
      const auth = new GmailAuth();
      
      const user = await auth.getCurrentUser();
      
      expect(user).toBe(null);
    });
  });

  describe('getAuthToken()', () => {
    it('should return access token when user is signed in', async () => {
      const auth = new GmailAuth();
      await auth.initialize();
      await auth.signIn();
      
      expect(auth.getAuthToken()).toBe('test-token-123');
    });

    it('should return null when user is not signed in', () => {
      const auth = new GmailAuth();
      
      expect(auth.getAuthToken()).toBe(null);
    });
  });

  describe('Global Instance', () => {
    it('should export a global gmailAuth instance', () => {
      expect(gmailAuth).toBeInstanceOf(GmailAuth);
    });
  });
});
