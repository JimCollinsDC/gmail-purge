/**
 * Formatters Utility
 * Helper functions for formatting data for display
 */

class Formatters {
  /**
   * Format file size in human-readable format
   * @param {number} bytes - Size in bytes
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted size string
   */
  static formatFileSize(bytes, decimals = 1) {
    if (bytes === 0) return '0 B';
    if (!bytes || bytes < 0) return '-';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

    return `${size} ${sizes[i]}`;
  }

  /**
   * Format number with thousands separators
   * @param {number} num - Number to format
   * @returns {string} Formatted number string
   */
  static formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toLocaleString();
  }

  /**
   * Format date in relative format (e.g., "2 days ago")
   * @param {Date|number} date - Date object or timestamp
   * @returns {string} Relative date string
   */
  static formatRelativeDate(date) {
    if (!date) return '-';

    const now = new Date();
    const targetDate = date instanceof Date ? date : new Date(date);
    const diffMs = now - targetDate;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  }

  /**
   * Format date in short format (e.g., "Jan 15, 2024")
   * @param {Date|number} date - Date object or timestamp
   * @returns {string} Short date string
   */
  static formatShortDate(date) {
    if (!date) return '-';

    const targetDate = date instanceof Date ? date : new Date(date);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };

    return targetDate.toLocaleDateString('en-US', options);
  }

  /**
   * Format date range
   * @param {Date|number} startDate - Start date
   * @param {Date|number} endDate - End date
   * @returns {string} Date range string
   */
  static formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) return '-';

    const start = this.formatShortDate(startDate);
    const end = this.formatShortDate(endDate);

    if (start === end) {
      return start;
    }

    return `${start} - ${end}`;
  }

  /**
   * Format sender name for display
   * @param {string} senderName - Sender name
   * @param {string} senderEmail - Sender email
   * @param {number} maxLength - Maximum length
   * @returns {string} Formatted sender string
   */
  static formatSender(senderName, senderEmail, maxLength = 50) {
    if (!senderEmail) return 'Unknown Sender';

    let displayName = senderName && senderName !== senderEmail 
      ? senderName 
      : senderEmail;

    // Truncate if too long
    if (displayName.length > maxLength) {
      displayName = displayName.substring(0, maxLength - 3) + '...';
    }

    return displayName;
  }

  /**
   * Format email subject for display
   * @param {string} subject - Email subject
   * @param {number} maxLength - Maximum length
   * @returns {string} Formatted subject string
   */
  static formatSubject(subject, maxLength = 80) {
    if (!subject || subject.trim() === '') {
      return '(No Subject)';
    }

    const cleanSubject = subject.trim();
    
    if (cleanSubject.length > maxLength) {
      return cleanSubject.substring(0, maxLength - 3) + '...';
    }

    return cleanSubject;
  }

  /**
   * Format percentage
   * @param {number} value - Value
   * @param {number} total - Total value
   * @param {number} decimals - Decimal places
   * @returns {string} Percentage string
   */
  static formatPercentage(value, total, decimals = 1) {
    if (!total || total === 0) return '0%';
    
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
  }

  /**
   * Format duration in human-readable format
   * @param {number} milliseconds - Duration in milliseconds
   * @returns {string} Formatted duration string
   */
  static formatDuration(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '0s';

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Format email count with proper pluralization
   * @param {number} count - Number of emails
   * @returns {string} Formatted count string
   */
  static formatEmailCount(count) {
    const formattedNumber = this.formatNumber(count);
    return `${formattedNumber} email${count !== 1 ? 's' : ''}`;
  }

  /**
   * Truncate text with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @param {string} suffix - Suffix to add (default: '...')
   * @returns {string} Truncated text
   */
  static truncateText(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) {
      return text || '';
    }

    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Format storage efficiency (emails per MB)
   * @param {number} emailCount - Number of emails
   * @param {number} totalBytes - Total size in bytes
   * @returns {string} Efficiency string
   */
  static formatStorageEfficiency(emailCount, totalBytes) {
    if (!emailCount || !totalBytes) return '-';

    const totalMB = totalBytes / (1024 * 1024);
    const emailsPerMB = emailCount / totalMB;

    if (emailsPerMB > 10) {
      return `${Math.round(emailsPerMB)} emails/MB`;
    } else {
      return `${emailsPerMB.toFixed(1)} emails/MB`;
    }
  }

  /**
   * Format email category for display
   * @param {string} category - Email category
   * @returns {string} Formatted category string
   */
  static formatCategory(category) {
    const categoryMap = {
      'primary': 'Primary',
      'promotions': 'Promotions',
      'social': 'Social',
      'updates': 'Updates',
      'forums': 'Forums',
      'spam': 'Spam',
      'important': 'Important'
    };

    return categoryMap[category] || 'Other';
  }

  /**
   * Get color for category
   * @param {string} category - Email category
   * @returns {string} CSS color value
   */
  static getCategoryColor(category) {
    const colorMap = {
      'primary': '#1a73e8',
      'promotions': '#f9ab00',
      'social': '#1e8e3e',
      'updates': '#ff6d01',
      'forums': '#9c27b0',
      'spam': '#d93025',
      'important': '#ea4335'
    };

    return colorMap[category] || '#5f6368';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Formatters;
}
