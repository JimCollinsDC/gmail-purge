/**
 * Email List UI Component
 * Handles the display and interaction of email lists
 */

class EmailList {
  constructor() {
    this.currentEmails = [];
    this.filteredEmails = [];
    this.currentPage = 1;
    this.emailsPerPage = 50;
    this.sortBy = 'date';
    this.sortDirection = 'desc';
    this.filters = {
      search: '',
      dateRange: null,
      sizeRange: null,
      hasAttachments: null,
      category: null,
    };

    this.initializeElements();
    this.attachEventListeners();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.elements = {
      // Main containers
      emailListContainer: document.getElementById('email-list'),
      emailGrid: document.getElementById('email-grid'),

      // Controls
      searchInput: document.getElementById('email-search'),
      sortSelect: document.getElementById('sort-select'),
      filtersPanel: document.getElementById('filters-panel'),
      clearFiltersBtn: document.getElementById('clear-filters'),

      // Pagination
      paginationContainer: document.getElementById('pagination'),
      pageInfo: document.getElementById('page-info'),
      prevPageBtn: document.getElementById('prev-page'),
      nextPageBtn: document.getElementById('next-page'),

      // Bulk actions
      selectAllCheckbox: document.getElementById('select-all'),
      bulkActionsPanel: document.getElementById('bulk-actions'),
      selectedCount: document.getElementById('selected-count'),

      // Filters
      dateFromInput: document.getElementById('date-from'),
      dateToInput: document.getElementById('date-to'),
      minSizeInput: document.getElementById('min-size'),
      maxSizeInput: document.getElementById('max-size'),
      attachmentFilter: document.getElementById('attachment-filter'),
      categoryFilter: document.getElementById('category-filter'),
    };
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Search
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener(
        'input',
        this.debounce((e) => this.handleSearch(e.target.value), 300)
      );
    }

    // Sorting
    if (this.elements.sortSelect) {
      this.elements.sortSelect.addEventListener('change', (e) => {
        const [sortBy, direction] = e.target.value.split('-');
        this.setSorting(sortBy, direction);
      });
    }

    // Pagination
    if (this.elements.prevPageBtn) {
      this.elements.prevPageBtn.addEventListener('click', () =>
        this.previousPage()
      );
    }
    if (this.elements.nextPageBtn) {
      this.elements.nextPageBtn.addEventListener('click', () =>
        this.nextPage()
      );
    }

    // Bulk selection
    if (this.elements.selectAllCheckbox) {
      this.elements.selectAllCheckbox.addEventListener('change', (e) => {
        this.toggleSelectAll(e.target.checked);
      });
    }

    // Filters
    if (this.elements.clearFiltersBtn) {
      this.elements.clearFiltersBtn.addEventListener('click', () =>
        this.clearFilters()
      );
    }

    // Date filters
    if (this.elements.dateFromInput) {
      this.elements.dateFromInput.addEventListener('change', () =>
        this.updateDateFilter()
      );
    }
    if (this.elements.dateToInput) {
      this.elements.dateToInput.addEventListener('change', () =>
        this.updateDateFilter()
      );
    }

    // Size filters
    if (this.elements.minSizeInput) {
      this.elements.minSizeInput.addEventListener(
        'input',
        this.debounce(() => this.updateSizeFilter(), 500)
      );
    }
    if (this.elements.maxSizeInput) {
      this.elements.maxSizeInput.addEventListener(
        'input',
        this.debounce(() => this.updateSizeFilter(), 500)
      );
    }

