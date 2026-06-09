const nodemailer = require('nodemailer');
require('dotenv').config({ path: './matasree-backend/.env' });

console.log('🔍 EMAIL SERVICE DIAGNOSTIC TEST\n');
console.log('================================\n');

// Check environment variables
console.log('📋 Configuration Check:');
console.log(`   EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'NOT SET'}`);
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
console.log(`   EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '***HIDDEN***' : 'NOT SET'}`);
console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'NOT SET'}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}\n`);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('❌ ERROR: EMAIL_USER or EMAIL_PASSWORD not set in .env file!');
  process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Test connection
console.log('🔌 Testing SMTP Connection...');
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ SMTP Connection Failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'EAUTH') {
      console.error('\n   ⚠️  Authentication Failed!');
      console.error('   Possible causes:');
      console.error('   1. Wrong password/app password');
      console.error('   2. Gmail account security settings');
      console.error('   3. 2FA enabled - need to use App Password instead of regular password');
    }
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Successful!\n');
    
    // Try sending a test email
    console.log('📧 Sending test email...');
    
    const testMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: 'Matasree Store - Email Service Test',
      html: `
        <h2>✅ Email Service is Working!</h2>
        <p>This is a test email from Matasree Store Newsletter system.</p>
        <p>If you received this, your email configuration is correct.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `,
    };
    
    transporter.sendMail(testMailOptions, function(error, info) {
      if (error) {
        console.error('❌ Failed to send test email:');
        console.error('   Error:', error.message);
        console.error('   Code:', error.code);
        process.exit(1);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   Response:', info.response);
        console.log('\n🎉 Email service is fully functional!');
        console.log('\n📌 Next Steps:');
        console.log('   1. Check your email inbox for the test message');
        console.log('   2. If not in inbox, check Spam/Promotions folder');
        console.log('   3. If still not received, credentials may be incorrect');
        process.exit(0);
      }
    });
  }
});
