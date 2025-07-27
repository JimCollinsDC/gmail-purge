*THIS DOCUMENT WAS GENERATED WITH COPILOT AGENT*

# JavaScript Coding Standards for GitHub Copilot

## Project Overview
This document contains general coding standards and architectural guidelines for JavaScript projects. Project-specific requirements and implementation details should be documented in separate files.

## Coding Standards

### Style Guide
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use ESLint with Airbnb configuration for automated style enforcement
- Configure Prettier to work alongside Airbnb rules

### General Principles
- Write clean, readable, and maintainable code
- Follow DRY (Don't Repeat Yourself) principles
- Use meaningful variable and function names
- Include comprehensive error handling
- Write code with security in mind (especially for authentication and data handling)

### Naming Conventions (Airbnb Style)
- Use camelCase for variables and functions
- Use PascalCase for classes and constructors
- Use UPPER_SNAKE_CASE for constants
- Use kebab-case for file names
- Prefix private methods with underscore `_`
- Use descriptive names over abbreviations
- Use verbs for functions (e.g., `getUserData()` not `userData()`)
- Use nouns for variables and classes

### File Organization
```
/
├── package.json   # npm configuration and scripts
├── index.html     # Main HTML file
├── css/
│   └── styles.css # Styling
├── js/
│   ├── auth/      # Authentication related code
│   ├── api/       # API interactions
│   ├── components/ # Reusable components
│   ├── ui/        # User interface components
│   ├── utils/     # Utility functions
│   └── config/    # Configuration constants
├── assets/        # Images, icons, etc.
├── dist/          # Built/bundled files (if using build tools)
└── node_modules/  # npm dependencies
```

## Architecture Decisions

### Technology Stack
- **Language**: Vanilla JavaScript (ES6+)
- **Runtime**: Browser
- **Framework**: None (vanilla HTML, CSS, JS)
- **API**: RESTful APIs (via browser)
- **Authentication**: OAuth 2.0 or similar (JavaScript client)
- **Storage**: localStorage / sessionStorage
- **Package Manager**: npm (for dev tools and build process)

### Key Patterns (Following Airbnb Guidelines)
- Use async/await for all asynchronous operations (prefer over Promises)
- Use arrow functions for callbacks and short functions
- Use destructuring assignment when appropriate
- Use template literals instead of string concatenation
- Implement proper rate limiting for API calls
- Use dependency injection for better testability
- Implement logging for debugging and audit trails
- Follow authentication security best practices
- Use const for values that won't be reassigned, let for variables that will
- Avoid var declarations

### Error Handling
- Always handle API rate limits gracefully
- Provide user-friendly error messages
- Log detailed errors for debugging
- Implement retry logic for transient failures
- Validate all user inputs

## Security Requirements

### API Access
- Store authentication tokens securely in browser storage (localStorage/sessionStorage)
- Implement token refresh logic using appropriate client libraries
- Never log sensitive user data to console
- Use minimum required scopes/permissions
- Implement proper logout/token revocation
- Handle browser storage limitations gracefully

### Data Privacy
- Process data locally when possible
- Don't store sensitive content unnecessarily
- Respect user privacy preferences
- Implement secure credential storage

## Testing Requirements

### Unit Tests
- Test all business logic thoroughly
- Mock API responses
- Test error handling scenarios
- Maintain > 80% code coverage

### Integration Tests
- Test authentication flow end-to-end
- Test API integration
- Test rate limiting behavior

### User Acceptance Tests
- Test common use cases
- Test edge cases (empty data, large datasets)
- Test error scenarios users might encounter

## Development Guidelines

### Version Control & Git Practices
- Use meaningful commit messages following conventional commits format
- Create feature branches for development (`feature/`, `bugfix/`, `hotfix/`)
- Use pull requests for code review
- Keep commits atomic and focused
- Write descriptive branch names

### API Best Practices (Browser)
- Use appropriate JavaScript client libraries via npm or CDN
- Consider using a bundler like Webpack/Rollup for dependency management
- Handle CORS appropriately for browser environment
- Use batch requests when possible
- Implement exponential backoff for retries
- Cache results in localStorage appropriately
- Monitor quota usage
- Handle partial failures gracefully

### Build & Development Tools
- Use npm scripts for common tasks (build, dev server, etc.)
- Consider live-reload dev server for development
- **Use ESLint with Airbnb configuration** (`eslint-config-airbnb-base` for vanilla JS)
- **Use Prettier for code formatting** (configured to work with Airbnb rules)
- Implement minification for production builds
- Use modern JavaScript with Babel if targeting older browsers
- **Recommended npm packages**:
  - `eslint-config-airbnb-base`
  - `eslint-plugin-import`
  - `prettier`
  - `eslint-config-prettier`

### Browser-Specific Considerations
- Use modern JavaScript features with appropriate polyfills if needed
- Implement proper error boundaries for UI
- Handle browser refresh/navigation gracefully
- Store authentication tokens securely in browser storage
- Implement proper logout/cleanup procedures

### Performance Considerations
- Minimize API calls through efficient filtering
- Implement pagination for large result sets
- Use streaming for processing large amounts of data
- Optimize UI rendering for large lists
- Implement lazy loading where appropriate
- Use debouncing for user input handling
- Monitor and optimize bundle size

### Accessibility (a11y)
- Ensure keyboard navigation support
- Use semantic HTML elements
- Provide proper ARIA labels and roles
- Maintain sufficient color contrast
- Support screen readers
- Test with accessibility tools

### User Experience
- Provide clear progress indicators
- Allow users to preview actions before execution
- Implement undo functionality where possible
- Provide detailed logs of actions taken
- Ensure responsive design for different screen sizes
- Handle offline scenarios gracefully
- Provide helpful error messages with actionable steps

### Code Quality & Maintenance
- Set up automated code quality checks (GitHub Actions, etc.)
- Use semantic versioning for releases
- Maintain a CHANGELOG.md file
- Regular dependency updates and security audits
- Code review requirements before merging
- Monitor application performance and errors

## Configuration Management
- Use environment variables for sensitive configuration
- Provide sensible defaults
- Allow user customization of application settings
- Support configuration profiles/presets

## Deployment & Distribution
- **Deployment**: Static web hosting (GitHub Pages, Netlify, etc.)
- Include clear setup instructions for API credentials
- Provide troubleshooting guide for browser compatibility
- Include system requirements (modern browser support)
- Consider PWA features for better user experience

## Common Patterns to Follow

### API Rate Limiting
```javascript
// Example pattern for handling rate limits
async function withRateLimit(apiCall) {
  try {
    return await apiCall();
  } catch (error) {
    if (error.code === 429) {
      await exponentialBackoff();
      return withRateLimit(apiCall);
    }
    throw error;
  }
}
```

### Filter Pattern
```javascript
// Example filter/processor interface
class DataProcessor {
  constructor(criteria) {
    this.criteria = criteria;
  }
  
  async process(data) {
    // Processing logic here
  }
  
  validate() {
    // Validation logic
  }
}
```

## Documentation Requirements

### README.md Structure
Every project must include a comprehensive README.md with:

1. **Project Title and Description**
   - Clear, concise project description
   - Purpose and key features
   - Target audience

2. **GitHub Badges/Shields**
   - Add relevant status badges at the top of README (after title/description)
   - Use [shields.io](https://shields.io/) for consistent styling
   - Common badges to include:
     ```markdown
     ![Build Status](https://img.shields.io/github/actions/workflow/status/username/repo/ci.yml)
     ![Coverage](https://img.shields.io/codecov/c/github/username/repo)
     ![npm version](https://img.shields.io/npm/v/package-name)
     ![npm downloads](https://img.shields.io/npm/dm/package-name)
     ![License](https://img.shields.io/github/license/username/repo)
     ![GitHub stars](https://img.shields.io/github/stars/username/repo)
     ![GitHub issues](https://img.shields.io/github/issues/username/repo)
     ![CDNJS version](https://img.shields.io/cdnjs/v/library-name)
     ![Node.js version](https://img.shields.io/node/v/package-name)
     ![Bundle size](https://img.shields.io/bundlephobia/minzip/package-name)
     ![Code style](https://img.shields.io/badge/code_style-airbnb-brightgreen)
     ![JavaScript](https://img.shields.io/badge/javascript-ES6+-yellow)
     ```

3. **Installation Instructions**
   - Prerequisites
   - Step-by-step setup
   - Environment configuration

4. **Usage Examples**
   - Basic usage
   - Common use cases
   - Code examples

5. **API Documentation**
   - Function signatures
   - Parameters and return values
   - Example usage

6. **Contributing Guidelines**
   - Code style requirements
   - Pull request process
   - Development setup

7. **License Information**
   - License type
   - Usage restrictions
   - Attribution requirements

### Additional Documentation
- Include JSDoc comments for all public methods
- Generate clear user instructions for end users (separate from developer docs)
- Document all configuration options
- Provide usage examples and code samples
- Include troubleshooting section
- Create installation and setup guides

## Prohibited Practices
- Never store passwords or sensitive credentials in plain text
- Don't ignore API errors or rate limits
- Avoid blocking the UI thread
- Don't perform destructive actions without user confirmation
- Never log sensitive user data or personal information
- Don't use `eval()` or similar unsafe functions
- Avoid inline styles and scripts (CSP violations)
- Don't commit secrets, API keys, or credentials to version control
- Avoid deep nesting (max 3-4 levels recommended)
- Don't use global variables unnecessarily

---

*This document should be updated as coding standards evolve. Always refer to this file when making architectural decisions or implementing new features across JavaScript projects.*
