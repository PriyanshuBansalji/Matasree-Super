# Google OAuth 2.0 Setup Guide

## Overview
This guide explains how to set up Google OAuth 2.0 authentication for Matasree Store. Google OAuth allows users to sign in using their Google account.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account (or create one if needed)
3. Click on the project dropdown at the top
4. Click **"NEW PROJECT"**
5. Enter project name: `Matasree Store`
6. Click **CREATE**
7. Wait for the project to be created (takes a few seconds)

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for **"Google+ API"**
3. Click on it and click **ENABLE**
4. Wait for it to enable

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **CREATE CREDENTIALS** > **OAuth 2.0 Client ID**
3. If prompted to create a consent screen first:
   - Click **CONFIGURE CONSENT SCREEN**
   - Select **External** userType
   - Click **CREATE**
   - Fill in required fields:
     - **App name:** `Matasree Store`
     - **User support email:** Your email
     - **Developer contact:** Your email
   - Click **SAVE AND CONTINUE** for scopes
   - Click **ADD OR REMOVE SCOPES** > Search `email` and `profile` > Add both
   - Click **UPDATE** then **SAVE AND CONTINUE**
   - Click **SAVE AND CONTINUE** on Summary
   - Go back to **Credentials**

4. Click **CREATE CREDENTIALS** > **OAuth 2.0 Client ID** again
5. Select **Web application**
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:5001/api/auth/google/callback` (development)
   - `http://localhost:5001/api/auth/google/callback` (local testing)
   - `http://your-production-domain.com/api/auth/google/callback` (production)

7. Click **CREATE**
8. A popup will show your credentials. Copy:
   - **Client ID**
   - **Client Secret**

## Step 4: Update Environment Variables

1. Open `matasree-backend/.env`
2. Find the Google OAuth section:
```env
# OAuth - Google (get from Google Cloud Console)
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

3. Replace:
   - `YOUR_CLIENT_ID_HERE` with your Client ID from Step 3
   - `YOUR_CLIENT_SECRET_HERE` with your Client Secret from Step 3

**Example:**
```env
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456xyz
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

4. Save the file

## Step 5: Restart Backend Server

1. Stop the backend server (Ctrl+C if running)
2. Restart it:
```bash
npm run dev
```

3. Check the logs - you should see:
```
✅ Google OAuth strategy registered
```

## Step 6: Test in Frontend

1. Go to your frontend (http://localhost:8000)
2. Go to login page
3. Click **"Sign in with Google"** button
4. Complete the Google sign-in flow
5. You should be redirected to the app and logged in

## Troubleshooting

### Error: "Invalid redirect URI"
- Check that your callback URL in Google Cloud Console matches exactly:
  - Must start with `http://` or `https://`
  - No trailing slash
  - Must match `GOOGLE_CALLBACK_URL` in .env

### Error: "OAuth is not configured"
- Check `.env` file for `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Must restart backend after changing `.env`
- Backend logs should show `✅ Google OAuth strategy registered`

### Error: "Invalid Client ID"
- Double-check you copied the Client ID correctly
- No extra spaces or characters
- Make sure you're using the correct credentials (not Client Secret in ID field)

### Frontend doesn't show Google login button
- Check `/api/auth/oauth-status` endpoint
- Should return `"google": true`
- If false, check backend logs

## Production Deployment

For production, you'll need to:

1. Update Google Cloud Console credentials:
   - Add production callback URL: `https://your-domain.com/api/auth/google/callback`

2. Update .env for production:
```env
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
BACKEND_URL=https://your-domain.com
```

3. Use `https://` for all URLs (required by Google)

## Security Notes

- Never commit `.env` file to Git
- Never share Client Secret publicly
- Keep Client Secret private - only use on backend
- Regenerate credentials if accidentally exposed

## Need Help?

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- Check backend logs: `npm run dev`
