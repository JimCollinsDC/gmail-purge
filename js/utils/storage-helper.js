/**
 * Storage Helper Utility
 * Manages localStorage and sessionStorage operations
 */

class StorageHelper {
  /**
   * Check if browser storage is available
   * @returns {boolean} Storage availability status
   */
  static isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      console.warn('⚠️ Browser storage is not available:', error);
      return false;
    }
  }

  /**
   * Save user preferences
   * @param {Object} preferences - User preferences object
   */
  static savePreferences(preferences) {
    try {
      const merged = { ...APP_CONFIG.DEFAULT_PREFERENCES, ...preferences };
      localStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(merged)
      );
      console.log('💾 User preferences saved');
    } catch (error) {
      console.error('❌ Failed to save preferences:', error);
    }
  }

  /**
   * Load user preferences
   * @returns {Object} User preferences
   */
  static loadPreferences() {
    try {
      const stored = localStorage.getItem(
        APP_CONFIG.STORAGE_KEYS.USER_PREFERENCES
      );
      if (stored) {
        const preferences = JSON.parse(stored);
        return { ...APP_CONFIG.DEFAULT_PREFERENCES, ...preferences };
      }
    } catch (error) {
      console.error('❌ Failed to load preferences:', error);
    }

    return { ...APP_CONFIG.DEFAULT_PREFERENCES };
  }

  /**
   * Get item from localStorage
   * @param {string} key - Storage key
   * @returns {Object|null} Parsed item or null if not found
   */
  static getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`❌ Failed to get item '${key}':`, error);
      return null;
    }
  }

  /**
   * Set item in localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  static setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      console.log(`💾 Item '${key}' saved to storage`);
    } catch (error) {
      console.error(`❌ Failed to set item '${key}':`, error);
    }
  }

  /**
   * Cache analysis results
   * @param {Object} analysisData - Analysis results to cache
   */
  static cacheAnalysis(analysisData) {
    try {
      const cacheData = {
        timestamp: Date.now(),
        data: analysisData,
      };

      // Use sessionStorage for analysis cache (cleared on tab close)
      sessionStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.ANALYSIS_CACHE,
        JSON.stringify(cacheData)
      );
      console.log('💾 Analysis results cached');
    } catch (error) {
      console.error('❌ Failed to cache analysis:', error);
    }
  }

  /**
   * Load cached analysis results
   * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
   * @returns {Object|null} Cached analysis data or null if expired/not found
   */
  static loadCachedAnalysis(maxAge = 3600000) {
    try {
      const cached = sessionStorage.getItem(
        APP_CONFIG.STORAGE_KEYS.ANALYSIS_CACHE
      );
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      if (age > maxAge) {
        console.log('🗑️ Analysis cache expired, clearing...');
        this.clearAnalysisCache();
        return null;
      }

      console.log(`📦 Loaded cached analysis (${Math.round(age / 1000)}s old)`);
      return cacheData.data;
    } catch (error) {
      console.error('❌ Failed to load cached analysis:', error);
      return null;
    }
  }

  /**
   * Save last analysis metadata
   * @param {Object} metadata - Analysis metadata
   */
  static saveLastAnalysisMetadata(metadata) {
    try {
      const data = {
        timestamp: Date.now(),
        ...metadata,
      };

      localStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.LAST_ANALYSIS,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('❌ Failed to save analysis metadata:', error);
    }
  }

  /**
   * Load last analysis metadata
   * @returns {Object|null} Last analysis metadata
   */
  static loadLastAnalysisMetadata() {
    try {
      const stored = localStorage.getItem(
        APP_CONFIG.STORAGE_KEYS.LAST_ANALYSIS
      );
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ Failed to load analysis metadata:', error);
      return null;
    }
  }

  /**
   * Clear analysis cache
   */
  static clearAnalysisCache() {
    try {
      sessionStorage.removeItem(APP_CONFIG.STORAGE_KEYS.ANALYSIS_CACHE);
      console.log('🗑️ Analysis cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear analysis cache:', error);
    }
  }

  /**
   * Clear all cached data
   */
  static clearCache() {
    try {
      sessionStorage.removeItem(APP_CONFIG.STORAGE_KEYS.ANALYSIS_CACHE);
      console.log('🗑️ All cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }

  /**
   * Clear all stored data (preferences and cache)
   */
  static clearAll() {
    try {
      Object.values(APP_CONFIG.STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      console.log('🗑️ All stored data cleared');
    } catch (error) {
      console.error('❌ Failed to clear all data:', error);
    }
  }

  /**
   * Get storage usage information
   * @returns {Object} Storage usage stats
   */
  static getStorageInfo() {
    const getSize = (storage) => {
      let size = 0;
      Object.keys(storage).forEach((key) => {
        size += storage[key].length + key.length;
      });
      return size;
    };

    return {
      localStorage: {
        used: getSize(localStorage),
        available: this._getAvailableStorage('localStorage'),
      },
      sessionStorage: {
        used: getSize(sessionStorage),
        available: this._getAvailableStorage('sessionStorage'),
      },
    };
  }

  /**
   * Check if storage quota is exceeded
   * @param {string} storageType - 'localStorage' or 'sessionStorage'
   * @returns {boolean} True if quota exceeded
   */
  static isStorageQuotaExceeded(storageType = 'localStorage') {
    try {
      const storage =
        storageType === 'localStorage' ? localStorage : sessionStorage;
      const testKey = '__quota_test__';
      const testData = '0'.repeat(1024); // 1KB test data

      storage.setItem(testKey, testData);
      storage.removeItem(testKey);
      return false;
    } catch (error) {
      return error.name === 'QuotaExceededError';
    }
  }

  // Private methods

  /**
   * Get available storage space (approximate)
   * @private
   * @param {string} storageType - 'localStorage' or 'sessionStorage'
   * @returns {number} Available storage in bytes (approximate)
   */
  static _getAvailableStorage(storageType) {
    try {
      const storage =
        storageType === 'localStorage' ? localStorage : sessionStorage;
      const testKey = '__size_test__';
      let size = 0;

      // Binary search to find approximate available space
      let high = 10 * 1024 * 1024; // 10MB
      let low = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        try {
          storage.setItem(testKey, '0'.repeat(mid));
          storage.removeItem(testKey);
          size = mid;
          low = mid + 1;
        } catch (error) {
          high = mid - 1;
        }
      }

      return size;
    } catch (error) {
      console.warn('⚠️ Could not determine available storage:', error);
      return 0;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageHelper;
}
