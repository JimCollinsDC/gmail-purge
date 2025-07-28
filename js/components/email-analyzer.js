/**
 * Email Analyzer Component
 * Provides email analysis and statistics functionality
 */

class EmailAnalyzer {
  constructor() {
    this.analysisCache = new Map();
    this.analysisInProgress = false;
  }

  /**
   * Analyze emails by sender
   * @param {Array} emails - Array of email objects
   * @returns {Promise<Object>} Analysis results grouped by sender
   */
  async analyzeBySender(emails) {
    if (!emails || emails.length === 0) {
      return { totalEmails: 0, senders: [], topSenders: [] };
    }

    const cacheKey = 'sender_analysis';
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    const senderMap = new Map();
    const senderStats = new Map();

    // Group emails by sender
    emails.forEach((email) => {
      // Use the already parsed sender email as the key
      const senderKey = email.senderEmail || email.sender || 'unknown@unknown.com';
      
      if (!senderMap.has(senderKey)) {
        senderMap.set(senderKey, {
          name: email.senderName || email.sender || 'Unknown',
          email: email.senderEmail || senderKey,
          emails: [],
          totalSize: 0,
          categories: new Set(),
          dateRange: { earliest: null, latest: null },
        });
        senderStats.set(senderKey, {
          hasAttachments: 0,
          avgSize: 0,
          subjectVariations: new Set(),
        });
      }

      const sender = senderMap.get(senderKey);
      const stats = senderStats.get(senderKey);

      // Add email to sender
      sender.emails.push(email);
      sender.totalSize += email.size || 0;

      if (email.category) {
        sender.categories.add(email.category);
      }

      // Update date range
      const emailDate = new Date(email.date);
      if (!sender.dateRange.earliest || emailDate < sender.dateRange.earliest) {
        sender.dateRange.earliest = emailDate;
      }
      if (!sender.dateRange.latest || emailDate > sender.dateRange.latest) {
        sender.dateRange.latest = emailDate;
      }

      // Update stats
      if (email.hasAttachments) {
        stats.hasAttachments++;
      }
      if (email.subject) {
        stats.subjectVariations.add(email.subject.toLowerCase().trim());
      }
    });

    // Calculate additional metrics
    const senders = Array.from(senderMap.entries()).map(([key, sender]) => {
      const stats = senderStats.get(key);
      return {
        ...sender,
        id: key,
        count: sender.emails.length,
        avgSize:
          sender.emails.length > 0
            ? sender.totalSize / sender.emails.length
            : 0,
        attachmentRate:
          sender.emails.length > 0
            ? stats.hasAttachments / sender.emails.length
            : 0,
        subjectVariations: stats.subjectVariations.size,
        categories: Array.from(sender.categories),
        efficiency: this.calculateSenderEfficiency(sender),
      };
    });

    // Sort by email count
    senders.sort((a, b) => b.count - a.count);

    const result = {
      totalEmails: emails.length,
      senders,
      topSenders: senders.slice(0, 20),
      statistics: this.calculateSenderStatistics(senders),
    };

    this.analysisCache.set(cacheKey, result);
    return result;
  }

