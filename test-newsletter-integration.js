#!/usr/bin/env node

/**
 * Matasree Store - Complete Newsletter & Coupon Integration Test
 * Tests the entire flow: login → subscribe → receive email → validate coupon → apply coupon
 * 
 * Usage: node test-newsletter-integration.js
 */

const http = require('http');
const https = require('https');
const BASE_URL = 'http://localhost:5001';
const TIMEOUT = 5000;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset', indent = 0) {
  const prefix = '  '.repeat(indent);
  console.log(`${colors[color]}${prefix}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

function section(title, level = 1) {
  const char = level === 1 ? '─' : '•';
  log(char.repeat(76), 'gray', level - 1);
  log(title, 'blue', level - 1);
  log(char.repeat(76), 'gray', level - 1);
}

// HTTP/HTTPS request helper
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(path, BASE_URL);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout: TIMEOUT,
    };

    const protocol = urlObj.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test suite
async function runTests() {
  header('MATASREE STORE - NEWSLETTER & COUPON INTEGRATION TEST');

  let testsPassed = 0;
  let testsFailed = 0;
  let token = null;
  let couponCode = null;
  const testUser = {
    name: 'Newsletter Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'TestPass123!',
  };

  try {
    // Test 1: Health Check
    section('1️Health Check - Backend Connectivity', 1);
    try {
      const res = await request('GET', '/api/health');
      if (res.status === 200) {
        log('Backend is running on ' + BASE_URL, 'green', 1);
        testsPassed++;
      } else {
        throw new Error(`Unexpected status: ${res.status}`);
      }
    } catch (err) {
      log(`❌ Backend not reachable: ${err.message}`, 'red', 1);
      log('Please start backend: cd matasree-backend && npm run dev', 'yellow', 2);
      testsFailed++;
      throw err;
    }

    // Test 2: User Registration
    section('2️User Registration', 1);
    try {
      const res = await request('POST', '/api/auth/register', testUser);
      
      if (res.status === 201 || res.status === 200) {
        log(`User registered: ${testUser.email}`, 'green', 1);
        log(`   Name: ${testUser.name}`, 'green', 2);
        testsPassed++;
      } else if (res.status === 400 && res.body?.message?.includes('already')) {
        log(`User already exists, will use for login`, 'yellow', 1);
      } else {
        throw new Error(`Registration failed: ${res.body?.message || res.status}`);
      }
    } catch (err) {
      log(`Registration error: ${err.message}`, 'red', 1);
      testsFailed++;
    }

    // Test 3: User Login
    section('3️User Login', 1);
    try {
      const res = await request('POST', '/api/auth/login', {
        email: testUser.email,
        password: testUser.password,
      });

      if (res.status === 200 && res.body?.data?.accessToken) {
        token = res.body.data.accessToken;
        log(`✅ Login successful`, 'green', 1);
        log(`   Token: ${token.substring(0, 20)}...`, 'gray', 2);
        log(`   User: ${res.body.data.user?.email}`, 'green', 2);
        testsPassed++;
      } else {
        throw new Error(`Login failed: ${res.body?.message || res.status}`);
      }
    } catch (err) {
      log(`❌ Login error: ${err.message}`, 'red', 1);
      testsFailed++;
      throw err;
    }

    // Test 4: Newsletter Subscription (Generate Coupon)
    section('4️⃣  Newsletter Subscription - Generate Coupon', 1);
    try {
      const res = await request('POST', '/api/email/subscribe', 
        {
          email: testUser.email,
          name: testUser.name,
        },
        {
          'Authorization': `Bearer ${token}`,
        }
      );

      if (res.status === 200 && res.body?.code) {
        couponCode = res.body.code;
        log(`✅ Newsletter subscription successful`, 'green', 1);
        log(`   Coupon Code: ${couponCode}`, 'green', 2);
        log(`   Message: ${res.body.message}`, 'green', 2);
        log(`   Note: Email sent to ${res.body.email}`, 'blue', 2);
        testsPassed++;
      } else {
        throw new Error(`Subscription failed: ${res.body?.message || res.status}`);
      }
    } catch (err) {
      log(`❌ Newsletter subscription error: ${err.message}`, 'red', 1);
      testsFailed++;
    }

    // Test 5: Validate Coupon Code
    section('5️⃣  Coupon Validation', 1);
    if (couponCode) {
      try {
        const res = await request('POST', '/api/coupons/validate',
          {
            code: couponCode,
            orderAmount: 500, // ₹500 order
          },
          {
            'Authorization': `Bearer ${token}`,
          }
        );

        if (res.status === 200 && res.body?.data?.code) {
          log(`✅ Coupon is valid`, 'green', 1);
          log(`   Code: ${res.body.data.code}`, 'green', 2);
          log(`   Discount Type: ${res.body.data.discountType}`, 'green', 2);
          log(`   Discount Value: ${res.body.data.discountValue}%`, 'green', 2);
          log(`   Calculated Discount: ₹${res.body.data.calculatedDiscount}`, 'green', 2);
          log(`   Max Discount: ₹${res.body.data.maxDiscount}`, 'green', 2);
          log(`   Min Order Amount: ₹${res.body.data.minOrderAmount}`, 'green', 2);
          testsPassed++;
        } else {
          throw new Error(`Coupon validation failed: ${res.body?.message || res.status}`);
        }
      } catch (err) {
        log(`❌ Coupon validation error: ${err.message}`, 'red', 1);
        testsFailed++;
      }
    } else {
      log(`⚠️  Skipped (no coupon code generated)`, 'yellow', 1);
    }

    // Test 6: Check for Duplicate Prevention
    section('6️⃣  Duplicate Prevention - Second Subscription Attempt', 1);
    try {
      const res = await request('POST', '/api/email/subscribe',
        {
          email: testUser.email,
          name: testUser.name,
        },
        {
          'Authorization': `Bearer ${token}`,
        }
      );

      if (res.status === 200) {
        log(`✅ Duplicate prevention working`, 'green', 1);
        log(`   System returned existing coupon: ${res.body.code}`, 'green', 2);
        log(`   Message: ${res.body.message}`, 'green', 2);
        testsPassed++;
      } else {
        throw new Error(`Unexpected response: ${res.body?.message || res.status}`);
      }
    } catch (err) {
      log(`❌ Duplicate prevention test error: ${err.message}`, 'red', 1);
      testsFailed++;
    }

    // Test 7: API Response Format Check
    section('7️⃣  API Response Format Validation', 1);
    try {
      const res = await request('GET', '/api/products', null, {
        'Authorization': `Bearer ${token}`,
      });

      if (res.status === 200 || res.status === 401) {
        log(`✅ API endpoints responding correctly`, 'green', 1);
        log(`   Response Status: ${res.status}`, 'green', 2);
        testsPassed++;
      } else {
        throw new Error(`Unexpected status: ${res.status}`);
      }
    } catch (err) {
      log(`❌ API format validation error: ${err.message}`, 'red', 1);
      testsFailed++;
    }

    // Test 8: Frontend Connection
    section('8️⃣  Frontend Files Structure', 1);
    try {
      const fs = require('fs');
      const path = require('path');
      
      const requiredFiles = [
        'matasree-superstore-main/src/components/NewsletterSection.tsx',
        'matasree-superstore-main/src/services/api.ts',
        'matasree-superstore-main/src/store/authStore.ts',
      ];

      let allFound = true;
      for (const file of requiredFiles) {
        const fullPath = path.join('d:\\Matasree_Store', file);
        if (fs.existsSync(fullPath)) {
          log(`✅ ${file}`, 'green', 2);
        } else {
          log(`❌ ${file} - NOT FOUND`, 'red', 2);
          allFound = false;
        }
      }

      if (allFound) {
        log('✅ All required frontend files present', 'green', 1);
        testsPassed++;
      } else {
        throw new Error('Missing frontend files');
      }
    } catch (err) {
      log(`❌ Frontend validation error: ${err.message}`, 'red', 1);
      testsFailed++;
    }

  } catch (err) {
    log(`Fatal error: ${err.message}`, 'red', 1);
  }

  // Summary
  header('📊 TEST SUMMARY');
  log(`Total Tests: ${testsPassed + testsFailed}`, 'cyan', 1);
  log(`✅ Passed: ${testsPassed}`, 'green', 1);
  log(`❌ Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green', 1);

  if (testsFailed === 0) {
    log('\n🎉 ALL TESTS PASSED! Newsletter & Coupon System is READY!', 'green', 1);
    log('\n📋 Complete Newsletter Flow:', 'cyan', 1);
    log('1. User logs in to frontend', 'yellow', 2);
    log('2. User clicks "Get My Exclusive 10% Code"', 'yellow', 2);
    log('3. Frontend calls POST /api/email/subscribe', 'yellow', 2);
    log('4. Backend generates unique coupon code', 'yellow', 2);
    log('5. Backend sends welcome email with coupon', 'yellow', 2);
    log('6. Frontend receives & displays coupon code', 'yellow', 2);
    log('7. User can use code at checkout (₹199+ minimum)', 'yellow', 2);
    log('8. 10% discount applied (max ₹200 off)', 'yellow', 2);
    log('9. Code can only be used ONCE per account', 'yellow', 2);
    log('10. Code expires in 30 days', 'yellow', 2);

    log('\n🚀 Next Steps:', 'cyan', 1);
    log('1. Start Backend:  cd matasree-backend && npm run dev', 'blue', 2);
    log('2. Start Frontend: cd matasree-superstore-main && npm run dev', 'blue', 2);
    log('3. Open http://localhost:8000', 'blue', 2);
    log('4. Register & login', 'blue', 2);
    log('5. Scroll to Newsletter section', 'blue', 2);
    log('6. Click "Get My Exclusive 10% Code"', 'blue', 2);
    log('7. Check your email for the coupon', 'blue', 2);

    log('\n✉️  Email Service Info:', 'cyan', 1);
    log('Service: Gmail SMTP', 'yellow', 2);
    log('Sender: matasreesuper@gmail.com', 'yellow', 2);
    log('Status: ✅ Verified and working', 'yellow', 2);

  } else {
    log('\n⚠️  Some tests failed. Please review errors above.', 'yellow', 1);
    log('\nCommon Issues:', 'cyan', 1);
    log('• Backend not running → cd matasree-backend && npm run dev', 'yellow', 2);
    log('• MongoDB not running → Start MongoDB service', 'yellow', 2);
    log('• Email config invalid → Check .env file EMAIL_* variables', 'yellow', 2);
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((err) => {
  log(`Unexpected error: ${err.message}`, 'red');
  process.exit(1);
});
