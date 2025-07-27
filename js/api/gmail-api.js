/**
 * Gmail API Handler
 * Manages all interactions with the Gmail API
 */

class GmailAPI {
  constructor() {
    this.isInitialized = false;
    this.requestQueue = [];
    this.rateLimitDelay = APP_CONFIG.API_RATE_LIMIT_DELAY;
  }

  /**
   * Initialize Gmail API
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      await this._loadDiscoveryDocs();
      this.isInitialized = true;
      console.log('✅ Gmail API initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Gmail API initialization failed:', error);
      return false;
    }
  }

  /**
   * Get all email messages with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of email messages
   */
  async getAllMessages(options = {}) {
    if (!this._checkAuth()) return [];

    try {
      const allMessages = [];
      let nextPageToken = null;
      let pageCount = 0;
      const maxPages = options.maxPages || 50; // Limit to prevent infinite loops

      console.log('📧 Starting to fetch all messages...');

      do {
        // eslint-disable-next-line no-await-in-loop
        const response = await this._makeAPICall('gmail.users.messages.list', {
          userId: 'me',
          maxResults: APP_CONFIG.MAX_RESULTS_PER_BATCH,
          pageToken: nextPageToken,
          q: options.query || '',
        });

        if (response.messages) {
          allMessages.push(...response.messages);
          console.log(
            `📦 Fetched ${response.messages.length} messages (Total: ${allMessages.length})`
          );
        }

        nextPageToken = response.nextPageToken;
        pageCount++;

        // Update progress if callback provided
        if (options.onProgress) {
          options.onProgress({
            fetched: allMessages.length,
            hasMore: !!nextPageToken,
            page: pageCount,
          });
        }

        // Add delay to respect rate limits
        if (nextPageToken) {
          // eslint-disable-next-line no-await-in-loop
          await this._delay(this.rateLimitDelay);
        }
      } while (nextPageToken && pageCount < maxPages);

      console.log(`✅ Finished fetching ${allMessages.length} messages`);
      return allMessages;
    } catch (error) {
      console.error('❌ Failed to fetch messages:', error);
      this._handleAPIError(error);
      return [];
    }
  }

  /**
   * Get detailed information for multiple messages
   * @param {Array} messageIds - Array of message IDs
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Array>} Array of detailed messages
   */
  async getMessageDetails(messageIds, onProgress = null) {
    if (!this._checkAuth() || !messageIds.length) return [];

    try {
      console.log(`📧 Fetching details for ${messageIds.length} messages...`);
      const detailedMessages = [];
      const batchSize = APP_CONFIG.MAX_CONCURRENT_REQUESTS;

      // Process messages in batches
      for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize);

        // Create promises for batch requests
        const batchPromises = batch.map(async (messageId) => {
          try {
            const response = await this._makeAPICall(
              'gmail.users.messages.get',
              {
                userId: 'me',
                id: messageId,
                format: 'metadata',
                metadataHeaders: ['From', 'To', 'Subject', 'Date'],
              }
            );
            return response;
          } catch (error) {
            console.warn(`⚠️ Failed to fetch message ${messageId}:`, error);
            return null;
          }
        });

        // Wait for batch to complete
        // eslint-disable-next-line no-await-in-loop
        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter((result) => result !== null);
        detailedMessages.push(...validResults);

        // Update progress
        if (onProgress) {
          onProgress({
            processed: Math.min(i + batchSize, messageIds.length),
            total: messageIds.length,
            percentage: Math.round(
              (Math.min(i + batchSize, messageIds.length) / messageIds.length) *
                100
            ),
          });
        }

        console.log(
          `📦 Processed batch ${Math.ceil((i + batchSize) / batchSize)} - ${detailedMessages.length} total messages`
        );

        // Add delay between batches to respect rate limits
        if (i + batchSize < messageIds.length) {
          // eslint-disable-next-line no-await-in-loop
          await this._delay(this.rateLimitDelay * 2);
        }
      }

