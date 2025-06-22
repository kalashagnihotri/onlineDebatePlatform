import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import DebatesPage from './pages/DebatesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DebateDetailPage from './pages/DebateDetailPage';
import ModeratorDashboard from './pages/ModeratorDashboard';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ModeratorRoute from './components/ModeratorRoute';
import Navbar from './components/Navbar';
import { ScrollToTopButton } from './components/FloatingActionButton';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <AuthProvider>
          <Router>
            <Navbar />            <main className="container mx-auto px-4 py-8 max-w-7xl">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/debates" element={<DebatesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/debates/:id" element={<DebateDetailPage />} />
                </Route>
                
                {/* Moderator-only routes */}
                <Route element={<ModeratorRoute />}>
                  <Route path="/moderator" element={<ModeratorDashboard />} />
                </Route>
                
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <ScrollToTopButton />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                },
                className: 'dark:bg-gray-800 dark:text-white',
              }}
            />
          </Router>
        </AuthProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;