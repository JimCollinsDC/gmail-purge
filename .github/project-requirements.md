*THIS DOCUMENT WAS GENERATED WITH COPILOT AGENT*

# Gmail Purge - Project Requirements

## Project Overview
Gmail Purge is a browser-based web application that helps users analyze and understand their Gmail inbox by identifying unwanted emails based on configurable criteria. The application is **read-only** and provides detailed reports and insights without any ability to modify or delete emails. All analysis happens entirely in the browser using vanilla JavaScript and the Gmail API.

## Core Features

### 1. Gmail Authentication
- OAuth 2.0 integration with Google
- Secure token storage in browser localStorage
- Automatic token refresh handling
- Proper logout and token revocation

### 2. Email Analysis & Reporting
- **Sender-based analysis**: Identify emails from specific domains or addresses
- **Date-based analysis**: Find emails older than specified timeframe
- **Size-based analysis**: Identify large emails consuming storage space
- **Keyword analysis**: Search subject lines and content for specific terms
- **Subscription analysis**: Identify newsletter/marketing emails
- **Attachment analysis**: Find emails with/without attachments
- **Label-based analysis**: Analyze emails with existing Gmail labels
- **Spam/Promotional analysis**: Identify emails in spam or promotional categories

### 3. Reporting & Analytics
- **Detailed Reports**: Comprehensive analysis of email patterns
- **Storage Analysis**: Calculate storage used by different email types
- **Trend Analysis**: Show email volume over time
- **Category Breakdown**: Pie charts and graphs of email categories
- **Recommendation Engine**: Suggest what emails could be cleaned up
- **Export Reports**: Download analysis results as CSV/PDF
- **Visual Dashboards**: Interactive charts and graphs

### 4. User Interface
- Clean, intuitive dashboard with analytics
- Filter configuration for analysis criteria
- Email list view with sender, subject, date, size (read-only)
- Progress bars for analysis operations
- Interactive charts and statistics
- Responsive design for different screen sizes
- **Clear disclaimers**: Prominent notice that tool is read-only

### 5. Safety & Legal Protection
- **Read-Only Operation**: No ability to modify, delete, or change emails
- **Clear Disclaimers**: Prominent notices about read-only nature
- **Legal Disclaimers**: Clear terms that tool doesn't modify user data
- **Privacy First**: No data collection or storage of email content
- **User Education**: Clear explanations of what the tool does and doesn't do
- **External Action**: Provide instructions for users to manually clean up if desired

## Technical Requirements

### Gmail API Integration
- **Required Scopes**:
  - `https://www.googleapis.com/auth/gmail.readonly` (read-only access only)
- **API Endpoints**:
  - `gmail.users.messages.list` - List emails with filters (read-only)
  - `gmail.users.messages.get` - Get email details (read-only)
  - `gmail.users.labels.list` - Get user labels (read-only)
  - `gmail.users.profile.get` - Get user profile info (read-only)
- **Rate Limiting**: Respect Gmail API quotas (250 quota units per user per second)
- **Batch Processing**: Use batch requests where possible to minimize API calls
- **No Modification**: Absolutely no write operations to Gmail

### Data Storage (Browser)
- **localStorage**: Store user preferences, filter configurations, and OAuth tokens
- **sessionStorage**: Store temporary data during active sessions
- **No Server Storage**: All data processing happens client-side

### Analysis Configuration Schema
```javascript
const analysisConfig = {
  id: 'unique-analysis-id',
  name: 'Analysis Name',
  enabled: true,
  type: 'sender|date|size|keyword|subscription|attachment|label',
  criteria: {
    // Type-specific criteria
    senders: ['spam@example.com', '@marketing.com'],
    olderThan: 365, // days
    largerThan: 25, // MB
    keywords: ['unsubscribe', 'promotion'],
    hasAttachment: true,
    labels: ['SPAM', 'CATEGORY_PROMOTIONS']
  },
  reportType: 'summary|detailed|chart',
  lastRun: null,
  emailsFound: 0
};
```

## User Experience Requirements

### Onboarding Flow
1. **Welcome Screen**: Explain what Gmail Purge analyzes (read-only)
2. **Legal Disclaimer**: Clear statement that tool is read-only and safe
3. **Privacy Notice**: Explain data handling and privacy (no data stored)
4. **Gmail Authorization**: OAuth flow with read-only scope explanation
5. **Initial Setup**: Guide user through creating first analysis
6. **Feature Tutorial**: Explain reporting and analysis features

