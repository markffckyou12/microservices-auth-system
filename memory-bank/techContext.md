# TECHNOLOGY CONTEXT

## TECHNOLOGY STACK OVERVIEW

### Core Framework
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (v4.18+)
- **Language**: JavaScript/TypeScript
- **Package Manager**: npm with workspaces

### Database Technologies
- **Main Database**: PostgreSQL (v14+)
  - Shared database with service-specific schemas
  - Authentication schema for user management
  - CRUD schema for data operations
  - Forms schema for form data and metadata
  - ACID compliance for data integrity

### Session Management
- **Redis**: Session storage and caching
  - User session management
  - Temporary data storage
  - Rate limiting data
  - Shared cache across services

### Authentication and Security
- **JWT (JSON Web Tokens)**: Stateless authentication
- **bcrypt**: Password hashing
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers
- **Rate Limiting**: API protection

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Unit testing
- **Supertest**: API testing
- **nodemon**: Development server

## INDEPENDENT MONOREPO STRUCTURE

### Project Organization
```
project-root/
├── package.json                 # Root package.json with workspaces
├── packages/
│   ├── auth-service/           # Authentication service (independent)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── middleware/
│   │   │   └── utils/
│   │   ├── tests/
│   │   └── README.md
│   ├── crud-service/           # CRUD service (independent)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── middleware/
│   │   │   └── utils/
│   │   ├── tests/
│   │   └── README.md
│   └── form-service/           # Form service (independent)
│       ├── package.json
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── utils/
│   ├── tests/
│   └── README.md
├── scripts/                   # Build and deployment scripts
├── docs/                     # Documentation
└── docker-compose.yml        # Development environment
```