      console.log(
        `✅ Successfully fetched details for ${detailedMessages.length} messages`
      );
      return detailedMessages;
    } catch (error) {
      console.error('❌ Failed to fetch message details:', error);
      this._handleAPIError(error);
      return [];
    }
  }

  /**
   * Get user's Gmail profile information
   * @returns {Promise<Object|null>} Profile information
   */
  async getUserProfile() {
    if (!this._checkAuth()) return null;

    try {
      const response = await this._makeAPICall('gmail.users.getProfile', {
        userId: 'me',
      });

      return {
        emailAddress: response.emailAddress,
        messagesTotal: response.messagesTotal,
        threadsTotal: response.threadsTotal,
        historyId: response.historyId,
      };
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      this._handleAPIError(error);
      return null;
    }
  }

  /**
   * Get Gmail labels
   * @returns {Promise<Array>} Array of labels
   */
  async getLabels() {
    if (!this._checkAuth()) return [];

    try {
      const response = await this._makeAPICall('gmail.users.labels.list', {
        userId: 'me',
      });

      return response.labels || [];
    } catch (error) {
      console.error('❌ Failed to fetch labels:', error);
      this._handleAPIError(error);
      return [];
    }
  }

  // Private methods

  /**
   * Load Gmail API discovery documents
   * @private
   */
  async _loadDiscoveryDocs() {
    return new Promise((resolve, reject) => {
      gapi.load('client', {
        callback: async () => {
          try {
            await gapi.client.init({
              discoveryDocs: APP_CONFIG.DISCOVERY_DOCS,
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        onerror: () => reject(new Error('Failed to load Google API client')),
      });
    });
  }

  /**
   * Make API call with error handling and retry logic
   * @private
   * @param {string} method - API method name
   * @param {Object} params - API parameters
   * @param {number} retryCount - Current retry count
   * @returns {Promise<Object>} API response
   */
  async _makeAPICall(method, params, retryCount = 0) {
    const maxRetries = 3;

    try {
      // Navigate to the correct API method
      const methodParts = method.split('.');
      let apiMethod = gapi.client;

      methodParts.forEach((part) => {
        apiMethod = apiMethod[part];
      });

      const response = await apiMethod(params);
      return response.result;
    } catch (error) {
      console.error(`❌ API call failed for ${method}:`, error);

      // Handle rate limiting with exponential backoff
      if (error.status === 429 && retryCount < maxRetries) {
        const backoffDelay = 2 ** retryCount * 1000;
        console.log(`⏳ Rate limited. Retrying in ${backoffDelay}ms...`);

        await this._delay(backoffDelay);
        return this._makeAPICall(method, params, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Check if user is authenticated
   * @private
   * @returns {boolean} Authentication status
   */
  _checkAuth() {
    if (!gmailAuth.isUserSignedIn()) {
      console.warn('⚠️ User not authenticated for Gmail API calls');
      return false;
    }
    return true;
  }

  /**
   * Handle API errors
   * @private
   * @param {Error} error - The error that occurred
   */
  _handleAPIError(error) {
    let errorMessage = APP_CONFIG.ERROR_MESSAGES.GENERAL_ERROR;

    if (error.status === 429) {
      errorMessage = APP_CONFIG.ERROR_MESSAGES.API_QUOTA_EXCEEDED;
    } else if (error.status >= 500) {
      errorMessage =
        'Gmail service temporarily unavailable. Please try again later.';
    } else if (error.status === 401) {
      errorMessage = 'Authentication expired. Please sign in again.';
    }

    // Dispatch error event
    window.dispatchEvent(
      new CustomEvent('gmailAPIError', {
        detail: { error, message: errorMessage },
      })
    );
  }

  /**
   * Add delay for rate limiting
   * @private
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Delay promise
   */
  _delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

// Create global instance
// eslint-disable-next-line no-unused-vars
const gmailAPI = new GmailAPI();
