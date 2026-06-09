# Backend Dockerfile for Node.js Express App
# Build stage
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /usr/src/app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Install curl for healthcheck
RUN apk --no-cache add curl

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built code from builder stage
COPY --from=builder /usr/src/app/dist ./dist
# Keep the uploads folder structure
COPY --from=builder /usr/src/app/uploads ./uploads

# Create non-root user for security
RUN chown -R node:node /usr/src/app
USER node

# Expose backend port
EXPOSE 5001

# Start the application
CMD ["node", "dist/server.js"]