### Root Package.json
```json
{
  "name": "three-services-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:auth\" \"npm run dev:crud\" \"npm run dev:form\"",
    "dev:auth": "npm run dev --workspace=auth-service",
    "dev:crud": "npm run dev --workspace=crud-service",
    "dev:form": "npm run dev --workspace=form-service",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  },
  "devDependencies": {
    "concurrently": "^8.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

## SERVICE-SPECIFIC TECHNOLOGIES

### Authentication Service (Independent)
```javascript
// Core Dependencies
{
  "express": "^4.18.2",
  "pg": "^8.11.0",           // PostgreSQL client
  "bcrypt": "^5.1.0",        // Password hashing
  "jsonwebtoken": "^9.0.0",  // JWT tokens
  "redis": "^4.6.0",         // Session storage
  "joi": "^17.9.0",          // Input validation
  "helmet": "^7.0.0",        // Security headers
  "express-rate-limit": "^6.7.0", // Rate limiting
  "axios": "^1.4.0"          // For service-to-service calls
}
```

### CRUD Service (Independent)
```javascript
// Core Dependencies
{
  "express": "^4.18.2",
  "pg": "^8.11.0",           // PostgreSQL client
  "jsonwebtoken": "^9.0.0",  // JWT validation
  "joi": "^17.9.0",          // Input validation
  "redis": "^4.6.0",         // Caching
  "helmet": "^7.0.0",        // Security headers
  "express-rate-limit": "^6.7.0", // Rate limiting
  "axios": "^1.4.0"          // For service-to-service calls
}
```

### Form Service (Independent)
```javascript
// Core Dependencies
{
  "express": "^4.18.2",
  "pg": "^8.11.0",           // PostgreSQL client
  "jsonwebtoken": "^9.0.0",  // JWT validation
  "joi": "^17.9.0",          // Input validation
  "redis": "^4.6.0",         // Caching
  "helmet": "^7.0.0",        // Security headers
  "express-rate-limit": "^6.7.0", // Rate limiting
  "axios": "^1.4.0"          // For service-to-service calls
}
```

## DATABASE SCHEMAS

### Authentication Schema
```sql
-- Users table
CREATE TABLE auth.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE auth.sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES auth.users(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE auth.roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  permissions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### CRUD Schema
```sql
-- Generic entities table
CREATE TABLE crud.entities (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  metadata JSONB,
  created_by INTEGER REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE crud.audit_log (
  id SERIAL PRIMARY KEY,
  entity_id INTEGER REFERENCES crud.entities(id),
  action VARCHAR(50) NOT NULL,
  user_id INTEGER REFERENCES auth.users(id),
  changes JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Forms Schema
```sql
-- Forms table
CREATE TABLE forms.forms (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  schema JSONB NOT NULL,        -- Form definition
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form responses table
CREATE TABLE forms.responses (
  id SERIAL PRIMARY KEY,
  form_id INTEGER REFERENCES forms.forms(id),
  user_id INTEGER REFERENCES auth.users(id),
  data JSONB NOT NULL,          -- Response data
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);
```

## API DESIGN PATTERNS

### RESTful API Structure
```
Authentication Service:
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/profile
PUT    /auth/profile

CRUD Service:
GET    /api/:entity
GET    /api/:entity/:id
POST   /api/:entity
PUT    /api/:entity/:id
DELETE /api/:entity/:id
GET    /api/:entity/search

Form Service:
GET    /forms
GET    /forms/:id
POST   /forms
PUT    /forms/:id
DELETE /forms/:id
POST   /forms/:id/submit
GET    /forms/:id/responses
```

### Service-to-Service Communication
```javascript
// Example: CRUD service calling Auth service
const axios = require('axios');

const validateToken = async (token) => {
  try {
    const response = await axios.get('http://localhost:3001/auth/validate', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

### Response Format
```javascript
// Success Response
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2023-01-01T00:00:00Z"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  },
  "timestamp": "2023-01-01T00:00:00Z"
}
```

## SECURITY CONSIDERATIONS

### Authentication Security
- JWT tokens with short expiration (15 minutes)
- Refresh tokens with longer expiration (7 days)
- Password hashing with bcrypt (salt rounds: 12)
- Rate limiting on authentication endpoints
- Input validation and sanitization

### API Security
- CORS configuration for allowed origins
- Security headers with Helmet
- Rate limiting on all endpoints
- JWT token validation on protected routes
- Request size limits

### Data Security
- Database connection encryption (SSL/TLS)
- Environment variable configuration
- No sensitive data in logs
- Input validation on all endpoints
- SQL injection prevention with parameterized queries

## PERFORMANCE CONSIDERATIONS

### Caching Strategy
- Redis for session storage
- Redis for frequently accessed data
- Database query result caching
- Static asset caching

### Database Optimization
- Indexes on frequently queried fields
- Connection pooling
- Query optimization
- Pagination for large datasets

### API Optimization
- Response compression
- Request/response size limits
- Efficient JSON serialization
- Background job processing

## DEVELOPMENT ENVIRONMENT

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- npm 9+

### Local Development Setup
```bash
# Clone repository
git clone <repository-url>
cd three-services-monorepo

# Install dependencies for all workspaces
npm install

# Set up database
npm run db:setup

# Start development servers (all services independently)
npm run dev

# Or start individual services
npm run dev:auth
npm run dev:crud
npm run dev:form

# Run tests
npm test

# Run linting
npm run lint
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/three_services
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Service URLs (for service-to-service communication)
AUTH_SERVICE_URL=http://localhost:3001
CRUD_SERVICE_URL=http://localhost:3002
FORM_SERVICE_URL=http://localhost:3003

# Service-specific ports
AUTH_SERVICE_PORT=3001
CRUD_SERVICE_PORT=3002
FORM_SERVICE_PORT=3003
```

## TESTING STRATEGY

### Unit Testing
- Jest for test framework
- Supertest for API testing
- Mock databases for isolation
- Coverage targets: 80%+

### Integration Testing
- Service-to-service communication
- Database integration tests
- API endpoint testing
- Authentication flow testing

### End-to-End Testing
- Complete user workflows
- Cross-service interactions
- Performance testing
- Security testing

## MONITORING AND LOGGING

### Logging Strategy
- Structured JSON logging
- Log levels: error, warn, info, debug
- Request/response logging
- Error tracking and alerting

### Monitoring
- Service health checks
- Database connection monitoring
- API response time tracking
- Error rate monitoring
- Resource usage monitoring

## DEPLOYMENT CONFIGURATION

### Independent Service Deployment
```dockerfile
# Example: Authentication Service Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]
```

### Docker Compose Configuration
```yaml
version: '3.8'
services:
  auth-service:
    build: ./packages/auth-service
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/three_services
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  crud-service:
    build: ./packages/crud-service
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/three_services
      - REDIS_URL=redis://redis:6379
      - AUTH_SERVICE_URL=http://auth-service:3001
    depends_on:
      - postgres
      - redis
      - auth-service

  form-service:
    build: ./packages/form-service
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/three_services
      - REDIS_URL=redis://redis:6379
      - AUTH_SERVICE_URL=http://auth-service:3001
      - CRUD_SERVICE_URL=http://crud-service:3002
    depends_on:
      - postgres
      - redis
      - auth-service
      - crud-service

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=three_services
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres-data:
```

## INDEPENDENT DEVELOPMENT BENEFITS

### Development Benefits
- **True Independence**: Each service can be developed independently
- **Technology Flexibility**: Each service can use different approaches
- **Team Autonomy**: Different teams can work on different services
- **Focused Testing**: Each service has its own test suite

### Operational Benefits
- **Independent Deployment**: Deploy services separately
- **Independent Scaling**: Scale services based on load
- **Fault Isolation**: One service failure doesn't affect others
- **Technology Evolution**: Each service can evolve independently

### Maintenance Benefits
- **Clear Boundaries**: Each service has clear responsibilities
- **Easier Debugging**: Issues are isolated to specific services
- **Independent Updates**: Update services without affecting others
- **Code Ownership**: Clear ownership of each service

## FUTURE REFACTORING STRATEGY

### When to Extract Shared Utilities
- **Code Duplication**: When similar code appears in multiple services
- **Common Patterns**: When the same patterns are repeated
- **Shared Business Logic**: When business rules are the same
- **Performance Optimization**: When shared code improves performance

### Extraction Process
1. **Identify Common Code**: Find duplicated functionality
2. **Create Shared Package**: Extract to a new package
3. **Update Dependencies**: Update services to use shared package
4. **Test Integration**: Ensure all services work with shared code
5. **Document Changes**: Update documentation and examples

### Shared Package Structure
```
packages/
├── shared/
│   ├── package.json
│   ├── src/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── types/
│   │   └── database/
│   └── tests/
``` 