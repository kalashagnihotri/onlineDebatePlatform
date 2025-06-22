# Online Debate Platform - Backend

This is the Django REST API backend for the Online Debate Platform.

## Features

- **JWT Authentication**: Secure user registration and login
- **Role-Based Access**: Student and Moderator roles with permissions
- **Debate Management**: Create, join, and manage debate sessions
- **Real-Time Chat**: WebSocket-powered messaging system
- **Moderator Tools**: Mute, unmute, and remove participants
- **API Documentation**: Swagger/OpenAPI documentation
- **Rate Limiting**: Protection against API abuse

## Quick Start

### Prerequisites
- Python 3.8+
- Redis (for WebSocket functionality)

### Setup

1. **Activate virtual environment**:
   ```bash
   # Windows
   ..\.venv\Scripts\Activate.ps1
   
   # Linux/Mac
   source ../.venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Create superuser** (optional):
   ```bash
   python manage.py createsuperuser
   ```

5. **Start the HTTP server**:
   ```bash
   python manage.py runserver 8000
   ```

6. **Start the WebSocket server** (in a new terminal):
   ```bash
   # Windows
   daphne -p 8001 onlineDebatePlatform.asgi:application
   
   # Or use the batch file
   ..\start-websocket.bat
   ```

**Server URLs:**
- HTTP API: `http://127.0.0.1:8000/`
- WebSocket: `ws://127.0.0.1:8001/`
- API Documentation: `http://127.0.0.1:8000/swagger/`
- Admin Interface: `http://127.0.0.1:8000/admin/`

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

- **Database**: SQLite for development, PostgreSQL for production
- **WebSocket**: Redis backend for real-time features
- **Documentation**: Available at `/swagger/` and `/redoc/`
- **Admin Interface**: Available at `/admin/`

## Project Structure

```
backend/
├── manage.py              # Django management script
├── requirements.txt       # Python dependencies
├── core/                 # Core app (permissions, utilities)
├── debates/              # Debate management app
├── users/                # User management app
├── onlineDebatePlatform/ # Django settings & configuration
├── templates/            # HTML templates
└── static/              # Static files (CSS, JS, images)
```

## Documentation
- **features.md**: Detailed list of features and their significance.
- **API Documentation**: Auto-generated Swagger/OpenAPI schema.

## License
This project is licensed under the MIT License - see the LICENSE file for details.