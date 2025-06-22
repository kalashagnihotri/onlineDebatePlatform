const { spawn } = require('child_process');
const os = require('os');

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
console.log('📱 Your app will be available at:');
console.log(`   Local: http://localhost:3000`);
console.log(`   Network: http://${localIP}:3000\n`);
console.log('💡 Make sure your phone is on the same WiFi network!\n');

// Set environment variables for network access
const env = { ...process.env };
env.HOST = '0.0.0.0';
env.PORT = '3000';

// Use the original react-scripts command
const isWindows = process.platform === 'win32';
const command = isWindows ? 'react-scripts.cmd' : 'react-scripts';
const args = ['start'];

const reactProcess = spawn(command, args, {
  stdio: 'inherit',
  env: env,
  shell: true
});

reactProcess.on('error', (error) => {
  console.error('Error starting React:', error.message);
  process.exit(1);
});

reactProcess.on('close', (code) => {
  process.exit(code);
}); 