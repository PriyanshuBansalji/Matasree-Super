#!/bin/bash

# Matasree Store - Google OAuth Setup Helper
# This script guides you through setting up Google OAuth

echo "=========================================="
echo "Matasree Store - Google OAuth Setup"
echo "=========================================="
echo ""
echo "This script will help you configure Google OAuth."
echo ""
echo "Prerequisites:"
echo "  1. Google Account"
echo "  2. Access to Google Cloud Console"
echo ""

read -p "Do you want to proceed with Google OAuth setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Setup cancelled."
  exit 1
fi

echo ""
echo "STEP 1: Go to https://console.cloud.google.com/"
echo "STEP 2: Create a new project named 'Matasree Store'"
echo "STEP 3: Enable Google+ API"
echo "STEP 4: Create OAuth 2.0 credentials (Web Application)"
echo ""
echo "When asked for redirect URIs, enter:"
echo "  - http://localhost:5001/api/auth/google/callback"
echo ""
echo "Once you have your credentials:"
read -p "Enter your Google Client ID: " CLIENT_ID
read -sp "Enter your Google Client Secret: " CLIENT_SECRET
echo ""

# Update .env file
ENV_FILE="matasree-backend/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found"
  exit 1
fi

# Backup the original .env
cp "$ENV_FILE" "$ENV_FILE.backup"
echo "Created backup: $ENV_FILE.backup"

# Update .env with new credentials
sed -i "s/^GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=$CLIENT_ID/" "$ENV_FILE"
sed -i "s/^GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=$CLIENT_SECRET/" "$ENV_FILE"

echo ""
echo "✅ Google OAuth credentials updated in .env"
echo ""
echo "Next steps:"
echo "  1. Restart the backend server: npm run dev"
echo "  2. Check logs for: ✅ Google OAuth strategy registered"
echo "  3. Test in frontend by clicking 'Sign in with Google'"
echo ""
echo "For more details, see: GOOGLE_OAUTH_SETUP.md"
