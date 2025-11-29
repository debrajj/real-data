const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Building React app...');

// Build React app
const buildProcess = exec('cd client && npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Build failed:', error);
    return;
  }
  console.log('✅ React app built successfully');
  
  // Start server
  console.log('🚀 Starting server on port 3000...');
  require('./server.js');
});

buildProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

buildProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});
