#!/bin/bash
# Matasree Store - Full Stack Quick Start Script

echo "🚀 Starting Matasree Store - Full Stack Setup"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_section() {
    echo -e "${BLUE}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if Node.js is installed
print_section "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi
print_success "Node.js $(node --version) found"

# Backend Setup
print_section "Setting up Backend..."
cd matasree-backend

if [ ! -f ".env" ]; then
    print_warning "No .env file found in backend. Creating from .env.example..."
    cp .env.example .env
    print_warning "Please update .env with your MongoDB URI and other credentials"
fi

print_section "Installing backend dependencies..."
npm install
print_success "Backend dependencies installed"

# Frontend Setup
print_section "Setting up Frontend..."
cd ../matasree-superstore-main

if [ ! -f ".env.local" ]; then
    print_warning "Creating .env.local for frontend..."
    echo "VITE_API_URL=http://localhost:5000/api" > .env.local
fi

print_section "Installing frontend dependencies..."
npm install
print_success "Frontend dependencies installed"

echo ""
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update backend/.env with your MongoDB URI and credentials"
echo "2. Start Backend: cd matasree-backend && npm run dev"
echo "3. Start Frontend: cd matasree-superstore-main && npm run dev"
echo ""
echo -e "${BLUE}Backend URL:${NC} http://localhost:5000"
echo -e "${BLUE}Frontend URL:${NC} http://localhost:5173"
echo ""
