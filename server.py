#!/usr/bin/env python3
"""
Simple HTTP server with proper headers for OAuth authentication
Fixes Cross-Origin-Opener-Policy issues with Google Identity Services
"""

import http.server
import socketserver
import os
from urllib.parse import urlparse

class OAuthHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP request handler with OAuth-friendly headers"""
    
    def end_headers(self):
        """Add custom headers before ending response headers"""
        # Remove restrictive COOP policy for OAuth compatibility
        self.send_header('Cross-Origin-Opener-Policy', 'unsafe-none')
        
        # Allow cross-origin requests for Google APIs
        self.send_header('Cross-Origin-Embedder-Policy', 'unsafe-none')
        
        # Security headers that don't interfere with OAuth
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        
        # Cache control for development
        if self.path.endswith(('.js', '.css')):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        
        super().end_headers()
    
    def do_GET(self):
        """Handle GET requests with proper MIME types"""
        # Ensure proper MIME types
        if self.path.endswith('.js'):
            self.send_response(200)
            self.send_header('Content-type', 'application/javascript')
            self.end_headers()
            
            with open(self.path[1:], 'rb') as f:
                self.wfile.write(f.read())
        else:
            super().do_GET()

def run_server(port=3000):
    """Run the development server with OAuth-friendly configuration"""
    
    # Change to the directory containing the HTML files
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", port), OAuthHTTPRequestHandler) as httpd:
        print(f"🚀 Gmail Purge server running at http://localhost:{port}")
        print("📧 OAuth-optimized server - COOP errors should be resolved")
        print("🔧 Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n✅ Server stopped")
            httpd.shutdown()

if __name__ == "__main__":
    run_server()
