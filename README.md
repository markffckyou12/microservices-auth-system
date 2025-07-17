# User Management System

A comprehensive user management system built with microservices architecture, featuring advanced user management capabilities, RBAC authorization, audit logging, and enterprise-grade security.

## 🚀 Quick Start with GitHub Codespaces

The easiest way to get started is using GitHub Codespaces:

1. **Open in Codespaces**: Click the green "Code" button and select "Open with Codespaces"
2. **Wait for Setup**: The devcontainer will automatically set up the entire development environment
3. **Start Development**: Once setup is complete, you can immediately start developing

### What's Included in Codespaces

- ✅ **Complete Development Environment**: Node.js 18, TypeScript, and all necessary tools
- ✅ **Database Services**: PostgreSQL and Redis automatically configured
- ✅ **VS Code Extensions**: Pre-configured with TypeScript, React, Docker, and testing tools
- ✅ **Port Forwarding**: All services automatically exposed on their respective ports
- ✅ **Hot Reloading**: Development servers with live reloading enabled

## 🛠️ Local Development Setup

If you prefer to develop locally, follow these steps:

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- PostgreSQL 15+ (optional, Docker will provide this)
- Redis 7+ (optional, Docker will provide this)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/user-management-system.git
   cd user-management-system
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development environment**
   ```bash
   # Using Docker (recommended)
   npm run docker:up
   
   # Or start services individually
   npm run dev
   ```

5. **Run database migrations**
   ```bash
   npm run migrate:all
   ```

6. **Seed the database (optional)**
   ```bash
   npm run seed:all
   ```

## 📁 Project Structure

```
user-management-system/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # React context providers
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript type definitions
│   └── tests/              # Frontend tests
├── services/               # Microservices
│   ├── auth-service/       # Authentication service
│   ├── user-service/       # User management service
│   └── session-service/    # Session management service
├── shared/                 # Shared utilities and types
├── migrations/             # Database migrations
├── memory-bank/           # Project documentation and planning
└── .devcontainer/         # GitHub Codespaces configuration
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Services only
npm run test:services

# Frontend only
npm run test:frontend

# With coverage
npm run test:coverage
```

### Test Types
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and service integration testing
- **Performance Tests**: Load testing and performance benchmarking
- **E2E Tests**: End-to-end user workflow testing (Playwright)

## 🚀 Development Commands

### Core Development
```bash
# Start all services in development mode
npm run dev

# Start specific services
npm run dev:auth      # Auth service only
npm run dev:user      # User service only
npm run dev:session   # Session service only
npm run dev:frontend  # Frontend only
```

### Building
```bash
# Build all services
npm run build:all

# Build specific components
npm run build:shared
npm run build:services
npm run build:frontend
```

### Database Operations
```bash
# Run migrations
npm run migrate:all

# Seed database
npm run seed:all

# Reset database (Docker)
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
npm run security:fix
```

## 🐳 Docker Commands

### Development Environment
```bash
# Start development environment
npm run docker:up

# View logs
npm run docker:logs

# Stop environment
npm run docker:down

# Rebuild containers
npm run docker:build
```

### Production Environment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production environment
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/user_management
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Services
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
SESSION_SERVICE_URL=http://localhost:3003

# Frontend
VITE_API_BASE_URL=http://localhost:3002
VITE_AUTH_SERVICE_URL=http://localhost:3001
```

### Service Configuration

Each service has its own configuration files:
- `services/auth-service/src/config/` - Auth service configuration
- `services/user-service/src/config/` - User service configuration
- `services/session-service/src/config/` - Session service configuration

## 📊 Monitoring and Logging

### Health Checks
```bash
# Check service health
curl http://localhost:3001/health  # Auth service
curl http://localhost:3002/health  # User service
curl http://localhost:3003/health  # Session service
```

### Logs
```bash
# View all service logs
npm run docker:logs

# View specific service logs
docker-compose logs -f auth-service
docker-compose logs -f user-service
docker-compose logs -f session-service
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **RBAC Authorization**: Role-based access control
- **Input Validation**: Comprehensive input sanitization and validation
- **Audit Logging**: Complete audit trail for all user actions
- **Data Encryption**: Sensitive data encryption at rest and in transit
- **Session Management**: Secure session handling with device validation

## 📈 Performance Features

- **Virtual Scrolling**: Handle 1000+ users efficiently
- **Caching Strategy**: Multi-level caching (browser, React Query, application)
- **Code Splitting**: Lazy loading for optimal bundle size
- **Database Optimization**: Proper indexing and query optimization
- **Performance Monitoring**: Real-time performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Follow the existing code style and formatting
- Run all tests before submitting PRs

## 📝 API Documentation

### User Management API
- `GET /api/v1/user-management` - List users with pagination
- `GET /api/v1/user-management/:id` - Get user by ID
- `POST /api/v1/user-management` - Create new user
- `PUT /api/v1/user-management/:id` - Update user
- `DELETE /api/v1/user-management/:id` - Soft delete user

### Authentication API
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - User logout

### RBAC API
- `GET /api/v1/rbac/roles` - List roles
- `GET /api/v1/rbac/permissions` - List permissions
- `POST /api/v1/rbac/roles` - Create role
- `PUT /api/v1/rbac/roles/:id` - Update role

### Audit API
- `GET /api/v1/audit/logs` - Get audit logs
- `GET /api/v1/audit/logs/:userId` - Get user audit trail

## 🏗️ Architecture

### Microservices Architecture
- **Auth Service**: Handles authentication, authorization, and user sessions
- **User Service**: Manages user data, profiles, and user-related operations
- **Session Service**: Manages user sessions and device tracking
- **Frontend**: React-based user interface with TypeScript

### Technology Stack
- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Database**: PostgreSQL with JSONB for audit logs
- **Cache**: Redis for session management and caching
- **Testing**: Jest, React Testing Library, Playwright
- **Containerization**: Docker and Docker Compose

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/yourusername/user-management-system/issues) page
2. Review the documentation in the `memory-bank/` directory
3. Create a new issue with detailed information about your problem

## 🎯 Roadmap

- [ ] Advanced user analytics and reporting
- [ ] Multi-tenant support
- [ ] Advanced security features (2FA, SSO)
- [ ] Mobile application
- [ ] API rate limiting and throttling
- [ ] Advanced search and filtering capabilities 