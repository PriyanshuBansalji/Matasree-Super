/**
 * Comprehensive Email System Audit & Validation Test Script
 * Tests all email workflows, templates, sanitization, and fallback mechanisms.
 */
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from matasree-backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import {
  getSenderString,
  getReplyToAddress,
  getAdminEmail,
  escapeHtml,
  sanitizeHeader,
  verifyEmailConnection,
  sendWelcomeEmail,
  sendOTPEmail,
  sendLoginOTPEmail,
  sendPasswordResetEmail,
  sendPasswordChangedNotification,
  sendEmailChangeVerification,
  sendAccountDeletionEmail,
  sendOrderConfirmationEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailureEmail,
  sendShippedEmail,
  sendOutForDeliveryEmail,
  sendDeliveredEmail,
  sendCancelledEmail,
  sendRefundInitiatedEmail,
  sendRefundCompletedEmail,
  sendContactReceiptEmail,
  sendCustomerSupportReplyEmail,
  sendAdminContactAlertEmail,
  sendNewsletterWelcomeEmail,
  sendPromotionalEmail,
  sendLowStockNotificationEmail,
  sendNewOrderAdminNotificationEmail,
  sendFailedPaymentAdminAlert,
  sendSystemAlertEmail,
} from '../utils/email';

async function runEmailAudit() {
  console.log('================================================================');
  console.log('       MATASREE SUPER EMAIL SYSTEM COMPREHENSIVE AUDIT & TEST   ');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failedTests++;
    }
  }

  // 1. Sender Configuration & Helpers Validation
  console.log('--- 1. Sender Configuration & Security Sanitization ---');
  const senderStr = getSenderString();
  console.log(`  Sender String: ${senderStr}`);
  assert(senderStr.includes('Matasree Super') && senderStr.includes('admin@matasreesuper.com'), 'Sender matches Matasree Super <admin@matasreesuper.com>');

  const replyTo = getReplyToAddress();
  console.log(`  Reply-To: ${replyTo}`);
  assert(replyTo === 'admin@matasreesuper.com', 'Reply-To matches admin@matasreesuper.com');

  const adminEmail = getAdminEmail();
  console.log(`  Admin Email: ${adminEmail}`);
  assert(adminEmail === 'admin@matasreesuper.com', 'Admin Email matches admin@matasreesuper.com');

  // Sanitization Tests
  const escaped = escapeHtml('<script>alert("xss")</script>');
  assert(escaped === '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;', 'HTML Escaping prevents script injection');

  const sanitizedHeader = sanitizeHeader('Subject Line\r\nBcc: hacker@bad.com');
  assert(!sanitizedHeader.includes('\r') && !sanitizedHeader.includes('\n'), 'Header sanitization strips CRLF');

  // 2. SMTP Connectivity Verification
  console.log('\n--- 2. SMTP Connectivity & Resilient Fallback ---');
  const connectionOk = await verifyEmailConnection();
  console.log(`  Connection Verification Result: ${connectionOk}`);

  // 3. User Authentication Email Workflows
  console.log('\n--- 3. User Authentication Email Workflows ---');
  const testUser = 'testuser@example.com';

  assert(await sendWelcomeEmail(testUser, 'Priyanshu Bansal'), 'Welcome Email');
  assert(await sendOTPEmail(testUser, '123456'), 'Email Verification OTP Email');
  assert(await sendLoginOTPEmail(testUser, '654321', 'Priyanshu Bansal'), 'Login OTP Email');
  assert(await sendPasswordResetEmail(testUser, 'RESET_TOKEN_8899', 'Priyanshu Bansal'), 'Password Reset Email');
  assert(await sendPasswordChangedNotification(testUser, 'Priyanshu Bansal'), 'Password Changed Notification Email');
  assert(await sendEmailChangeVerification(testUser, 'newemail@example.com', '998877'), 'Email Change Verification Email');
  assert(await sendAccountDeletionEmail(testUser, 'Priyanshu Bansal'), 'Account Deletion Confirmation Email');

  // 4. Customer Order Lifecycle Email Workflows
  console.log('\n--- 4. Customer Order Lifecycle Email Workflows ---');
  const sampleOrder = {
    orderNumber: 'MS-2026-9901',
    items: [
      { name: 'Pure Red Chilli Powder 200g', quantity: 2, price: 150 },
      { name: 'Kashmiri Garam Masala 100g', quantity: 1, price: 220 },
    ],
    totalAmount: 520,
    shippingAddress: {
      fullName: 'Priyanshu Bansal',
      addressLine1: '123 Spice Garden Road',
      addressLine2: 'Phase 1, Rajpur',
      city: 'Dehradun',
      state: 'Uttarakhand',
      pincode: '248001',
      phone: '+91 9876543210',
    },
    paymentMethod: 'cashfree',
  };

  assert(await sendOrderConfirmationEmail(sampleOrder, testUser), 'Order Confirmation Email');
  assert(await sendPaymentSuccessEmail('MS-2026-9901', testUser, 520, 'pay_RzP1234567'), 'Payment Success Email');
  assert(await sendPaymentFailureEmail('MS-2026-9902', testUser, 520, 'Card declined by issuing bank'), 'Payment Failure Email');
  assert(await sendShippedEmail('MS-2026-9901', testUser, 'Thursday, 30 July 2026', sampleOrder.shippingAddress), 'Order Shipped Email');
  assert(await sendOutForDeliveryEmail('MS-2026-9901', testUser, sampleOrder.shippingAddress), 'Out For Delivery Email');
  assert(await sendDeliveredEmail('MS-2026-9901', testUser), 'Order Delivered Email');
  assert(await sendCancelledEmail('MS-2026-9901', testUser, 520), 'Order Cancelled Email');
  assert(await sendRefundInitiatedEmail('MS-2026-9901', testUser, 520), 'Refund Initiated Email');
  assert(await sendRefundCompletedEmail('MS-2026-9901', testUser, 520, 'rfnd_RzP987654'), 'Refund Completed Email');

  // 5. Contact & Support System Workflows
  console.log('\n--- 5. Contact & Support System Workflows ---');
  assert(await sendContactReceiptEmail(testUser, 'Priyanshu Bansal', 'Inquiry about bulk order'), 'Contact Form Auto-Reply Email');
  assert(await sendCustomerSupportReplyEmail(testUser, 'Priyanshu Bansal', 'Bulk order pricing', 'Yes, we offer 15% wholesale discount for orders over 10kg!'), 'Customer Support Reply Email');
  assert(await sendAdminContactAlertEmail({ name: 'Priyanshu Bansal', email: testUser, subject: 'Bulk order pricing', message: 'Hello, what is your pricing for 20kg Garam Masala?', phone: '9876543210' }), 'Admin Contact Form Alert Email');

  // 6. Marketing Workflows
  console.log('\n--- 6. Marketing Workflows ---');
  assert(await sendNewsletterWelcomeEmail(testUser, 'Priyanshu Bansal', 'MS10-WELCOME', 10, 200, 199), 'Newsletter Subscription Welcome Email');
  assert(await sendPromotionalEmail(testUser, '🌶️ Monsoon Spice Festival - 20% OFF Everything!', 'Monsoon Spice Festival', 'Celebrate the rains with authentic ground spices!', `${process.env.FRONTEND_URL}/products`, 'Shop Festival Sale'), 'Promotional Broadcast Email');

  // 7. Admin Alert Workflows
  console.log('\n--- 7. Admin System Alert Workflows ---');
  assert(await sendLowStockNotificationEmail('admin@matasreesuper.com', [{ name: 'Turmeric Powder 500g', sku: 'TUR-500', stock: 2, threshold: 10 }]), 'Low Stock Alert Email');
  assert(await sendNewOrderAdminNotificationEmail('admin@matasreesuper.com', { orderNumber: 'MS-2026-9901', totalAmount: 520, customerName: 'Priyanshu Bansal', customerEmail: testUser }), 'New Order Notification Email');
  assert(await sendFailedPaymentAdminAlert('admin@matasreesuper.com', 'MS-2026-9902', 520, 'Gateway Timeout'), 'Failed Payment Alert Email');
  assert(await sendSystemAlertEmail('admin@matasreesuper.com', 'Database Connections Normal', 'All services operational.'), 'System Health Alert Email');

  console.log('\n================================================================');
  console.log(` AUDIT SUMMARY: Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runEmailAudit().catch((err) => {
  console.error('Fatal Audit Error:', err);
  process.exit(1);
});
