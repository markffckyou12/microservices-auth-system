# Multi-stage Dockerfile for Microservices Authentication System
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY services/*/package*.json ./

# Install only production dependencies by default
RUN npm install --omit=dev

# Development stage
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
COPY services/*/package*.json ./
COPY . .
# Install all dependencies including devDependencies in root
RUN npm install
# Install dev dependencies for auth-service specifically
WORKDIR /app/services/auth-service
RUN npm install
EXPOSE 3001 3002 3003
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
COPY . .
RUN npm run build
EXPOSE 3001 3002 3003
CMD ["npm", "run", "start"]