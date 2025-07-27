/**
 * Vitest Test Setup
 * Global test configuration and mocks - lightweight and fast
 */

// Mock DOM APIs that might not be available in JSDOM
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock Google APIs
global.gapi = {
  load: vi.fn((api, callback) => {
    if (typeof callback === 'function') {
      callback();
    }
  }),
  auth2: {
    getAuthInstance: vi.fn(() => ({
      isSignedIn: {
        get: vi.fn(() => false),
        listen: vi.fn(),
      },
      signIn: vi.fn(() => Promise.resolve()),
      signOut: vi.fn(() => Promise.resolve()),
      currentUser: {
        get: vi.fn(() => ({
          getBasicProfile: vi.fn(() => ({
            getName: vi.fn(() => 'Test User'),
            getEmail: vi.fn(() => 'test@example.com'),
            getImageUrl: vi.fn(() => 'https://example.com/avatar.jpg'),
          })),
        })),
      },
    })),
    init: vi.fn(() => Promise.resolve()),
  },
  client: {
    init: vi.fn(() => Promise.resolve()),
    gmail: {
      users: {
        messages: {
          list: vi.fn(() => Promise.resolve({
            result: {
              messages: [],
              nextPageToken: null,
            },
          })),
          get: vi.fn(() => Promise.resolve({
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
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
