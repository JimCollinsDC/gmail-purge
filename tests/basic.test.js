/**
 * Example Vitest Tests
 * Demonstrates lightweight testing with Vitest
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Gmail Purge - Basic Tests', () => {
  beforeEach(() => {
    // Setup runs before each test
    document.body.innerHTML = '';
  });

  it('should have access to DOM', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    expect(div.textContent).toBe('Hello World');
  });

  it('should mock localStorage', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.setItem).toHaveBeenCalledWith('test', 'value');
  });

  it('should mock Google API', () => {
    expect(global.gapi).toBeDefined();
    expect(global.gapi.load).toBeDefined();
    expect(vi.isMockFunction(global.gapi.load)).toBe(true);
  });

  it('should handle async operations', async () => {
    const mockPromise = Promise.resolve('test data');
    const result = await mockPromise;
    expect(result).toBe('test data');
  });
});

describe('Utility Functions', () => {
  it('should format dates correctly', () => {
    const date = new Date('2025-01-01T12:00:00Z');
    const formatted = date.toLocaleDateString();
    expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it('should validate email addresses', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('invalid-email')).toBe(false);
  });
});
