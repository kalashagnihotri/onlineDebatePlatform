# Online Debate Platform

A full-stack web application for hosting real-time debates with user authentication, role-based permissions, and WebSocket-powered chat functionality.

## Project Structure

```
onlineDebatePlatform/
├── backend/                 # Django REST API
│   ├── manage.py           # Django management script
│   ├── requirements.txt    # Python dependencies
│   ├── core/              # Core app (permissions, utilities)
│   ├── debates/           # Debate management app
│   ├── users/             # User management app
│   ├── onlineDebatePlatform/  # Django settings & config
│   ├── templates/         # HTML templates
│   └── static/           # Static files (CSS, JS, images)
├── frontend/              # React TypeScript application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   ├── contexts/      # React contexts (Auth, etc.)
│   │   └── hooks/         # Custom React hooks
│   ├── package.json       # Node.js dependencies
│   └── tsconfig.json      # TypeScript configuration
├── .venv/                 # Python virtual environment
└── .gitignore            # Git ignore rules
```

## Features

### Backend (Django)
- **JWT Authentication**: Secure user registration and login
- **Role-Based Access**: Student and Moderator roles with permissions
- **Debate Management**: Create, join, and manage debate sessions
- **Real-Time Chat**: WebSocket-powered messaging system
- **Moderator Tools**: Mute, unmute, and remove participants
- **API Documentation**: Swagger/OpenAPI documentation
- **Rate Limiting**: Protection against API abuse

### Frontend (React)
- **Modern UI**: Material-UI components with dark theme
- **Authentication Flow**: Login/register with protected routes
- **Real-Time Updates**: WebSocket integration for live chat
- **Responsive Design**: Works on desktop and mobile
- **TypeScript**: Type-safe development

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Activate virtual environment**:
   ```bash
   # Windows
   .venv\Scripts\Activate.ps1
   
   # Linux/Mac
   source .venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Run migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Start the servers** (recommended - use separate terminals):

   **Terminal 1 - HTTP API Server:**
   ```bash
   # For network access (default)
   python manage.py startapi
   
   # For localhost only
   python manage.py startapi --localhost
   ```

   **Terminal 2 - WebSocket Server:**
   ```bash
   # For network access (default)
   python manage.py startws
   
   # For localhost only  
   python manage.py startws --localhost
   ```

   **Alternative - Helper command:**
   ```bash
   # Interactive helper to start one server at a time
   python manage.py startdev
   ```

The Django API will be available at `http://0.0.0.0:8000/` (network) or `http://127.0.0.1:8000/` (localhost)
The WebSocket server will be available at `ws://0.0.0.0:8001/` (network) or `ws://127.0.0.1:8001/` (localhost)
- API Documentation: `http://127.0.0.1:8000/swagger/`
- Admin Interface: `http://127.0.0.1:8000/admin/`

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

The React app will be available at `http://localhost:3000/`

## API Endpoints

### Authentication
- `POST /api/v1/token/` - Login
- `POST /api/v1/token/refresh/` - Refresh token
- `POST /api/v1/users/register/` - Register new user

### Debates
- `GET /api/v1/debates/topics/` - List debate topics
- `GET /api/v1/debates/sessions/` - List debate sessions
- `POST /api/v1/debates/sessions/{id}/join/` - Join debate
- `POST /api/v1/debates/sessions/{id}/leave/` - Leave debate
- `POST /api/v1/debates/messages/?session_pk={id}` - Post message

### Moderator Actions
- `POST /api/v1/debates/sessions/{id}/mute_participant/` - Mute user
- `POST /api/v1/debates/sessions/{id}/unmute_participant/` - Unmute user
- `POST /api/v1/debates/sessions/{id}/remove_participant/` - Remove user

## Development

### Backend Development
- The Django project uses SQLite for development
- Redis is required for WebSocket functionality
- Run `python manage.py createsuperuser` to create an admin user

### Frontend Development
- Built with React 18 and TypeScript
- Uses Material-UI for components
- WebSocket connection for real-time features
- Protected routes for authenticated users

## Deployment

### Backend
- Use PostgreSQL for production database
- Configure Redis for WebSocket backend
- Set `DEBUG=False` in production settings
- Use environment variables for sensitive data

### Frontend
- Build for production: `npm run build`
- Serve static files from Django or a CDN
- Configure environment variables for API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 