/**
 * Dashboard UI Component
 * Manages the main dashboard interface and statistics display
 */

class Dashboard {
  constructor() {
    this.emailAnalyzer = new EmailAnalyzer();
    this.isAnalyzing = false;
    this.currentAnalysis = null;
    this.selectedPreset = 'all';

    this.initializeElements();
    this.attachEventListeners();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.elements = {
      // Main containers
      dashboardContainer: document.getElementById('dashboard'),
      loadingIndicator: document.getElementById('loading'),
      errorContainer: document.getElementById('error'),

      // Stats overview
      totalEmailsCount: document.getElementById('total-emails'),
      totalSendersCount: document.getElementById('total-senders'),
      totalSizeValue: document.getElementById('total-size'),
      avgSizeValue: document.getElementById('avg-size'),

      // Progress and status
      progressBar: document.querySelector('.progress-bar'),
      statusText: document.getElementById('status-text'),

      // Analysis controls
      analyzeButton: document.getElementById('analyze-emails'),
      presetSelect: document.getElementById('analysis-preset'),
      refreshButton: document.getElementById('refresh-data'),

      // Navigation
      viewToggleButtons: document.querySelectorAll('.view-toggle'),
      breadcrumbs: document.getElementById('breadcrumbs'),

      // Content areas
      sendersList: document.getElementById('senders-list'),
      subjectsList: document.getElementById('subjects-list'),
      insightsList: document.getElementById('insights-list'),
    };
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Analysis controls
    if (this.elements.analyzeButton) {
      this.elements.analyzeButton.addEventListener('click', () =>
        this.startAnalysis()
      );
    }

    if (this.elements.presetSelect) {
      this.elements.presetSelect.addEventListener('change', (e) => {
        this.selectedPreset = e.target.value;
        this.updateAnalysisPreset();
      });
    }

    if (this.elements.refreshButton) {
      this.elements.refreshButton.addEventListener('click', () =>
        this.refreshData()
      );
    }

    // View toggles
    this.elements.viewToggleButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const { view } = e.target.dataset;
        this.switchView(view);
      });
    });

    // Global error handler
    window.addEventListener('error', (e) => {
      this.showError(`An unexpected error occurred: ${e.message}`);
    });
  }

  /**
   * Start email analysis process
   */
  async startAnalysis() {
    if (this.isAnalyzing) {
      this.showMessage('Analysis already in progress...', 'warning');
      return;
    }

    try {
      this.isAnalyzing = true;
      this.showLoading('Connecting to Gmail...');
      this.updateAnalyzeButton(true);

      // Check authentication
      if (!gmailAuth.isUserSignedIn()) {
        this.showLoading('Please sign in to Gmail...');
        await gmailAuth.signIn();
      }

      // Fetch emails based on preset
      this.showLoading('Fetching emails...');
      const emails = await this.fetchEmailsByPreset();

      if (emails.length === 0) {
        this.showMessage(
          'No emails found matching the selected criteria.',
          'info'
        );
        return;
      }

      // Analyze emails
      this.showLoading(`Analyzing ${emails.length} emails...`);
      this.currentAnalysis = await this.emailAnalyzer.generateReport(emails);

      // Update dashboard
      this.updateDashboard(this.currentAnalysis);
      this.hideLoading();
      this.showMessage(
        `Analysis complete! Found ${emails.length} emails from ${this.currentAnalysis.senders.senders.length} senders.`,
        'success'
      );
    } catch (error) {
      console.error('Analysis failed:', error);
      this.showError(`Analysis failed: ${error.message}`);
    } finally {
      this.isAnalyzing = false;
      this.updateAnalyzeButton(false);
    }
  }

  /**
   * Fetch emails based on selected preset
   * @returns {Promise<Array>} Array of email objects
   */
  async fetchEmailsByPreset() {
    const presets = {
      all: { query: '', maxResults: 1000 },
      'recent-month': { query: 'newer_than:1m', maxResults: 1000 },
      'recent-year': { query: 'newer_than:1y', maxResults: 2000 },
      'large-emails': { query: 'larger:5M', maxResults: 500 },
      'with-attachments': { query: 'has:attachment', maxResults: 1000 },
      promotions: { query: 'category:promotions', maxResults: 1000 },
      social: { query: 'category:social', maxResults: 1000 },
      unread: { query: 'is:unread', maxResults: 500 },
    };

    const preset = presets[this.selectedPreset] || presets.all;

    const updateProgress = (current, total) => {
      const percentage = Math.round((current / total) * 100);
      this.updateProgress(percentage, `Fetching emails... ${current}/${total}`);
    };

    return GmailAPI.fetchEmails(
      preset.query,
      preset.maxResults,
      updateProgress
    );
  }

  /**
   * Update dashboard with analysis results
   * @param {Object} analysis - Analysis results
   */
  updateDashboard(analysis) {
    // Update overview stats
    this.updateOverviewStats(analysis.overview);

    // Update senders list
    this.updateSendersList(analysis.senders);

    // Update insights
    this.updateInsights(analysis.insights);

    // Show dashboard
    this.showDashboard();
  }

  /**
   * Update overview statistics
   * @param {Object} overview - Overview data
   */
  updateOverviewStats(overview) {
    if (this.elements.totalEmailsCount) {
      this.elements.totalEmailsCount.textContent = Formatters.formatNumber(
        overview.totalEmails
      );
    }

    if (
      this.elements.totalSendersCount &&
      this.currentAnalysis.senders.senders
    ) {
      this.elements.totalSendersCount.textContent = Formatters.formatNumber(
        this.currentAnalysis.senders.senders.length
      );
    }

    if (this.elements.totalSizeValue) {
      this.elements.totalSizeValue.textContent = Formatters.formatFileSize(
        overview.totalSize
      );
    }

    if (this.elements.avgSizeValue) {
      this.elements.avgSizeValue.textContent = Formatters.formatFileSize(
        overview.avgEmailSize
      );
    }
  }

  /**
   * Update senders list display
   * @param {Object} sendersData - Senders analysis data
   */
  updateSendersList(sendersData) {
    if (!this.elements.sendersList) return;

    const topSenders = sendersData.topSenders || [];

    this.elements.sendersList.innerHTML = topSenders
      .map(
        (sender) => `
      <div class="sender-item" data-sender-id="${sender.id}">
        <div class="sender-info">
          <div class="sender-name">${Formatters.formatSender(sender.name, sender.email, 40)}</div>
          <div class="sender-email">${sender.email}</div>
        </div>
        <div class="sender-stats">
          <div class="stat">
            <span class="stat-value">${Formatters.formatNumber(sender.count)}</span>
            <span class="stat-label">emails</span>
          </div>
          <div class="stat">
            <span class="stat-value">${Formatters.formatFileSize(sender.totalSize)}</span>
            <span class="stat-label">total size</span>
          </div>
          <div class="stat">
            <span class="stat-value">${Formatters.formatFileSize(sender.avgSize)}</span>
            <span class="stat-label">avg size</span>
          </div>
        </div>
        <div class="sender-actions">
          <button class="btn-secondary" onclick="dashboard.viewSenderDetails('${sender.id}')">
            View Details
          </button>
        </div>
      </div>
    `
      )
      .join('');

    // Add click handlers for sender items
    this.elements.sendersList
      .querySelectorAll('.sender-item')
      .forEach((item) => {
        item.addEventListener('click', (e) => {
          if (!e.target.classList.contains('btn-secondary')) {
            const { senderId } = item.dataset;
            this.viewSenderDetails(senderId);
          }
        });
      });
  }

  /**
   * Update insights display
   * @param {Array} insights - Array of insight objects
   */
  updateInsights(insights) {
    if (!this.elements.insightsList || !insights.length) return;

    this.elements.insightsList.innerHTML = insights
      .map(
        (insight) => `
      <div class="insight-item severity-${insight.severity}">
        <div class="insight-icon">
          ${this.getInsightIcon(insight.type)}
        </div>
        <div class="insight-content">
          <h4 class="insight-title">${insight.title}</h4>
          <p class="insight-description">${insight.description}</p>
        </div>
      </div>
    `
      )
      .join('');
  }

  /**
   * Get icon for insight type
   * @param {string} type - Insight type
   * @returns {string} Icon HTML
   */
  getInsightIcon(type) {
    const icons = {
      top_sender: '👤',
      storage: '💾',
      duplicates: '📋',
      large_emails: '📦',
      old_emails: '📅',
    };
    return icons[type] || '💡';
  }

  /**
   * View sender details
   * @param {string} senderId - Sender ID
   */
  viewSenderDetails(senderId) {
    if (!this.currentAnalysis) return;

    const sender = this.currentAnalysis.senders.senders.find(
      (s) => s.id === senderId
    );
    if (!sender) return;

    // Update breadcrumbs
    this.updateBreadcrumbs([
      { text: 'Dashboard', action: () => this.showDashboard() },
      {
        text: Formatters.formatSender(sender.name, sender.email, 30),
        active: true,
      },
    ]);

    // Show sender details view
    this.showSenderDetails(sender);
  }

  /**
   * Show sender details view
   * @param {Object} sender - Sender data
   */
  showSenderDetails(sender) {
    const detailsHtml = `
      <div class="sender-details">
        <div class="sender-header">
          <h2>${Formatters.formatSender(sender.name, sender.email)}</h2>
          <div class="sender-meta">
            <span class="badge">${Formatters.formatEmailCount(sender.count)}</span>
            <span class="badge">${Formatters.formatFileSize(sender.totalSize)} total</span>
            <span class="badge">${sender.categories.map((cat) => Formatters.formatCategory(cat)).join(', ')}</span>
          </div>
        </div>
        
        <div class="sender-subjects">
          <h3>Email Subjects (${sender.subjectVariations} unique)</h3>
          <div class="subjects-list">
            ${this.renderSenderSubjects(sender)}
          </div>
        </div>
        
        <div class="sender-timeline">
          <h3>Email Timeline</h3>
          <p>From ${Formatters.formatShortDate(sender.dateRange.earliest)} to ${Formatters.formatShortDate(sender.dateRange.latest)}</p>
        </div>
      </div>
    `;

    this.elements.dashboardContainer.innerHTML = detailsHtml;
  }

  /**
   * Render subjects for a sender
   * @param {Object} sender - Sender data
   * @returns {string} HTML string
   */
  renderSenderSubjects(sender) {
    if (!sender.emails) return '<p>No emails found.</p>';

    // Group emails by subject
    const subjectGroups = EmailParser.groupEmailsBySubject(sender.emails);
    const sortedSubjects = Object.entries(subjectGroups)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 20); // Show top 20 subjects

    return sortedSubjects
      .map(
        ([subject, emails]) => `
      <div class="subject-group">
        <div class="subject-title">${Formatters.formatSubject(subject)}</div>
        <div class="subject-count">${Formatters.formatEmailCount(emails.length)}</div>
      </div>
    `
      )
      .join('');
  }

  /**
   * Update breadcrumbs navigation
   * @param {Array} items - Breadcrumb items
   */
  updateBreadcrumbs(items) {
    if (!this.elements.breadcrumbs) return;

    this.elements.breadcrumbs.innerHTML = items
      .map((item) => {
        if (item.active) {
          return `<span class="breadcrumb-item active">${item.text}</span>`;
        }
        return `<button class="breadcrumb-item" onclick="(${item.action.toString()})()">${item.text}</button>`;
      })
      .join('<span class="breadcrumb-separator">›</span>');
  }

  /**
   * Switch between different views
   * @param {string} view - View name ('dashboard', 'senders', 'subjects')
   */
  switchView(view) {
    // Update active button
    this.elements.viewToggleButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Show appropriate content
    switch (view) {
      case 'senders':
        this.showSendersView();
        break;
      case 'subjects':
        this.showSubjectsView();
        break;
      default:
        this.showDashboard();
    }
  }

  /**
   * Show senders view
   */
  showSendersView() {
    if (!this.currentAnalysis) {
      this.showMessage('Please analyze your emails first.', 'info');
      return;
    }

    this.updateBreadcrumbs([
      { text: 'Dashboard', action: () => this.showDashboard() },
      { text: 'Senders', active: true },
    ]);

    // Show full senders list
    this.elements.dashboardContainer.innerHTML = `
      <div class="senders-view">
        <h2>All Senders (${this.currentAnalysis.senders.senders.length})</h2>
        <div class="senders-grid">
          ${this.renderFullSendersList()}
        </div>
      </div>
    `;
  }

  /**
   * Render full senders list
   * @returns {string} HTML string
   */
  renderFullSendersList() {
    if (!this.currentAnalysis) return '';

    return this.currentAnalysis.senders.senders
      .map(
        (sender) => `
      <div class="sender-card" onclick="dashboard.viewSenderDetails('${sender.id}')">
        <div class="sender-name">${Formatters.formatSender(sender.name, sender.email, 25)}</div>
        <div class="sender-stats-grid">
          <div class="stat-item">
            <span class="stat-number">${Formatters.formatNumber(sender.count)}</span>
            <span class="stat-label">emails</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${Formatters.formatFileSize(sender.totalSize)}</span>
            <span class="stat-label">size</span>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  }

  /**
   * Show subjects view
   */
  showSubjectsView() {
    if (!this.currentAnalysis) {
      this.showMessage('Please analyze your emails first.', 'info');
      return;
    }

    this.updateBreadcrumbs([
      { text: 'Dashboard', action: () => this.showDashboard() },
      { text: 'Subjects', active: true },
    ]);

    this.elements.dashboardContainer.innerHTML = `
      <div class="subjects-view">
        <h2>Email Subjects</h2>
        <div class="subjects-stats">
          <div class="stat-box">
            <span class="stat-number">${Formatters.formatNumber(this.currentAnalysis.subjects.subjects.length)}</span>
            <span class="stat-label">Unique Subjects</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">${Formatters.formatNumber(this.currentAnalysis.subjects.statistics.duplicateSubjects)}</span>
            <span class="stat-label">With Duplicates</span>
          </div>
        </div>
        <div class="subjects-list">
          ${this.renderSubjectsList()}
        </div>
      </div>
    `;
  }

  /**
   * Render subjects list
   * @returns {string} HTML string
   */
  renderSubjectsList() {
    if (!this.currentAnalysis) return '';

    return this.currentAnalysis.subjects.subjects
      .slice(0, 50)
      .map(
        (subject) => `
      <div class="subject-item">
        <div class="subject-content">
          <div class="subject-text">${Formatters.formatSubject(subject.subject)}</div>
          <div class="subject-meta">
            ${Formatters.formatEmailCount(subject.count)} • 
            ${Formatters.formatNumber(subject.senderCount)} sender${subject.senderCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div class="subject-size">${Formatters.formatFileSize(subject.totalSize)}</div>
      </div>
    `
      )
      .join('');
  }

  /**
   * Show main dashboard view
   */
  showDashboard() {
    this.updateBreadcrumbs([{ text: 'Dashboard', active: true }]);

    // Reset to original dashboard content
    location.reload(); // Simple way to reset to original state
  }

  /**
   * Update analysis preset
   */
  updateAnalysisPreset() {
    if (this.currentAnalysis) {
      this.showMessage(
        `Preset changed to "${this.selectedPreset}". Click Analyze to refresh data.`,
        'info'
      );
    }
  }

  /**
   * Refresh data
   */
  async refreshData() {
    if (this.isAnalyzing) return;

    this.emailAnalyzer.clearCache();
    StorageHelper.clearCache();
    await this.startAnalysis();
  }

  /**
   * Update progress display
   * @param {number} percentage - Progress percentage (0-100)
   * @param {string} status - Status text
   */
  updateProgress(percentage, status) {
    if (this.elements.progressBar) {
      this.elements.progressBar.style.width = `${percentage}%`;
    }
    if (this.elements.statusText) {
      this.elements.statusText.textContent = status;
    }
  }

  /**
   * Update analyze button state
   * @param {boolean} analyzing - Whether analysis is in progress
   */
  updateAnalyzeButton(analyzing) {
    if (!this.elements.analyzeButton) return;

    this.elements.analyzeButton.disabled = analyzing;
    this.elements.analyzeButton.textContent = analyzing
      ? 'Analyzing...'
      : 'Analyze Emails';
  }

  /**
   * Show loading state
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    if (this.elements.loadingIndicator) {
      this.elements.loadingIndicator.style.display = 'flex';
    }
    this.updateProgress(0, message);
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    if (this.elements.loadingIndicator) {
      this.elements.loadingIndicator.style.display = 'none';
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.hideLoading();
    if (this.elements.errorContainer) {
      this.elements.errorContainer.innerHTML = `
        <div class="error-message">
          <h3>Error</h3>
          <p>${message}</p>
          <button onclick="dashboard.clearError()" class="btn-secondary">Dismiss</button>
        </div>
      `;
      this.elements.errorContainer.style.display = 'block';
    }
    console.error('Dashboard Error:', message);
  }

  /**
   * Show info/success message
   * @param {string} message - Message text
   * @param {string} type - Message type ('info', 'success', 'warning')
   */
  showMessage(message, type = 'info') {
    // Create temporary message element
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" class="message-close">×</button>
    `;

    document.body.appendChild(messageEl);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageEl.parentElement) {
        messageEl.remove();
      }
    }, 5000);
  }

  /**
   * Clear error display
   */
  clearError() {
    if (this.elements.errorContainer) {
      this.elements.errorContainer.style.display = 'none';
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-unused-vars
  const dashboard = new Dashboard();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dashboard;
}
