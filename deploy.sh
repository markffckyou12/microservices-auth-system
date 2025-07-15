#!/bin/bash

# Microservices Authentication System Deployment Script
set -e

echo "🚀 Starting Microservices Authentication System Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Function to check if services are healthy
check_health() {
    print_status "Checking service health..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Health check attempt $attempt/$max_attempts"
        
        # Check if services are responding
        if curl -f http://localhost:3001/health > /dev/null 2>&1 && \
           curl -f http://localhost:3002/health > /dev/null 2>&1 && \
           curl -f http://localhost:3003/health > /dev/null 2>&1; then
            print_status "All services are healthy! ✅"
            return 0
        fi
        
        print_warning "Services not ready yet, waiting 10 seconds..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    print_error "Services failed to start within expected time"
    return 1
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    if docker-compose exec -T auth-service npm test && \
       docker-compose exec -T user-service npm test && \
       docker-compose exec -T session-service npm test; then
        print_status "All tests passed! ✅"
        return 0
    else
        print_error "Some tests failed"
        return 1
    fi
}

# Main deployment logic
case "${1:-dev}" in
    "dev")
        print_status "Starting development environment..."
        
        # Stop any existing containers
        print_status "Stopping existing containers..."
        docker-compose down 2>/dev/null || true
        
        # Build and start services
        print_status "Building and starting services..."
        docker-compose up -d --build
        
        # Wait for services to be ready
        check_health
        
        # Run tests
        run_tests
        
        print_status "Development environment is ready!"
        print_status "Services available at:"
        print_status "  - Auth Service: http://localhost:3001"
        print_status "  - User Service: http://localhost:3003"
        print_status "  - Session Service: http://localhost:3002"
        ;;
        
    "prod")
        print_status "Starting production environment..."
        
        # Check if .env file exists
        if [ ! -f .env ]; then
            print_error ".env file not found. Please create a .env file with production configuration."
            exit 1
        fi
        
        # Stop any existing containers
        print_status "Stopping existing containers..."
        docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
        
        # Build and start services
        print_status "Building and starting production services..."
        docker-compose -f docker-compose.prod.yml up -d --build
        
        # Wait for services to be ready
        check_health
        
        print_status "Production environment is ready!"
        print_status "Services available at:"
        print_status "  - Auth Service: http://localhost:3001"
        print_status "  - User Service: http://localhost:3003"
        print_status "  - Session Service: http://localhost:3002"
        print_status "  - Nginx Proxy: http://localhost:80"
        ;;
        
    "stop")
        print_status "Stopping all services..."
        docker-compose down
        docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
        print_status "All services stopped."
        ;;
        
    "logs")
        print_status "Showing service logs..."
        docker-compose logs -f
        ;;
        
    "clean")
        print_status "Cleaning up Docker resources..."
        docker-compose down -v
        docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
        docker system prune -f
        print_status "Cleanup completed."
        ;;
        
    "test")
        print_status "Running tests only..."
        run_tests
        ;;
        
    "health")
        print_status "Checking service health..."
        check_health
        ;;
        
    *)
        echo "Usage: $0 {dev|prod|stop|logs|clean|test|health}"
        echo ""
        echo "Commands:"
        echo "  dev     - Start development environment"
        echo "  prod    - Start production environment"
        echo "  stop    - Stop all services"
        echo "  logs    - Show service logs"
        echo "  clean   - Clean up Docker resources"
        echo "  test    - Run tests only"
        echo "  health  - Check service health"
        echo ""
        echo "Examples:"
        echo "  $0 dev     # Start development environment"
        echo "  $0 prod    # Start production environment"
        echo "  $0 stop    # Stop all services"
        exit 1
        ;;
esac 