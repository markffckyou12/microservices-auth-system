#!/bin/bash

# =============================================================================
# User Management System - Setup Script
# =============================================================================

set -e  # Exit on any error

echo "🚀 Setting up User Management System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a Codespace
if [ -n "$CODESPACES" ]; then
    print_status "Running in GitHub Codespaces"
else
    print_status "Running in local environment"
fi

# Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

# Check npm version
print_status "Checking npm version..."
NPM_VERSION=$(npm --version)
print_success "npm version: $NPM_VERSION"

# Fix permissions if needed
print_status "Checking and fixing permissions..."
if [ ! -w "services/auth-service/node_modules" ] 2>/dev/null; then
    print_warning "Permission issues detected, attempting to fix..."
    if command -v sudo &> /dev/null; then
        sudo chown -R node:node /workspaces/microservices-auth-system 2>/dev/null || true
        sudo mkdir -p services/auth-service/node_modules services/user-service/node_modules services/session-service/node_modules frontend/node_modules shared/node_modules 2>/dev/null || true
        sudo chown -R node:node services/*/node_modules frontend/node_modules shared/node_modules 2>/dev/null || true
    fi
fi

# Install dependencies
print_status "Installing dependencies..."
npm run install:all
print_success "Dependencies installed successfully"

# Set up environment
print_status "Setting up environment..."
if [ ! -f .env ]; then
    cp env.example .env
    print_success "Environment file created from template"
else
    print_warning "Environment file already exists, skipping..."
fi

# Build shared package
print_status "Building shared package..."
npm run build:shared
print_success "Shared package built successfully"

# Check if Docker is available
if command -v docker &> /dev/null; then
    print_status "Docker is available, starting services..."
    
    # Start Docker services
    npm run docker:up
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Run migrations
    print_status "Running database migrations..."
    npm run migrate:all
    print_success "Migrations completed successfully"
    
    # Seed database (optional)
    read -p "Do you want to seed the database with sample data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Seeding database..."
        npm run seed:all
        print_success "Database seeded successfully"
    fi
    
    print_success "Docker services started successfully"
else
    print_warning "Docker not available, skipping Docker setup"
    print_status "You can start services manually with: npm run dev"
fi

# Run tests to verify setup
print_status "Running tests to verify setup..."
if npm test > /dev/null 2>&1; then
    print_success "Tests passed successfully"
else
    print_warning "Some tests failed, but setup is complete"
fi

# Display next steps
echo
echo "🎉 Setup completed successfully!"
echo
echo "Next steps:"
echo "1. Start development servers: npm run dev"
echo "2. Access the application: http://localhost:3000"
echo "3. Run tests: npm test"
echo "4. Check documentation: README.md"
echo
echo "Useful commands:"
echo "- npm run dev          # Start all services"
echo "- npm test            # Run all tests"
echo "- npm run docker:logs # View service logs"
echo "- npm run lint        # Check code quality"
echo
echo "Happy coding! 🚀" 