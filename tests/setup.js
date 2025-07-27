/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

// Mock DOM APIs that might not be available in JSDOM
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock Google APIs
global.gapi = {
  load: jest.fn((api, callback) => {
    if (typeof callback === 'function') {
      callback();
    }
  }),
  auth2: {
    getAuthInstance: jest.fn(() => ({
      isSignedIn: {
        get: jest.fn(() => false),
        listen: jest.fn(),
      },
      signIn: jest.fn(() => Promise.resolve()),
      signOut: jest.fn(() => Promise.resolve()),
      currentUser: {
        get: jest.fn(() => ({
          getBasicProfile: jest.fn(() => ({
            getName: jest.fn(() => 'Test User'),
            getEmail: jest.fn(() => 'test@example.com'),
            getImageUrl: jest.fn(() => 'https://example.com/avatar.jpg'),
          })),
        })),
      },
    })),
    init: jest.fn(() => Promise.resolve()),
  },
  client: {
    init: jest.fn(() => Promise.resolve()),
    gmail: {
      users: {
        messages: {
          list: jest.fn(() => Promise.resolve({
            result: {
              messages: [],
              nextPageToken: null,
            },
          })),
          get: jest.fn(() => Promise.resolve({
            result: {
              id: 'test-id',
              threadId: 'test-thread',
              labelIds: ['INBOX'],
              snippet: 'Test email content',
              payload: {
                headers: [
                  { name: 'From', value: 'test@example.com' },
                  { name: 'Subject', value: 'Test Subject' },
                  { name: 'Date', value: 'Wed, 1 Jan 2025 12:00:00 +0000' },
                ],
                body: {
                  size: 1234,
                },
              },
            },
          })),
        },
      },
    },
  },
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
