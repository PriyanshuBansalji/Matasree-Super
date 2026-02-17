@echo off
REM Install required packages for email functionality
echo Installing email system dependencies...

cd matasree-backend

REM Install nodemailer and express-validator
call npm install nodemailer express-validator

echo.
echo ✅ Dependencies installed successfully!
echo.
echo Next steps:
echo 1. Configure your .env file with email settings (see EMAIL_SETUP_GUIDE.md)
echo 2. For Gmail: Generate an App Password at https://myaccount.google.com/apppasswords
echo 3. Add these to your .env:
echo    - EMAIL_SERVICE=gmail
echo    - EMAIL_USER=your-email@gmail.com
echo    - EMAIL_PASSWORD=your-app-password
echo    - ADMIN_EMAIL=admin@matasreesuper.com
echo.
echo 4. Test the email system with:
echo    npm run dev
echo.
pause
