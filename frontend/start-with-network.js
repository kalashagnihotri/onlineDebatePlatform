const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

console.log('🚀 Starting React with network access...\n');

// Use the Windows .cmd version of react-scripts
const reactScriptsPath = path.join(__dirname, 'node_modules', '.bin', 'react-scripts.cmd');

// Start React with network access
const reactProcess = spawn(reactScriptsPath, ['start'], {
  stdio: 'pipe',
  env: { 
    ...process.env, 
    HOST: '0.0.0.0',
    PORT: '3000'
  }
});

let networkInfoShown = false;

reactProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  
  // Show network URLs when React is ready
  if (!networkInfoShown && (output.includes('Local:') || output.includes('On Your Network:'))) {
    setTimeout(() => {
      console.log('\n' + '='.repeat(60));
      console.log('🌐 NETWORK ACCESS URLs:');
      console.log('='.repeat(60));
      console.log(`📱 Frontend (Mobile): http://${localIP}:3000`);
      console.log(`🔧 Backend API: http://${localIP}:8000`);
      console.log(`📊 Django Admin: http://${localIP}:8000/admin`);
      console.log('='.repeat(60));
      console.log('💡 Make sure your phone is on the same WiFi network!');
      console.log('💡 Start Django backend with: cd ../backend && python manage.py runserver 0.0.0.0:8000');
      console.log('='.repeat(60) + '\n');
      networkInfoShown = true;
    }, 1000);
  }
});

reactProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle process termination
process.on('SIGINT', () => {
  reactProcess.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  reactProcess.kill();
  process.exit();
}); 