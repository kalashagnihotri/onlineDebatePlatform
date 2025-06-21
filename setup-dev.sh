#!/bin/bash

# Online Debate Platform - Development Setup Script
# This script sets up the development environment for both backend and frontend

echo "🚀 Setting up Online Debate Platform development environment..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Python and Node.js are installed"

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Run backend migrations
echo "🗄️ Setting up database..."
cd backend
python manage.py makemigrations
python manage.py migrate
cd ..

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Activate virtual environment: source .venv/bin/activate (Linux/Mac) or .venv\\Scripts\\Activate.ps1 (Windows)"
echo "2. Start backend: cd backend && python manage.py runserver"
echo "3. Start frontend: cd frontend && npm start"
echo ""
echo "🌐 Backend will be available at: http://localhost:8000"
echo "🌐 Frontend will be available at: http://localhost:3000" 