    // Other filters
    if (this.elements.attachmentFilter) {
      this.elements.attachmentFilter.addEventListener('change', () =>
        this.updateAttachmentFilter()
      );
    }
    if (this.elements.categoryFilter) {
      this.elements.categoryFilter.addEventListener('change', () =>
        this.updateCategoryFilter()
      );
    }
  }

  /**
   * Display emails list
   * @param {Array} emails - Array of email objects
   */
  displayEmails(emails) {
    this.currentEmails = emails || [];
    this.filteredEmails = [...this.currentEmails];
    this.currentPage = 1;

    // Apply initial sorting
    this.sortEmails();

    // Apply filters if any
    this.applyFilters();

    // Render the list
    this.renderEmailList();

    // Update pagination
    this.updatePagination();

    // Show the email list container
    this.showEmailList();
  }

  /**
   * Render email list
   */
  renderEmailList() {
    if (!this.elements.emailGrid) return;

    const startIndex = (this.currentPage - 1) * this.emailsPerPage;
    const endIndex = startIndex + this.emailsPerPage;
    const pageEmails = this.filteredEmails.slice(startIndex, endIndex);

    if (pageEmails.length === 0) {
      this.elements.emailGrid.innerHTML = `
        <div class="no-emails">
          <h3>No emails found</h3>
          <p>Try adjusting your filters or search terms.</p>
        </div>
      `;
      return;
    }

    this.elements.emailGrid.innerHTML = pageEmails
      .map((email) => this.renderEmailItem(email))
      .join('');

    // Attach click handlers
    this.attachEmailItemHandlers();
  }

  /**
   * Render individual email item
   * @param {Object} email - Email object
   * @returns {string} HTML string
   */
  renderEmailItem(email) {
    const sender = EmailParser.parseSender(email.from);
    const isUnread = email.labelIds && email.labelIds.includes('UNREAD');
    const hasAttachments =
      email.payload &&
      email.payload.parts &&
      email.payload.parts.some(
        (part) => part.filename && part.filename.length > 0
      );

    return `
      <div class="email-item ${isUnread ? 'unread' : ''}" data-email-id="${email.id}">
        <div class="email-checkbox">
          <input type="checkbox" id="email-${email.id}" class="email-select">
        </div>
        
        <div class="email-sender">
          <div class="sender-name">${Formatters.formatSender(sender.name, sender.email, 25)}</div>
          <div class="sender-email">${sender.email}</div>
        </div>
        
        <div class="email-subject">
          <div class="subject-text">${Formatters.formatSubject(email.subject || '(No Subject)')}</div>
          <div class="email-snippet">${this.getEmailSnippet(email)}</div>
        </div>
        
        <div class="email-meta">
          <div class="email-date" title="${new Date(email.date).toLocaleString()}">
            ${Formatters.formatRelativeDate(email.date)}
          </div>
          <div class="email-size">${Formatters.formatFileSize(email.size || 0)}</div>
          ${hasAttachments ? '<div class="attachment-indicator" title="Has attachments">📎</div>' : ''}
          ${email.category ? `<div class="category-badge" style="background-color: ${Formatters.getCategoryColor(email.category)}">${Formatters.formatCategory(email.category)}</div>` : ''}
        </div>
        
        <div class="email-actions">
          <button class="btn-icon" onclick="emailList.viewEmail('${email.id}')" title="View email">
            👁️
          </button>
          <button class="btn-icon info-btn" onclick="emailList.showEmailInfo('${email.id}')" title="Email details">
            ℹ️
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Get email snippet for preview
   * @param {Object} email - Email object
   * @returns {string} Email snippet
   */
  getEmailSnippet(email) {
    if (email.snippet) {
      return Formatters.truncateText(email.snippet, 100);
    }

    // Try to extract from payload
    if (email.payload && email.payload.body && email.payload.body.data) {
      try {
        const decoded = atob(
          email.payload.body.data.replace(/-/g, '+').replace(/_/g, '/')
        );
        const stripped = decoded
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        return Formatters.truncateText(stripped, 100);
      } catch (e) {
        // Ignore decoding errors
      }
    }

    return 'No preview available';
  }

  /**
   * Attach handlers to email items
   */
  attachEmailItemHandlers() {
    // Individual email selection
    this.elements.emailGrid
      .querySelectorAll('.email-select')
      .forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          this.updateSelectionState();
          this.updateBulkActions();
        });
      });

    // Email item click (not on controls)
    this.elements.emailGrid.querySelectorAll('.email-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        if (
          !e.target.closest('.email-checkbox') &&
          !e.target.closest('.email-actions') &&
          !e.target.closest('button')
        ) {
          const { emailId } = item.dataset;
          this.viewEmail(emailId);
        }
      });
    });
  }

  /**
   * View email details
   * @param {string} emailId - Email ID
   */
  async viewEmail(emailId) {
    try {
      const email = this.currentEmails.find((e) => e.id === emailId);
      if (!email) {
        throw new Error('Email not found');
      }

      // Get full email details if needed
      const fullEmail = await GmailAPI.getEmail(emailId);

      // Show email in modal or dedicated view
      this.showEmailModal(fullEmail);
    } catch (error) {
      console.error('Failed to view email:', error);
      this.showMessage(`Failed to load email: ${error.message}`, 'error');
    }
  }

  /**
   * Show email info modal
   * @param {string} emailId - Email ID
   */
  showEmailInfo(emailId) {
    const email = this.currentEmails.find((e) => e.id === emailId);
    if (!email) return;

    const sender = EmailParser.parseSender(email.from);
    const hasAttachments =
      email.payload &&
      email.payload.parts &&
      email.payload.parts.some(
        (part) => part.filename && part.filename.length > 0
      );

    const infoHtml = `
      <div class="email-info-modal">
        <div class="modal-header">
          <h3>Email Information</h3>
          <button class="modal-close" onclick="this.closest('.email-info-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="info-grid">
            <div class="info-item">
              <label>From:</label>
              <span>${Formatters.formatSender(sender.name, sender.email)}</span>
            </div>
            <div class="info-item">
              <label>Subject:</label>
              <span>${email.subject || '(No Subject)'}</span>
            </div>
            <div class="info-item">
              <label>Date:</label>
              <span>${new Date(email.date).toLocaleString()}</span>
            </div>
            <div class="info-item">
              <label>Size:</label>
              <span>${Formatters.formatFileSize(email.size || 0)}</span>
            </div>
            <div class="info-item">
              <label>Has Attachments:</label>
              <span>${hasAttachments ? 'Yes' : 'No'}</span>
            </div>
            <div class="info-item">
              <label>Category:</label>
              <span>${email.category ? Formatters.formatCategory(email.category) : 'None'}</span>
            </div>
            <div class="info-item">
              <label>Labels:</label>
              <span>${email.labelIds ? email.labelIds.join(', ') : 'None'}</span>
            </div>
            <div class="info-item">
              <label>Thread ID:</label>
              <span class="monospace">${email.threadId}</span>
            </div>
            <div class="info-item">
              <label>Message ID:</label>
              <span class="monospace">${email.id}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = infoHtml;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  }

  /**
   * Show email content modal
   * @param {Object} email - Full email object
   */
  showEmailModal(email) {
    const sender = EmailParser.parseSender(email.from);
    const emailContent = this.extractEmailContent(email);

    const modalHtml = `
      <div class="email-modal">
        <div class="modal-header">
          <div class="email-header">
            <h3>${email.subject || '(No Subject)'}</h3>
            <div class="email-meta-line">
              <span class="sender">From: ${Formatters.formatSender(sender.name, sender.email)}</span>
              <span class="date">${new Date(email.date).toLocaleString()}</span>
            </div>
          </div>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="email-content">
            ${emailContent}
          </div>
        </div>
        <div class="modal-footer">
          <div class="email-actions-bar">
            <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
            <div class="email-size-info">Size: ${Formatters.formatFileSize(email.size || 0)}</div>
          </div>
        </div>
      </div>
    `;

    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = modalHtml;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  }

  /**
   * Extract email content for display
   * @param {Object} email - Email object
   * @returns {string} HTML content
   */
  extractEmailContent(email) {
    if (!email.payload) {
      return '<p>Email content not available.</p>';
    }

    // Try to get HTML content first, then plain text
    let content =
      this.extractFromParts(email.payload.parts, 'text/html') ||
      this.extractFromParts(email.payload.parts, 'text/plain') ||
      email.snippet ||
      'Content not available';

    // If it's plain text, convert to HTML
    if (!content.includes('<')) {
      content = content.replace(/\n/g, '<br>');
    }

    return `<div class="email-body">${content}</div>`;
  }

  /**
   * Extract content from email parts
   * @param {Array} parts - Email parts
   * @param {string} mimeType - MIME type to look for
   * @returns {string|null} Extracted content
   */
  extractFromParts(parts, mimeType) {
    if (!parts) return null;

    // eslint-disable-next-line no-restricted-syntax
    for (const part of parts) {
      if (part.mimeType === mimeType && part.body && part.body.data) {
        try {
          return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } catch (e) {
          console.error('Failed to decode email content:', e);
        }
      }

      // Recursively check nested parts
      if (part.parts) {
        const nestedContent = this.extractFromParts(part.parts, mimeType);
        if (nestedContent) return nestedContent;
      }
    }

    return null;
  }

  /**
   * Handle search input
   * @param {string} query - Search query
   */
  handleSearch(query) {
    this.filters.search = query.toLowerCase().trim();
    this.currentPage = 1;
    this.applyFilters();
    this.renderEmailList();
    this.updatePagination();
  }

  /**
   * Set sorting parameters
   * @param {string} sortBy - Field to sort by
   * @param {string} direction - Sort direction ('asc' or 'desc')
   */
  setSorting(sortBy, direction) {
    this.sortBy = sortBy;
    this.sortDirection = direction;
    this.currentPage = 1;
    this.sortEmails();
    this.renderEmailList();
    this.updatePagination();
  }

  /**
   * Sort emails array
   */
  sortEmails() {
    this.filteredEmails.sort((a, b) => {
      let valueA;
      let valueB;

      switch (this.sortBy) {
        case 'date':
          valueA = new Date(a.date);
          valueB = new Date(b.date);
          break;
        case 'sender':
          valueA = EmailParser.parseSender(a.from).name.toLowerCase();
          valueB = EmailParser.parseSender(b.from).name.toLowerCase();
          break;
        case 'subject':
          valueA = (a.subject || '').toLowerCase();
          valueB = (b.subject || '').toLowerCase();
          break;
        case 'size':
          valueA = a.size || 0;
          valueB = b.size || 0;
          break;
        default:
          return 0;
      }

      let comparison = 0;
      if (valueA < valueB) comparison = -1;
      else if (valueA > valueB) comparison = 1;

      return this.sortDirection === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Apply all active filters
   */
  applyFilters() {
    this.filteredEmails = this.currentEmails.filter((email) => {
      // Search filter
      if (this.filters.search) {
        const searchable = [
          email.subject || '',
          email.snippet || '',
          EmailParser.parseSender(email.from).name,
          EmailParser.parseSender(email.from).email,
        ]
          .join(' ')
          .toLowerCase();

        if (!searchable.includes(this.filters.search)) {
          return false;
        }
      }

      // Date range filter
      if (this.filters.dateRange) {
        const emailDate = new Date(email.date);
        if (
          this.filters.dateRange.from &&
          emailDate < this.filters.dateRange.from
        ) {
          return false;
        }
        if (
          this.filters.dateRange.to &&
          emailDate > this.filters.dateRange.to
        ) {
          return false;
        }
      }

      // Size range filter
      if (this.filters.sizeRange) {
        const emailSize = email.size || 0;
        if (
          this.filters.sizeRange.min &&
          emailSize < this.filters.sizeRange.min
        ) {
          return false;
        }
        if (
          this.filters.sizeRange.max &&
          emailSize > this.filters.sizeRange.max
        ) {
          return false;
        }
      }

      // Attachment filter
      if (this.filters.hasAttachments !== null) {
        const hasAttachments =
          email.payload &&
          email.payload.parts &&
          email.payload.parts.some(
            (part) => part.filename && part.filename.length > 0
          );
        if (this.filters.hasAttachments !== hasAttachments) {
          return false;
        }
      }

      // Category filter
      if (this.filters.category && this.filters.category !== 'all') {
        if (email.category !== this.filters.category) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Update date filter
   */
  updateDateFilter() {
    const fromDate = this.elements.dateFromInput?.value
      ? new Date(this.elements.dateFromInput.value)
      : null;
    const toDate = this.elements.dateToInput?.value
      ? new Date(this.elements.dateToInput.value)
      : null;

    if (fromDate || toDate) {
      this.filters.dateRange = { from: fromDate, to: toDate };
    } else {
      this.filters.dateRange = null;
    }

    this.currentPage = 1;
    this.applyFilters();
    this.renderEmailList();
    this.updatePagination();
  }

  /**
   * Update size filter
   */
  updateSizeFilter() {
    const minSize = this.elements.minSizeInput?.value
      ? parseInt(this.elements.minSizeInput.value, 10) * 1024
      : null;
    const maxSize = this.elements.maxSizeInput?.value
      ? parseInt(this.elements.maxSizeInput.value, 10) * 1024
      : null;

    if (minSize || maxSize) {
      this.filters.sizeRange = { min: minSize, max: maxSize };
    } else {
      this.filters.sizeRange = null;
    }

    this.currentPage = 1;
    this.applyFilters();
    this.renderEmailList();
    this.updatePagination();
  }

  /**
   * Update attachment filter
   */
  updateAttachmentFilter() {
    const value = this.elements.attachmentFilter?.value;
    this.filters.hasAttachments = value === 'all' ? null : value === 'with';

    this.currentPage = 1;
    this.applyFilters();
    this.renderEmailList();
    this.updatePagination();
  }

  /**
   * Update category filter
   */
  updateCategoryFilter() {
    const value = this.elements.categoryFilter?.value;
    this.filters.category = value === 'all' ? null : value;

    this.currentPage = 1;
    this.applyFilters();
    this.renderEmailList();
    this.updatePagination();
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.filters = {
      search: '',
      dateRange: null,
      sizeRange: null,
      hasAttachments: null,
      category: null,
    };

    // Reset form elements
    if (this.elements.searchInput) this.elements.searchInput.value = '';
    if (this.elements.dateFromInput) this.elements.dateFromInput.value = '';
    if (this.elements.dateToInput) this.elements.dateToInput.value = '';
    if (this.elements.minSizeInput) this.elements.minSizeInput.value = '';
    if (this.elements.maxSizeInput) this.elements.maxSizeInput.value = '';
    if (this.elements.attachmentFilter)
      this.elements.attachmentFilter.value = 'all';
    if (this.elements.categoryFilter)
      this.elements.categoryFilter.value = 'all';

    this.currentPage = 1;
    this.applyFilters();
    this.renderEmailList();
    this.updatePagination();
  }

  /**
   * Update pagination controls
   */
  updatePagination() {
    const totalPages = Math.ceil(
      this.filteredEmails.length / this.emailsPerPage
    );

    if (this.elements.pageInfo) {
      const startItem = Math.min(
        (this.currentPage - 1) * this.emailsPerPage + 1,
        this.filteredEmails.length
      );
      const endItem = Math.min(
        this.currentPage * this.emailsPerPage,
        this.filteredEmails.length
      );

      this.elements.pageInfo.textContent = `${startItem}-${endItem} of ${Formatters.formatNumber(this.filteredEmails.length)} emails`;
    }

    if (this.elements.prevPageBtn) {
      this.elements.prevPageBtn.disabled = this.currentPage <= 1;
    }

    if (this.elements.nextPageBtn) {
      this.elements.nextPageBtn.disabled = this.currentPage >= totalPages;
    }
  }

  /**
   * Go to previous page
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderEmailList();
      this.updatePagination();
    }
  }

  /**
   * Go to next page
   */
  nextPage() {
    const totalPages = Math.ceil(
      this.filteredEmails.length / this.emailsPerPage
    );
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.renderEmailList();
      this.updatePagination();
    }
  }

  /**
   * Toggle select all emails
   * @param {boolean} selected - Whether to select all
   */
  toggleSelectAll(selected) {
    this.elements.emailGrid
      .querySelectorAll('.email-select')
      .forEach((checkbox) => {
        const checkboxElement = checkbox;
        checkboxElement.checked = selected;
      });
    this.updateBulkActions();
  }

  /**
   * Update selection state
   */
  updateSelectionState() {
    const checkboxes =
      this.elements.emailGrid.querySelectorAll('.email-select');
    const selectedCheckboxes = this.elements.emailGrid.querySelectorAll(
      '.email-select:checked'
    );

    if (this.elements.selectAllCheckbox) {
      this.elements.selectAllCheckbox.indeterminate =
        selectedCheckboxes.length > 0 &&
        selectedCheckboxes.length < checkboxes.length;
      this.elements.selectAllCheckbox.checked =
        checkboxes.length > 0 &&
        selectedCheckboxes.length === checkboxes.length;
    }
  }

  /**
   * Update bulk actions panel
   */
  updateBulkActions() {
    const selectedEmails = this.getSelectedEmails();

    if (this.elements.selectedCount) {
      this.elements.selectedCount.textContent = `${selectedEmails.length} selected`;
    }

    if (this.elements.bulkActionsPanel) {
      this.elements.bulkActionsPanel.style.display =
        selectedEmails.length > 0 ? 'flex' : 'none';
    }
  }

  /**
   * Get selected email IDs
   * @returns {Array} Array of selected email IDs
   */
  getSelectedEmails() {
    const selectedIds = [];
    this.elements.emailGrid
      .querySelectorAll('.email-select:checked')
      .forEach((checkbox) => {
        const emailItem = checkbox.closest('.email-item');
        if (emailItem) {
          selectedIds.push(emailItem.dataset.emailId);
        }
      });
    return selectedIds;
  }

  /**
   * Show email list container
   */
  showEmailList() {
    if (this.elements.emailListContainer) {
      this.elements.emailListContainer.style.display = 'block';
    }
  }

  /**
   * Hide email list container
   */
  hideEmailList() {
    if (this.elements.emailListContainer) {
      this.elements.emailListContainer.style.display = 'none';
    }
  }

  /**
   * Show message to user
   * @param {string} message - Message text
   * @param {string} type - Message type
   */
  showMessage(message, type = 'info') {
    // Use the same message system as Dashboard
    if (window.dashboard) {
      window.dashboard.showMessage(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  /**
   * Debounce function for input events
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize email list when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-unused-vars
  const emailList = new EmailList();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailList;
}
