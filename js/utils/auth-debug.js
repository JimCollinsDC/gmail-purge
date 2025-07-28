/**
 * Gmail Auth Debug Helper
 * Helps diagnose common authentication issues
 */

class AuthDebugHelper {
  /**
   * Check common authentication issues
   */
  static diagnoseAuthIssues() {
    const issues = [];
    const currentOrigin = window.location.origin;
    
    console.group('🔍 Gmail Auth Diagnostic Check');
    
    // Check 1: Current origin
    console.log('✅ Current Origin:', currentOrigin);
    
    // Check 2: Google API availability
    if (typeof gapi === 'undefined') {
      issues.push('❌ Google API (gapi) not loaded');
    } else {
      console.log('✅ Google API loaded');
    }
    
    // Check 3: Pop-up blocker
    try {
      const popup = window.open('', '_blank', 'width=1,height=1');
      if (popup) {
        popup.close();
        console.log('✅ Pop-ups are allowed');
      } else {
        issues.push('❌ Pop-ups are blocked - CRITICAL for OAuth');
        console.log('❌ Pop-ups are blocked - This will prevent OAuth from working');
        console.log('   To fix: Click the popup blocker icon in your address bar and allow popups');
      }
    } catch (e) {
      issues.push('❌ Pop-up test failed - CRITICAL for OAuth');
      console.log('❌ Pop-up test failed:', e.message);
    }
    
    // Check 4: Third-party cookies
    const cookiesEnabled = navigator.cookieEnabled;
    if (cookiesEnabled) {
      console.log('✅ Cookies are enabled');
    } else {
      issues.push('❌ Cookies are disabled');
    }
    
    // Check 5: HTTPS/Localhost
    const isSecureContext = window.isSecureContext || 
                           currentOrigin.startsWith('https://') || 
                           currentOrigin.startsWith('http://localhost');
    if (isSecureContext) {
      console.log('✅ Secure context (HTTPS or localhost)');
    } else {
      issues.push('❌ Insecure context - HTTPS required for production');
    }
    
    // Check 6: CSP headers
    const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    if (metaTags.length > 0) {
      console.log('✅ Content Security Policy found');
      metaTags.forEach((tag, index) => {
        console.log(`   CSP ${index + 1}:`, tag.getAttribute('content'));
      });
    } else {
      console.log('⚠️ No Content Security Policy found (may cause iframe issues)');
    }
    
    // Summary
    if (issues.length === 0) {
      console.log('🎉 No obvious issues found');
    } else {
      console.log('⚠️ Issues found:');
      issues.forEach(issue => console.log('  ', issue));
    }
    
    // Recommendations
    console.log('\n💡 Common solutions for idpiframe_initialization_failed:');
    console.log('1. 🔧 Add your domain to Google Console OAuth origins:');
    console.log('   • Go to https://console.cloud.google.com/apis/credentials');
    console.log('   • Find your OAuth 2.0 Client ID');
    console.log('   • Add http://localhost:3000 to "Authorized JavaScript origins"');
    console.log('   • Add http://localhost:3000 to "Authorized redirect URIs" (if needed)');
    console.log('2. 🔒 Ensure Content Security Policy allows Google domains (updated)');
    console.log('3. 🚫 Enable pop-ups for this site (check browser address bar)');
    console.log('4. 🍪 Enable third-party cookies in browser settings');
    console.log('5. 🔐 Use HTTPS in production');
    console.log('\n⚠️ Most common cause: Missing localhost:3000 in Google Console origins!');
    
    console.groupEnd();
    
    return issues;
  }
  
  /**
   * Show auth configuration details
   */
  static showAuthConfig() {
    if (typeof APP_CONFIG !== 'undefined') {
      console.group('🔧 Authentication Configuration');
      console.log('Client ID:', APP_CONFIG.GOOGLE_CLIENT_ID);
      console.log('Scopes:', APP_CONFIG.GMAIL_SCOPES);
      console.log('Discovery Docs:', APP_CONFIG.DISCOVERY_DOCS);
      console.groupEnd();
    }
  }
  
  /**
   * Test iframe creation
   */
  static testIframeCreation() {
    console.group('🖼️ Iframe Test');
    try {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://accounts.google.com/gsi/iframe';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
          console.log('✅ Iframe creation and cleanup successful');
        }
      }, 1000);
      
      console.log('✅ Iframe created successfully');
    } catch (error) {
      console.log('❌ Iframe creation failed:', error.message);
    }
    console.groupEnd();
  }
}

// Make it globally available
if (typeof window !== 'undefined') {
  window.AuthDebugHelper = AuthDebugHelper;
}

// Auto-run diagnostics in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Run diagnostics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      AuthDebugHelper.diagnoseAuthIssues();
      AuthDebugHelper.showAuthConfig();
    }, 1000);
  });
}
