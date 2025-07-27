#!/usr/bin/env node

/**
 * Smart server start script
 * Checks if server is already running on port 3000 before starting a new one
 */

const net = require('net');
const { spawn } = require('child_process');

const PORT = 3000;
const HOST = 'localhost';

function isPortInUse(port, host = 'localhost') {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(port, host, () => {
      server.close(() => {
        resolve(false); // Port is available
      });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        resolve(false); // Other error, assume port is available
      }
    });
  });
}

async function startServer() {
  // Check both localhost and all interfaces
  const localhostInUse = await isPortInUse(PORT, 'localhost');
  const allInterfacesInUse = await isPortInUse(PORT, '0.0.0.0');

  if (localhostInUse || allInterfacesInUse) {
    console.log(`📡 Server is already running on http://${HOST}:${PORT}`);
    console.log('   Visit the URL above to access the Gmail Purge application');
    console.log(
      '   Use Ctrl+C to stop this message, server will continue running'
    );

    // Optional: Open browser anyway if on Windows
    if (process.platform === 'win32') {
      try {
        const open = spawn('cmd', ['/c', 'start', `http://${HOST}:${PORT}`], {
          stdio: 'ignore',
          detached: true,
        });
        open.unref();
      } catch (err) {
        // Ignore errors opening browser
      }
    }

    // Exit cleanly - server is already running
    process.exit(0);
  } else {
    console.log(`🚀 Starting server on http://${HOST}:${PORT}...`);

    // Use npm run to execute the dev command which has http-server configured properly
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
    });

    // Handle server process
    server.on('error', (err) => {
      console.error('❌ Failed to start server:', err.message);
      process.exit(1);
    });

    server.on('close', (code) => {
      if (code !== 0) {
        console.log(`⚠️  Server process exited with code ${code}`);
      }
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      server.kill('SIGINT');
      process.exit(0);
    });
  }
}

// Run the script
startServer().catch((err) => {
  console.error('❌ Error starting server:', err);
  process.exit(1);
});
