# Online Debate Platform - Frontend

This is the React TypeScript frontend for the Online Debate Platform.

## Features

- **Modern UI**: Built with Material-UI components
- **TypeScript**: Full type safety and better development experience
- **Authentication**: JWT-based login and registration
- **Protected Routes**: Role-based access control
- **Real-Time Chat**: WebSocket integration for live debates
- **Responsive Design**: Works on desktop and mobile devices
- **State Management**: React Context for authentication state

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Navbar.tsx     # Navigation component
│   │   └── ProtectedRoute.tsx # Route protection
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx # Authentication state
│   ├── hooks/             # Custom React hooks
│   │   └── useWebSocket.ts # WebSocket hook
│   ├── pages/             # Page components
│   │   ├── HomePage.tsx   # Debate topics list
│   │   ├── LoginPage.tsx  # User login
│   │   ├── RegisterPage.tsx # User registration
│   │   └── DebateDetailPage.tsx # Debate session
│   ├── services/          # API services
│   │   ├── api.ts         # Base API configuration
│   │   ├── authService.ts # Authentication API
│   │   └── debateService.ts # Debate API
│   ├── App.tsx            # Main app component
│   └── index.tsx          # App entry point
├── package.json           # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Available Scripts

- `npm start` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App

## Key Components

### Authentication
- **LoginPage**: User login with email/password
- **RegisterPage**: New user registration
- **AuthContext**: Global authentication state management

### Debate Management
- **HomePage**: List of available debate topics
- **DebateDetailPage**: Live debate session with real-time messaging
- **ProtectedRoute**: Route protection based on authentication status

### Navigation
- **Navbar**: Main navigation with login/logout functionality

## API Integration

The frontend communicates with the Django backend through:
- **REST API**: For authentication and debate management
- **WebSocket**: For real-time messaging during debates

## Development

- **Port**: Runs on http://localhost:3000
- **Hot Reload**: Automatic refresh on file changes
- **TypeScript**: Compile-time type checking
- **ESLint**: Code linting and formatting
