/**
 * Pop-up Helper for OAuth Authentication
 * Provides user-friendly guidance for enabling pop-ups
 */

class PopupHelper {
  /**
   * Show popup guidance notification
   */
  static showPopupGuidance() {
    // Remove existing notification if present
    const existingNotification = document.getElementById('popup-guidance');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'popup-guidance';
    notification.className = 'popup-notification';
    notification.innerHTML = `
      <div class="popup-notification-content">
        <div class="popup-notification-header">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Pop-ups Required for Gmail Authentication</h3>
          <button class="popup-notification-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="popup-notification-body">
          <p><strong>Pop-ups are currently blocked.</strong> Gmail authentication requires pop-ups to work properly.</p>
          <div class="popup-guidance-steps">
            <h4>To enable pop-ups:</h4>
            <ol>
              <li>Look for a popup blocker icon in your browser's address bar (usually shows as 🚫 or a popup icon)</li>
              <li>Click the icon and select "Always allow pop-ups from localhost:3000"</li>
              <li>Refresh this page and try signing in again</li>
            </ol>
          </div>
          <div class="popup-guidance-browsers">
            <h4>Browser-specific instructions:</h4>
            <ul>
              <li><strong>Chrome:</strong> Click the popup blocked icon in the address bar</li>
              <li><strong>Firefox:</strong> Click the shield icon or popup notification</li>
              <li><strong>Safari:</strong> Go to Safari → Preferences → Websites → Pop-up Windows</li>
              <li><strong>Edge:</strong> Click the popup blocked notification in the address bar</li>
            </ul>
          </div>
        </div>
        <div class="popup-notification-actions">
          <button class="btn btn-primary" onclick="location.reload()">Refresh Page</button>
          <button class="btn btn-secondary" onclick="PopupHelper.testPopups()">Test Pop-ups</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .popup-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        background: #fff;
        border: 2px solid #ff6b6b;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: Inter, sans-serif;
      }
      
      .popup-notification-header {
        background: #ff6b6b;
        color: white;
        padding: 12px 16px;
        border-radius: 6px 6px 0 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .popup-notification-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        flex: 1;
      }
      
      .popup-notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .popup-notification-body {
        padding: 16px;
        font-size: 13px;
        line-height: 1.4;
      }
      
      .popup-guidance-steps {
        margin: 12px 0;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 4px;
      }
      
      .popup-guidance-steps h4 {
        margin: 0 0 8px 0;
        font-size: 13px;
        color: #495057;
      }
      
      .popup-guidance-steps ol {
        margin: 0;
        padding-left: 16px;
      }
      
      .popup-guidance-browsers {
        margin: 12px 0;
      }
      
      .popup-guidance-browsers h4 {
        margin: 0 0 8px 0;
        font-size: 13px;
        color: #495057;
      }
      
      .popup-guidance-browsers ul {
        margin: 0;
        padding-left: 16px;
      }
      
      .popup-notification-actions {
        padding: 12px 16px;
        border-top: 1px solid #dee2e6;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      
      .popup-notification .btn {
        padding: 6px 12px;
        border-radius: 4px;
        border: none;
        font-size: 12px;
        cursor: pointer;
        font-weight: 500;
      }
      
      .popup-notification .btn-primary {
        background: #007bff;
        color: white;
      }
      
      .popup-notification .btn-secondary {
        background: #6c757d;
        color: white;
      }
      
      .popup-notification .btn:hover {
        opacity: 0.9;
      }
    `;

    // Add to document
    if (!document.getElementById('popup-helper-styles')) {
      style.id = 'popup-helper-styles';
      document.head.appendChild(style);
    }
    document.body.appendChild(notification);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 30000);
  }

  /**
   * Test if pop-ups are working
   */
  static testPopups() {
    try {
      const popup = window.open('', '_blank', 'width=300,height=200');
      if (popup) {
        popup.document.write(`
          <html>
            <head><title>Pop-up Test</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
              <h2>✅ Pop-ups Working!</h2>
              <p>Pop-ups are now enabled. You can close this window and try signing in to Gmail.</p>
              <button onclick="window.close()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            </body>
          </html>
        `);
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          if (popup && !popup.closed) {
            popup.close();
          }
        }, 3000);
        
        // Remove the notification
        const notification = document.getElementById('popup-guidance');
        if (notification) {
          notification.remove();
        }
      } else {
        alert('Pop-ups are still blocked. Please check your browser settings.');
      }
    } catch (e) {
      alert('Pop-up test failed: ' + e.message);
    }
  }

  /**
   * Check if pop-ups are blocked and show guidance if needed
   */
  static checkAndGuide() {
    try {
      const popup = window.open('', '_blank', 'width=1,height=1');
      if (popup) {
        popup.close();
        return true; // Pop-ups are allowed
      } else {
        PopupHelper.showPopupGuidance();
        return false; // Pop-ups are blocked
      }
    } catch (e) {
      PopupHelper.showPopupGuidance();
      return false;
    }
  }
}

// Make it globally available
if (typeof window !== 'undefined') {
  window.PopupHelper = PopupHelper;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PopupHelper;
}
