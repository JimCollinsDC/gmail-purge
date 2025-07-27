/**
 * Email Parser Utility
 * Extracts and normalizes email data from Gmail API responses
 */

class EmailParser {
  /**
   * Parse email messages from Gmail API response
   * @param {Array} messages - Raw Gmail API messages
   * @returns {Array} Parsed email objects
   */
  static parseMessages(messages) {
    if (!Array.isArray(messages)) {
      return [];
    }

    return messages
      .map((message) => this.parseMessage(message))
      .filter(Boolean);
  }

  /**
   * Parse single email message
   * @param {Object} message - Raw Gmail API message
   * @returns {Object|null} Parsed email object
   */
  static parseMessage(message) {
    if (!message || !message.payload) {
      return null;
    }

    try {
      const headers = this._extractHeaders(message.payload.headers || []);

      return {
        id: message.id,
        threadId: message.threadId,
        snippet: message.snippet || '',
        sizeEstimate: message.sizeEstimate || 0,
        date: this._parseDate(headers.date),
        timestamp: this._parseTimestamp(headers.date),
        sender: this._parseSender(headers.from),
        senderEmail: this._extractEmail(headers.from),
        senderName: this._extractName(headers.from),
        recipient: headers.to || '',
        subject: this._cleanSubject(headers.subject),
        hasAttachments: this._hasAttachments(message.payload),
        labels: message.labelIds || [],
        isRead: !message.labelIds?.includes('UNREAD'),
        isImportant: message.labelIds?.includes('IMPORTANT'),
        isSpam: message.labelIds?.includes('SPAM'),
        isTrash: message.labelIds?.includes('TRASH'),
        category: this._determineCategory(message.labelIds || []),
      };
    } catch (error) {
      console.warn('⚠️ Failed to parse message:', message.id, error);
      return null;
    }
  }

  /**
   * Group emails by sender
   * @param {Array} emails - Parsed email objects
   * @returns {Map} Map of sender to email groups
   */
  static groupBySender(emails) {
    const senderMap = new Map();

    emails.forEach((email) => {
      const senderKey = email.senderEmail.toLowerCase();

      if (!senderMap.has(senderKey)) {
        senderMap.set(senderKey, {
          senderEmail: email.senderEmail,
          senderName: email.senderName,
          emails: [],
          totalSize: 0,
          dateRange: {
            earliest: email.timestamp,
            latest: email.timestamp,
          },
        });
      }

      const senderGroup = senderMap.get(senderKey);
      senderGroup.emails.push(email);
      senderGroup.totalSize += email.sizeEstimate;

      // Update date range
      if (email.timestamp < senderGroup.dateRange.earliest) {
        senderGroup.dateRange.earliest = email.timestamp;
      }
      if (email.timestamp > senderGroup.dateRange.latest) {
        senderGroup.dateRange.latest = email.timestamp;
      }
    });

    return senderMap;
  }

  /**
   * Group emails by subject within a sender group
   * @param {Array} emails - Emails from a single sender
   * @returns {Map} Map of subject to email groups
   */
  static groupBySubject(emails) {
    const subjectMap = new Map();

    emails.forEach((email) => {
      const subjectKey = this._normalizeSubject(email.subject);

      if (!subjectMap.has(subjectKey)) {
        subjectMap.set(subjectKey, {
          subject: email.subject,
          normalizedSubject: subjectKey,
          emails: [],
          totalSize: 0,
          dateRange: {
            earliest: email.timestamp,
            latest: email.timestamp,
          },
        });
      }

      const subjectGroup = subjectMap.get(subjectKey);
      subjectGroup.emails.push(email);
      subjectGroup.totalSize += email.sizeEstimate;

      // Update date range
      if (email.timestamp < subjectGroup.dateRange.earliest) {
        subjectGroup.dateRange.earliest = email.timestamp;
      }
      if (email.timestamp > subjectGroup.dateRange.latest) {
        subjectGroup.dateRange.latest = email.timestamp;
      }
    });

    return subjectMap;
  }

