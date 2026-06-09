@echo off
REM Matasree Store - Google OAuth Setup Helper
REM This script guides you through setting up Google OAuth

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Matasree Store - Google OAuth Setup
echo ==========================================
echo.
echo This script will help you configure Google OAuth.
echo.
echo Prerequisites:
echo   1. Google Account
echo   2. Access to Google Cloud Console
echo.

set /p PROCEED="Do you want to proceed with Google OAuth setup? (y/n): "
if /i not "%PROCEED%"=="y" (
  echo Setup cancelled.
  exit /b 1
)

echo.
echo STEP 1: Go to https://console.cloud.google.com/
echo STEP 2: Create a new project named 'Matasree Store'
echo STEP 3: Enable Google+ API
echo STEP 4: Create OAuth 2.0 credentials (Web Application)
echo.
echo When asked for redirect URIs, enter:
echo   - http://localhost:5001/api/auth/google/callback
echo.

set /p CLIENT_ID="Enter your Google Client ID: "
set /p CLIENT_SECRET="Enter your Google Client Secret: "

set ENV_FILE=matasree-backend\.env

if not exist "%ENV_FILE%" (
  echo Error: %ENV_FILE% not found
  exit /b 1
)

REM Backup the original .env
copy "%ENV_FILE%" "%ENV_FILE%.backup" >nul
echo Created backup: %ENV_FILE%.backup

REM Update .env with new credentials using PowerShell
powershell -Command "
$env = @{}
Get-Content '%ENV_FILE%' | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $env[$matches[1]] = $matches[2]
    }
}
$env['GOOGLE_CLIENT_ID'] = '%CLIENT_ID%'
$env['GOOGLE_CLIENT_SECRET'] = '%CLIENT_SECRET%'
$content = $env.GetEnumerator() | ForEach-Object { '$($_.Name)=$($_.Value)' } -join \"`n\"
Set-Content -Path '%ENV_FILE%' -Value ($content -join \"`n\") -Encoding UTF8
"

echo.
echo ✅ Google OAuth credentials updated in .env
echo.
echo Next steps:
echo   1. Restart the backend server: npm run dev
echo   2. Check logs for: ✅ Google OAuth strategy registered
echo   3. Test in frontend by clicking 'Sign in with Google'
echo.
echo For more details, see: GOOGLE_OAUTH_SETUP.md
echo.
pause
