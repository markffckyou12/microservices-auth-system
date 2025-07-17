#!/bin/bash

# =============================================================================
# Fix Permissions Script for GitHub Codespaces
# =============================================================================

echo "🔧 Fixing permissions for GitHub Codespaces..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if we're running as root
if [ "$EUID" -eq 0 ]; then
    print_status "Running as root, fixing permissions..."
    
    # Fix ownership of workspace
    chown -R node:node /workspaces/microservices-auth-system
    
    # Create node_modules directories with proper permissions
    mkdir -p /workspaces/microservices-auth-system/services/auth-service/node_modules
    mkdir -p /workspaces/microservices-auth-system/services/user-service/node_modules
    mkdir -p /workspaces/microservices-auth-system/services/session-service/node_modules
    mkdir -p /workspaces/microservices-auth-system/frontend/node_modules
    mkdir -p /workspaces/microservices-auth-system/shared/node_modules
    
    # Set proper permissions
    chown -R node:node /workspaces/microservices-auth-system/services/auth-service/node_modules
    chown -R node:node /workspaces/microservices-auth-system/services/user-service/node_modules
    chown -R node:node /workspaces/microservices-auth-system/services/session-service/node_modules
    chown -R node:node /workspaces/microservices-auth-system/frontend/node_modules
    chown -R node:node /workspaces/microservices-auth-system/shared/node_modules
    
    print_success "Permissions fixed! You can now run: npm run install:all"
    
else
    print_status "Not running as root, trying alternative approach..."
    
    # Try to fix permissions using sudo if available
    if command -v sudo &> /dev/null; then
        print_status "Using sudo to fix permissions..."
        sudo chown -R node:node /workspaces/microservices-auth-system
        
        sudo mkdir -p /workspaces/microservices-auth-system/services/auth-service/node_modules
        sudo mkdir -p /workspaces/microservices-auth-system/services/user-service/node_modules
        sudo mkdir -p /workspaces/microservices-auth-system/services/session-service/node_modules
        sudo mkdir -p /workspaces/microservices-auth-system/frontend/node_modules
        sudo mkdir -p /workspaces/microservices-auth-system/shared/node_modules
        
        sudo chown -R node:node /workspaces/microservices-auth-system/services/auth-service/node_modules
        sudo chown -R node:node /workspaces/microservices-auth-system/services/user-service/node_modules
        sudo chown -R node:node /workspaces/microservices-auth-system/services/session-service/node_modules
        sudo chown -R node:node /workspaces/microservices-auth-system/frontend/node_modules
        sudo chown -R node:node /workspaces/microservices-auth-system/shared/node_modules
        
        print_success "Permissions fixed! You can now run: npm run install:all"
    else
        echo "❌ Cannot fix permissions automatically. Please try:"
        echo "1. Restart the Codespace"
        echo "2. Or run the setup script with: ./scripts/setup.sh"
    fi
fi 