  // Private helper methods

  /**
   * Extract headers from Gmail message
   * @private
   */
  static _extractHeaders(headers) {
    const headerMap = {};
    headers.forEach((header) => {
      headerMap[header.name.toLowerCase()] = header.value;
    });
    return headerMap;
  }

  /**
   * Parse date from Gmail date header
   * @private
   */
  static _parseDate(dateString) {
    if (!dateString) return null;

    try {
      return new Date(dateString);
    } catch (error) {
      console.warn('⚠️ Failed to parse date:', dateString);
      return null;
    }
  }

  /**
   * Parse timestamp from Gmail date header
   * @private
   */
  static _parseTimestamp(dateString) {
    const date = this._parseDate(dateString);
    return date ? date.getTime() : 0;
  }

  /**
   * Parse sender information
   * @private
   */
  static _parseSender(fromHeader) {
    if (!fromHeader) return 'Unknown Sender';

    // Clean up the from header
    return fromHeader.replace(/[<>]/g, '').trim();
  }

  /**
   * Extract email address from sender string
   * @private
   */
  static _extractEmail(fromHeader) {
    if (!fromHeader) return '';

    // Look for email in angle brackets first
    const angleMatch = fromHeader.match(/<([^>]+)>/);
    if (angleMatch) {
      return angleMatch[1].trim().toLowerCase();
    }

    // If no angle brackets, assume the whole string is an email
    const emailMatch = fromHeader.match(/[\w.-]+@[\w.-]+\.\w+/);
    return emailMatch ? emailMatch[0].toLowerCase() : fromHeader.toLowerCase();
  }

  /**
   * Extract name from sender string
   * @private
   */
  static _extractName(fromHeader) {
    if (!fromHeader) return '';

    // If there are angle brackets, the name is before them
    const angleMatch = fromHeader.match(/^([^<]+)<[^>]+>$/);
    if (angleMatch) {
      return angleMatch[1].trim().replace(/^["']|["']$/g, '');
    }

    // If no angle brackets, use the part before @ as name
    const atIndex = fromHeader.indexOf('@');
    if (atIndex > 0) {
      return fromHeader.substring(0, atIndex).trim();
    }

    return fromHeader.trim();
  }

  /**
   * Clean and normalize email subject
   * @private
   */
  static _cleanSubject(subject) {
    if (!subject) return '(No Subject)';

    // Remove excessive whitespace
    return subject.replace(/\s+/g, ' ').trim();
  }

  /**
   * Normalize subject for grouping (remove Re:, Fwd:, etc.)
   * @private
   */
  static _normalizeSubject(subject) {
    if (!subject) return '(no subject)';

    return (
      subject
        .toLowerCase()
        .replace(/^(re|fwd|fw):\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim() || '(no subject)'
    );
  }

  /**
   * Check if message has attachments
   * @private
   */
  static _hasAttachments(payload) {
    if (!payload) return false;

    // Check if any part has a filename
    const checkParts = (parts) => {
      if (!Array.isArray(parts)) return false;

      return parts.some((part) => {
        if (part.filename && part.filename.length > 0) {
          return true;
        }
        if (part.parts) {
          return checkParts(part.parts);
        }
        return false;
      });
    };

    return checkParts(payload.parts || []);
  }

  /**
   * Determine email category based on labels
   * @private
   */
  static _determineCategory(labels) {
    if (labels.includes('CATEGORY_PROMOTIONS')) return 'promotions';
    if (labels.includes('CATEGORY_SOCIAL')) return 'social';
    if (labels.includes('CATEGORY_UPDATES')) return 'updates';
    if (labels.includes('CATEGORY_FORUMS')) return 'forums';
    if (labels.includes('SPAM')) return 'spam';
    if (labels.includes('IMPORTANT')) return 'important';
    return 'primary';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailParser;
}
