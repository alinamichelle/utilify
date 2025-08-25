#!/bin/bash

set -e

echo "🚀 Utilify Bootstrap Script"
echo "=========================="

# Check Ruby version
if command -v ruby >/dev/null 2>&1; then
    RUBY_VERSION=$(ruby -v | awk '{print $2}')
    echo "✓ Ruby detected: $RUBY_VERSION"
else
    echo "✗ Ruby not found. Please install Ruby 3.2+"
    exit 1
fi

# Check Node version
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    echo "✓ Node detected: $NODE_VERSION"
else
    echo "✗ Node not found. Please install Node.js 18+"
    exit 1
fi

# Check PostgreSQL
if command -v psql >/dev/null 2>&1; then
    echo "✓ PostgreSQL detected"
else
    echo "⚠ PostgreSQL not found. Please install PostgreSQL for the backend"
fi

echo ""
echo "Setting up Backend..."
echo "--------------------"

# Install Rails if not present
if ! command -v rails >/dev/null 2>&1; then
    echo "Installing Rails..."
    gem install rails
fi

# Set up backend
cd backend

# Check if it's already a Rails app
if [ ! -f "Gemfile" ]; then
    echo "Initializing Rails API..."
    rails new . --api -T -d postgresql --skip-git
fi

# Bundle install
echo "Installing backend dependencies..."
bundle install

# Copy env file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✓ Created backend/.env from template"
    fi
fi

# Setup database
echo "Setting up database..."
bin/rails db:create 2>/dev/null || true
bin/rails db:migrate 2>/dev/null || true

cd ..

echo ""
echo "Setting up Frontend..."
echo "---------------------"

cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "Initializing Next.js app..."
    npx create-next-app@latest . --ts --eslint --app --src-dir --import-alias "@/*" --tailwind --no-git
fi

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Copy env file if it doesn't exist
if [ ! -f ".env.local" ]; then
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        echo "✓ Created frontend/.env.local from template"
    fi
fi

cd ..

# Install foreman if not present
if ! command -v foreman >/dev/null 2>&1; then
    echo ""
    echo "Installing foreman for process management..."
    gem install foreman
fi

echo ""
echo "✅ Bootstrap complete!"
echo ""
echo "To start the development servers, run:"
echo "  make dev"
echo ""
echo "Or start them individually:"
echo "  make backend   # Rails on http://localhost:4000"
echo "  make frontend  # Next.js on http://localhost:3000"