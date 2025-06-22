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

console.log('🚀 Starting Online Debate Platform...\n');

// Start Django backend
console.log('📡 Starting Django backend...');
const djangoProcess = spawn('python', ['manage.py', 'runserver', '0.0.0.0:8000'], {
  cwd: '../backend',
  stdio: 'pipe'
});

djangoProcess.stdout.on('data', (data) => {
  console.log(`[Django] ${data.toString().trim()}`);
});

djangoProcess.stderr.on('data', (data) => {
  console.log(`[Django Error] ${data.toString().trim()}`);
});

// Start React frontend
console.log('⚛️  Starting React frontend...');
const reactProcess = spawn('npm', ['start'], {
  cwd: '.',
  stdio: 'pipe',
  env: { ...process.env, HOST: '0.0.0.0' }
});

reactProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[React] ${output.trim()}`);
  
  // Check if React is ready and show network URLs
  if (output.includes('Local:')) {
    setTimeout(() => {
      console.log('\n' + '='.repeat(60));
      console.log('🌐 NETWORK ACCESS URLs:');
      console.log('='.repeat(60));
      console.log(`📱 Frontend (Mobile): http://${localIP}:3000`);
      console.log(`🔧 Backend API: http://${localIP}:8000`);
      console.log(`📊 Django Admin: http://${localIP}:8000/admin`);
      console.log('='.repeat(60));
      console.log('💡 Make sure your phone is on the same WiFi network!');
      console.log('='.repeat(60) + '\n');
    }, 2000);
  }
});

reactProcess.stderr.on('data', (data) => {
  console.log(`[React Error] ${data.toString().trim()}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping servers...');
  djangoProcess.kill();
  reactProcess.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping servers...');
  djangoProcess.kill();
  reactProcess.kill();
  process.exit();
}); 