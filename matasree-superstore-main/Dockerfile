# Frontend Dockerfile using Nginx
# Build Stage
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Build args for frontend environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy source code
COPY . .

# Build the app explicitly for production
RUN npm run build

# Nginx Stage
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy from builder stage
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Replace default Nginx configuration with custom one
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (Maps to 8000 externally in compose)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