  /**
   * Analyze emails by subject patterns
   * @param {Array} emails - Array of email objects
   * @returns {Promise<Object>} Analysis results grouped by subject patterns
   */
  async analyzeBySubject(emails) {
    if (!emails || emails.length === 0) {
      return { totalEmails: 0, subjects: [], patterns: [] };
    }

    const cacheKey = 'subject_analysis';
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    const subjectMap = new Map();
    const patternMap = new Map();

    // Group emails by subject and detect patterns
    emails.forEach((email) => {
      const subject = email.subject || '(No Subject)';
      const normalizedSubject = this.normalizeSubject(subject);

      // Exact subject grouping
      if (!subjectMap.has(normalizedSubject)) {
        subjectMap.set(normalizedSubject, {
          subject,
          emails: [],
          senders: new Set(),
          totalSize: 0,
          dateRange: { earliest: null, latest: null },
        });
      }

      const subjectGroup = subjectMap.get(normalizedSubject);
      subjectGroup.emails.push(email);
      subjectGroup.senders.add(email.senderEmail || email.sender || 'unknown@unknown.com');
      subjectGroup.totalSize += email.sizeEstimate || 0;

      // Update date range
      const emailDate = new Date(email.date);
      if (
        !subjectGroup.dateRange.earliest ||
        emailDate < subjectGroup.dateRange.earliest
      ) {
        subjectGroup.dateRange.earliest = emailDate;
      }
      if (
        !subjectGroup.dateRange.latest ||
        emailDate > subjectGroup.dateRange.latest
      ) {
        subjectGroup.dateRange.latest = emailDate;
      }

      // Pattern detection
      const pattern = this.detectSubjectPattern(subject);
      if (pattern) {
        if (!patternMap.has(pattern)) {
          patternMap.set(pattern, {
            pattern,
            count: 0,
            examples: new Set(),
            senders: new Set(),
          });
        }
        const patternGroup = patternMap.get(pattern);
        patternGroup.count++;
        patternGroup.examples.add(subject);
        patternGroup.senders.add(email.senderEmail || email.sender || 'unknown@unknown.com');
      }
    });

    // Process results
    const subjects = Array.from(subjectMap.entries()).map(([key, group]) => ({
      ...group,
      id: key,
      count: group.emails.length,
      senderCount: group.senders.size,
      avgSize:
        group.emails.length > 0 ? group.totalSize / group.emails.length : 0,
    }));

    const patterns = Array.from(patternMap.entries()).map(([key, pattern]) => ({
      ...pattern,
      id: key,
      examples: Array.from(pattern.examples).slice(0, 5),
      senderCount: pattern.senders.size,
    }));

    // Sort results
    subjects.sort((a, b) => b.count - a.count);
    patterns.sort((a, b) => b.count - a.count);

    const result = {
      totalEmails: emails.length,
      subjects: subjects.slice(0, 100), // Limit to top 100
      patterns: patterns.slice(0, 20),
      statistics: this.calculateSubjectStatistics(subjects, patterns),
    };

    this.analysisCache.set(cacheKey, result);
    return result;
  }

  /**
   * Analyze email size distribution
   * @param {Array} emails - Array of email objects
   * @returns {Object} Size analysis results
   */
  analyzeSizeDistribution(emails) {
    if (!emails || emails.length === 0) {
      return { totalSize: 0, distribution: [], largeSenders: [] };
    }

    const sizeRanges = [
      { min: 0, max: 50 * 1024, label: 'Small (<50KB)' },
      { min: 50 * 1024, max: 500 * 1024, label: 'Medium (50KB-500KB)' },
      { min: 500 * 1024, max: 5 * 1024 * 1024, label: 'Large (500KB-5MB)' },
      { min: 5 * 1024 * 1024, max: Infinity, label: 'Very Large (>5MB)' },
    ];

    const distribution = sizeRanges.map((range) => ({
      ...range,
      count: 0,
      totalSize: 0,
      emails: [],
    }));

    let totalSize = 0;
    const senderSizeMap = new Map();

    emails.forEach((email) => {
      const size = email.sizeEstimate || 0;
      totalSize += size;

      // Find size range
      const range = distribution.find((r) => size >= r.min && size < r.max);
      if (range) {
        range.count++;
        range.totalSize += size;
        range.emails.push(email);
      }

      // Track sender sizes
      const senderKey = email.senderEmail || email.sender || 'unknown@unknown.com';
      if (!senderSizeMap.has(senderKey)) {
        senderSizeMap.set(senderKey, {
          sender: email.senderName || email.sender || 'Unknown',
          totalSize: 0,
          count: 0,
          avgSize: 0,
        });
      }

      const senderData = senderSizeMap.get(senderKey);
      senderData.totalSize += size;
      senderData.count++;
      senderData.avgSize = senderData.totalSize / senderData.count;
    });

    // Get top size contributors
    const largeSenders = Array.from(senderSizeMap.values())
      .sort((a, b) => b.totalSize - a.totalSize)
      .slice(0, 10);

    return {
      totalSize,
      distribution: distribution.map((range) => ({
        ...range,
        percentage: totalSize > 0 ? (range.totalSize / totalSize) * 100 : 0,
      })),
      largeSenders,
      avgEmailSize: emails.length > 0 ? totalSize / emails.length : 0,
    };
  }

