# 🚀 GitHub Codespaces Setup Guide

This guide will help you set up and run the User Management System in GitHub Codespaces.

## 📋 Prerequisites

- GitHub account
- Access to this repository
- Basic knowledge of terminal commands

## 🎯 Quick Start

### Step 1: Open in Codespaces

1. Navigate to the repository on GitHub
2. Click the green **"Code"** button
3. Select **"Open with Codespaces"**
4. Choose **"Create codespace on main"**

### Step 2: Wait for Setup

The devcontainer will automatically:
- ✅ Install Node.js 18 and all necessary tools
- ✅ Set up PostgreSQL and Redis databases
- ✅ Install VS Code extensions
- ✅ Configure the development environment
- ✅ Forward all necessary ports

**Setup time**: 3-5 minutes

### Step 3: Verify Setup

Once setup is complete, you should see:
- ✅ Terminal with Node.js 18 available
- ✅ PostgreSQL running on port 5432
- ✅ Redis running on port 6379
- ✅ All VS Code extensions installed

## 🛠️ Manual Setup (if needed)

If automatic setup doesn't work, follow these steps:

### 1. Install Dependencies

```bash
# Install all dependencies
npm run install:all
```

### 2. Set Up Environment

```bash
# Copy environment file
cp env.example .env

# Edit environment variables if needed
nano .env
```

### 3. Start Services

```bash
# Start all services
npm run dev
```

### 4. Run Migrations

```bash
# Run database migrations
npm run migrate:all
```

### 5. Seed Database (Optional)

```bash
# Seed with sample data
npm run seed:all
```

## 🌐 Accessing Services

Once everything is running, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React application |
| Auth Service | http://localhost:3001 | Authentication API |
| User Service | http://localhost:3002 | User management API |
| Session Service | http://localhost:3003 | Session management API |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |

## 🧪 Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
# Services only
npm run test:services

# Frontend only
npm run test:frontend

# With coverage
npm run test:coverage
```

### Performance Tests
```bash
cd frontend
npm run test:performance
```

### E2E Tests (Playwright)
```bash
cd frontend
npm run test:e2e
```

## 🔧 Development Commands

### Start Development Servers
```bash
# All services
npm run dev

# Individual services
npm run dev:auth      # Auth service only
npm run dev:user      # User service only
npm run dev:session   # Session service only
npm run dev:frontend  # Frontend only
```

### Database Operations
```bash
# Run migrations
npm run migrate:all

# Seed database
npm run seed:all

# Reset database
npm run docker:down && npm run docker:up
```

### Code Quality
```bash
# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Security audit
npm run security:audit
```

## 🐳 Docker Commands

### Development Environment
```bash
# Start services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Rebuild containers
npm run docker:build
```

## 📊 Monitoring

### Health Checks
```bash
# Check service health
curl http://localhost:3001/health  # Auth service
curl http://localhost:3002/health  # User service
curl http://localhost:3003/health  # Session service
```

### View Logs
```bash
# All services
npm run docker:logs

# Specific service
docker-compose logs -f auth-service
docker-compose logs -f user-service
docker-compose logs -f session-service
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### 2. Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres
```

#### 3. Node Modules Issues
```bash
# Clean and reinstall
npm run clean:node_modules
npm run install:all
```

#### 4. Build Issues
```bash
# Clean build artifacts
npm run clean:dist
npm run build:all
```

### Reset Everything
```bash
# Stop all services
npm run docker:down

# Clean everything
npm run clean

# Reinstall dependencies
npm run install:all

# Start fresh
npm run docker:up
npm run migrate:all
npm run seed:all
```

## 🎯 Development Workflow

### 1. Daily Development
```bash
# Start your day
npm run dev

# Make changes to code
# Tests run automatically on save

# Check code quality
npm run lint
npm run format:check
```

### 2. Testing Changes
```bash
# Run tests
npm test

# Check coverage
npm run test:coverage

# Run specific tests
npm run test:frontend
```

### 3. Database Changes
```bash
# Create new migration
cd services/user-service
npm run migrate:create -- --name add_new_table

# Run migrations
npm run migrate:all
```

### 4. API Testing
```bash
# Test endpoints
curl -X GET http://localhost:3002/api/v1/user-management
curl -X POST http://localhost:3002/api/v1/user-management \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com"}'
```

## 📚 Useful VS Code Extensions

The devcontainer automatically installs:
- TypeScript and JavaScript support
- React development tools
- Docker integration
- Testing frameworks
- Code formatting and linting
- Git integration

## 🔐 Security Notes

- Environment variables are automatically configured for development
- JWT secrets are set to development values
- Database passwords are simplified for development
- **Never commit real secrets to the repository**

## 📞 Getting Help

If you encounter issues:

1. Check the [Issues](https://github.com/yourusername/user-management-system/issues) page
2. Review the documentation in the `memory-bank/` directory
3. Check the logs: `npm run docker:logs`
4. Create a new issue with detailed information

## 🎉 You're Ready!

Once setup is complete, you can:
- ✅ Develop the application
- ✅ Run tests
- ✅ Debug issues
- ✅ Deploy changes
- ✅ Collaborate with others

Happy coding! 🚀 