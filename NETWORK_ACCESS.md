# 🌐 Network Access Guide

## 📱 Access Your App from Mobile Devices

### Quick Start
```bash
# Start the frontend (shows network URLs automatically)
cd frontend
npm start

# Start the backend (in another terminal)
cd backend
python manage.py runserver 0.0.0.0:8000
```

### What You'll See
When you run `npm start`, you'll see:
```
🚀 Starting React with network access...

📱 Your app will be available at:
   Local: http://localhost:3000
   Network: http://192.168.1.1:3000

💡 Make sure your phone is on the same WiFi network!
```

### 📱 Access from Your Phone
1. Make sure your phone is connected to the same WiFi network as your computer
2. Open your phone's browser
3. Go to the Network URL shown in the terminal (e.g., `http://192.168.1.1:3000`)

### 🔧 Available Commands
- `npm start` - Start React with network access
- `npm run start:original` - Start React (localhost only)
- `npm run start:network` - Start both Django + React
- `start-dev.bat` - Windows batch file for both servers

### 🚨 Troubleshooting
- **Can't access from phone?** Check Windows Firewall settings
- **Wrong IP address?** Run `ipconfig` to get your current IP
- **Port already in use?** Kill existing processes or change ports

### 🔒 Security Note
This configuration is for development only. Never expose development servers to the internet! 