  /**
   * Generate comprehensive analysis report
   * @param {Array} emails - Array of email objects
   * @returns {Promise<Object>} Complete analysis report
   */
  async generateReport(emails) {
    if (this.analysisInProgress) {
      throw new Error('Analysis already in progress');
    }

    this.analysisInProgress = true;

    try {
      const [senderAnalysis, subjectAnalysis] = await Promise.all([
        this.analyzeBySender(emails),
        this.analyzeBySubject(emails),
      ]);

      const sizeAnalysis = this.analyzeSizeDistribution(emails);
      const timeAnalysis = this.analyzeTimeDistribution(emails);
      const categoryAnalysis = this.analyzeCategoryDistribution(emails);

      const report = {
        overview: {
          totalEmails: emails.length,
          totalSize: sizeAnalysis.totalSize,
          avgEmailSize: sizeAnalysis.avgEmailSize,
          dateRange: this.getDateRange(emails),
          analysisDate: new Date(),
        },
        senders: senderAnalysis,
        subjects: subjectAnalysis,
        sizes: sizeAnalysis,
        timeline: timeAnalysis,
        categories: categoryAnalysis,
        insights: this.generateInsights(emails, {
          senderAnalysis,
          subjectAnalysis,
          sizeAnalysis,
          timeAnalysis,
          categoryAnalysis,
        }),
      };

      return report;
    } finally {
      this.analysisInProgress = false;
    }
  }

  /**
   * Normalize subject for grouping
   * @param {string} subject - Original subject
   * @returns {string} Normalized subject
   */
  normalizeSubject(subject) {
    if (!subject) return '(No Subject)';

    return subject
      .replace(/^(re:|fwd?:|fw:)\s*/gi, '') // Remove reply/forward prefixes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toLowerCase();
  }

  /**
   * Detect subject patterns (newsletters, notifications, etc.)
   * @param {string} subject - Email subject
   * @returns {string|null} Detected pattern or null
   */
  detectSubjectPattern(subject) {
    if (!subject) return null;

    const patterns = [
      {
        regex: /newsletter|digest|weekly|monthly|daily/i,
        pattern: 'Newsletter',
      },
      { regex: /notification|alert|reminder/i, pattern: 'Notification' },
      { regex: /receipt|invoice|payment|billing/i, pattern: 'Financial' },
      { regex: /confirmation|verify|activate/i, pattern: 'Confirmation' },
      { regex: /security|login|password|account/i, pattern: 'Security' },
      { regex: /update|changelog|release|version/i, pattern: 'Updates' },
      { regex: /meeting|calendar|event|invitation/i, pattern: 'Calendar' },
      { regex: /report|analytics|stats|summary/i, pattern: 'Reports' },
    ];

    const matchingPattern = patterns.find(({ regex }) => regex.test(subject));
    return matchingPattern ? matchingPattern.pattern : null;
  }

  /**
   * Calculate sender efficiency metrics
   * @param {Object} sender - Sender data
   * @returns {number} Efficiency score (0-100)
   */
  calculateSenderEfficiency(sender) {
    if (sender.emails.length === 0) return 0;

    let score = 0;

    // Email count factor (more emails = lower efficiency)
    const emailCountScore = Math.max(0, 100 - sender.emails.length / 10);
    score += emailCountScore * 0.4;

    // Size efficiency (smaller average size = higher efficiency)
    const avgSizeMB = sender.avgSize / (1024 * 1024);
    const sizeScore = Math.max(0, 100 - avgSizeMB * 20);
    score += sizeScore * 0.3;

    // Subject variation (more variation = higher engagement)
    const variationScore = Math.min(100, sender.subjectVariations * 5);
    score += variationScore * 0.3;

    return Math.round(score);
  }

  /**
   * Calculate sender statistics
   * @param {Array} senders - Array of sender data
   * @returns {Object} Statistical summary
   */
  calculateSenderStatistics(senders) {
    if (senders.length === 0) {
      return {
        totalSenders: 0,
        avgEmailsPerSender: 0,
        medianEmailsPerSender: 0,
      };
    }

    const emailCounts = senders.map((s) => s.count).sort((a, b) => a - b);
    const totalEmails = emailCounts.reduce((sum, count) => sum + count, 0);

    return {
      totalSenders: senders.length,
      avgEmailsPerSender: totalEmails / senders.length,
      medianEmailsPerSender: this.calculateMedian(emailCounts),
      top10Percentage:
        senders.length >= 10
          ? (senders.slice(0, 10).reduce((sum, s) => sum + s.count, 0) /
              totalEmails) *
            100
          : 100,
    };
  }

  /**
   * Calculate subject statistics
   * @param {Array} subjects - Array of subject data
   * @param {Array} patterns - Array of pattern data
   * @returns {Object} Statistical summary
   */
  calculateSubjectStatistics(subjects, patterns) {
    const duplicateSubjects = subjects.filter((s) => s.count > 1);
    const totalDuplicates = duplicateSubjects.reduce(
      (sum, s) => sum + s.count,
      0
    );

    return {
      uniqueSubjects: subjects.length,
      duplicateSubjects: duplicateSubjects.length,
      duplicateEmailCount: totalDuplicates,
      detectedPatterns: patterns.length,
      avgSubjectLength:
        subjects.length > 0
          ? subjects.reduce((sum, s) => sum + s.subject.length, 0) /
            subjects.length
          : 0,
    };
  }