### Dashboard Layout
- **Header**: User info, logout, settings, **READ-ONLY disclaimer**
- **Navigation**: Analysis, Reports, Settings
- **Main Area**: 
  - Analysis configuration interface
  - Email report/list view (read-only)
  - Charts and statistics
  - Export buttons (CSV, PDF reports)
- **Status Bar**: API quota usage, last analysis time
- **Footer**: Legal disclaimers and read-only notices

### Analysis Management
- **Analysis Creation Wizard**: Step-by-step analysis setup
- **Analysis Templates**: Pre-built common analysis types
- **Report Generation**: Create detailed reports based on analysis  
- **Analysis History**: Track what each analysis has found
- **Export/Share**: Export analysis results and reports
- **Manual Instructions**: Provide users with steps to manually clean up emails if desired

## Security & Privacy Requirements

### Data Privacy
- **Read-Only Access**: Only reads emails, never modifies or deletes
- **Local Processing**: All email analysis happens in the browser
- **No Data Storage**: Application doesn't store user emails anywhere
- **Minimal Scopes**: Request only read-only Gmail permissions
- **Transparent Reporting**: Clear reports of what was analyzed
- **User Control**: Users can revoke access at any time
- **No External Transmission**: Email data never leaves the user's browser

### Security Measures
- **Secure Token Storage**: Encrypt OAuth tokens in localStorage
- **HTTPS Only**: Enforce secure connections
- **CSP Headers**: Implement Content Security Policy
- **Input Validation**: Sanitize all user inputs
- **Error Handling**: Don't expose sensitive information in errors

## Performance Requirements

### API Efficiency
- **Batch Requests**: Group API calls to minimize quota usage
- **Intelligent Caching**: Cache email metadata to reduce API calls
- **Incremental Processing**: Process emails in chunks with progress updates
- **Pagination**: Handle large inboxes efficiently

### User Experience
- **Response Time**: UI should respond within 200ms
- **Progress Indicators**: Show progress for operations > 2 seconds
- **Background Processing**: Don't block UI during API operations
- **Graceful Degradation**: Handle API errors and rate limits smoothly

## Deployment Requirements

### Hosting
- **Static Hosting**: Deploy to GitHub Pages, Netlify, or Vercel
- **Custom Domain**: Support custom domain configuration
- **HTTPS**: Ensure secure connections
- **CDN**: Use CDN for fast global loading

### Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Mobile Responsive**: Works on mobile devices

## Configuration & Settings

### User Preferences
```javascript
const userSettings = {
  theme: 'light|dark|auto',
  analysisDepth: 'shallow|medium|deep',
  batchSize: 50, // emails per analysis batch
  autoRefresh: false, // no auto actions
  showEmailContent: false, // privacy setting
  reportFormat: 'summary|detailed',
  language: 'en',
  disclaimerShown: true // track if user has seen read-only disclaimer
};
```

### Analysis Presets
- **Marketing Analysis**: Analyze promotional emails
- **Old Email Analysis**: Find emails older than X days
- **Large File Analysis**: Find emails with large attachments
- **Spam Analysis**: Additional spam pattern analysis
- **Newsletter Analysis**: Identify newsletter subscriptions
- **Storage Analysis**: Calculate storage usage by category

## Success Metrics

### User Goals
- **Storage Analysis**: Show MB/GB breakdown by email category
- **Email Insights**: Provide detailed analysis of email patterns
- **Organization Planning**: Help users understand their inbox better
- **Manual Cleanup Guidance**: Provide instructions for users to clean up manually

### Technical Metrics
- **API Efficiency**: API calls per email analyzed
- **Analysis Accuracy**: Quality of categorization and insights
- **Performance**: Page load times and analysis speeds
- **User Satisfaction**: Usefulness of reports and insights

## Future Enhancement Ideas

### Phase 2 Features
- **Smart Insights**: AI-powered email pattern recognition
- **Scheduled Analysis**: Automated periodic analysis reports
- **Advanced Analytics**: Machine learning-based categorization  
- **Multi-Account Analysis**: Analyze multiple Gmail accounts
- **Integration**: Connect with other Google services for insights

### Phase 3 Features
- **Comparative Analysis**: Compare inbox patterns over time
- **Industry Benchmarks**: Compare against anonymous usage patterns
- **Advanced Reporting**: Professional-grade reports and insights
- **API for Third Parties**: Allow other tools to use analysis (read-only)

---

*This document should be updated as the project evolves. Always refer to both this document and the general coding standards when implementing features.*
