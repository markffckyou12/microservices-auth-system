# Multi-stage Dockerfile for Microservices Authentication System
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY services/*/package*.json ./

# Install all dependencies (including dev dependencies for testing)
RUN npm ci

# Development stage
FROM base AS development
COPY . .
EXPOSE 3001 3002 3003

# Production stage
FROM base AS production
COPY . .
RUN npm run build
EXPOSE 3001 3002 3003

# Default to development
CMD ["npm", "run", "dev"]