  /**
   * Analyze time distribution of emails
   * @param {Array} emails - Array of email objects
   * @returns {Object} Time analysis results
   */
  analyzeTimeDistribution(emails) {
    const monthlyData = new Map();
    const weeklyData = new Map();
    const hourlyData = new Array(24).fill(0);

    emails.forEach((email) => {
      const date = new Date(email.date);

      // Monthly distribution
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1);

      // Weekly distribution (0 = Sunday)
      const dayOfWeek = date.getDay();
      weeklyData.set(dayOfWeek, (weeklyData.get(dayOfWeek) || 0) + 1);

      // Hourly distribution
      hourlyData[date.getHours()]++;
    });

    return {
      monthly: Array.from(monthlyData.entries()).map(([month, count]) => ({
        month,
        count,
      })),
      weekly: Array.from(weeklyData.entries()).map(([day, count]) => ({
        day: parseInt(day, 10),
        count,
      })),
      hourly: hourlyData.map((count, hour) => ({ hour, count })),
    };
  }

  /**
   * Analyze category distribution
   * @param {Array} emails - Array of email objects
   * @returns {Object} Category analysis results
   */
  analyzeCategoryDistribution(emails) {
    const categoryMap = new Map();

    emails.forEach((email) => {
      const category = email.category || 'uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 0, totalSize: 0 });
      }
      const categoryData = categoryMap.get(category);
      categoryData.count++;
      categoryData.totalSize += email.size || 0;
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      totalSize: data.totalSize,
      percentage: (data.count / emails.length) * 100,
    }));
  }

  /**
   * Generate insights from analysis data
   * @param {Array} emails - Original email array
   * @param {Object} analyses - All analysis results
   * @returns {Array} Array of insight objects
   */
  generateInsights(emails, analyses) {
    const insights = [];

    // Top sender insight
    if (analyses.senderAnalysis.topSenders.length > 0) {
      const topSender = analyses.senderAnalysis.topSenders[0];
      const percentage = (topSender.count / emails.length) * 100;
      let severity = 'low';
      if (percentage > 20) {
        severity = 'high';
      } else if (percentage > 10) {
        severity = 'medium';
      }

      insights.push({
        type: 'top_sender',
        title: 'Top Email Sender',
        description: `${Formatters.formatSender(topSender.name, topSender.email)} sent ${topSender.count} emails (${percentage.toFixed(1)}% of your total)`,
        severity,
      });
    }

    // Storage insight
    if (analyses.sizes.largeSenders.length > 0) {
      const topStorageUser = analyses.sizes.largeSenders[0];
      insights.push({
        type: 'storage',
        title: 'Largest Storage User',
        description: `${Formatters.formatSender(topStorageUser.sender.name, topStorageUser.sender.email)} uses ${Formatters.formatFileSize(topStorageUser.totalSize)} of storage`,
        severity:
          topStorageUser.totalSize > 100 * 1024 * 1024 ? 'high' : 'medium',
      });
    }

    // Duplicate subjects insight
    const duplicateSubjects = analyses.subjects.subjects.filter(
      (s) => s.count > 5
    );
    if (duplicateSubjects.length > 0) {
      insights.push({
        type: 'duplicates',
        title: 'Duplicate Emails Detected',
        description: `Found ${duplicateSubjects.length} subjects with 5+ duplicate emails. Consider cleaning up repeated messages.`,
        severity: 'medium',
      });
    }

    return insights;
  }

  /**
   * Get date range from emails
   * @param {Array} emails - Array of email objects
   * @returns {Object} Date range object
   */
  getDateRange(emails) {
    if (emails.length === 0) {
      return { earliest: null, latest: null };
    }

    const dates = emails
      .map((email) => new Date(email.date))
      .sort((a, b) => a - b);
    return {
      earliest: dates[0],
      latest: dates[dates.length - 1],
    };
  }

  /**
   * Calculate median of an array
   * @param {Array} values - Sorted array of numbers
   * @returns {number} Median value
   */
  calculateMedian(values) {
    if (values.length === 0) return 0;

    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0
      ? (values[mid - 1] + values[mid]) / 2
      : values[mid];
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailAnalyzer;
}
