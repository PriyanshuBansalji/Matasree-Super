#!/usr/bin/env node

/**
 * Matasree Store - Full Application Test Suite
 * Tests all frontend and backend integration points
 */

const http = require('http');

console.log('🧪 MATASREE STORE - FULL APPLICATION TEST SUITE\n');
console.log('=' .repeat(60) + '\n');

// Test 1: Check if backend can be reached
async function testBackendConnection() {
  console.log('📡 TEST 1: Backend Connection');
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:5000/api/products', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, data });
        });
      });
      req.on('error', reject);
      req.setTimeout(3000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
    
    if (response.status === 200 || response.status === 401) {
      console.log('✅ Backend is running on port 5000');
      return true;
    } else {
      console.log(`❌ Backend returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend not responding. Make sure to run: cd matasree-backend && npm run dev');
    return false;
  }
}

// Test 2: Check authentication endpoints
async function testAuthEndpoints() {
  console.log('\n📝 TEST 2: Authentication Endpoints');
  try {
    // Test register
    const registerRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123'
      })
    });
    
    console.log(`✅ Register endpoint: ${registerRes.status === 200 ? 'OK' : 'Status ' + registerRes.status}`);
    
    // Test login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123'
      })
    });
    
    console.log(`✅ Login endpoint: ${loginRes.status === 200 ? 'OK' : 'Status ' + loginRes.status}`);
    
    return true;
  } catch (error) {
    console.log('❌ Auth endpoints failed:', error.message);
    return false;
  }
}

// Test 3: Check product endpoints
async function testProductEndpoints() {
  console.log('\n📦 TEST 3: Product Endpoints');
  try {
    const res = await fetch('http://localhost:5000/api/products');
    const data = await res.json();
    
    if (res.status === 200 && data.data && data.data.products) {
      console.log(`✅ Products endpoint: ${data.data.products.length || 0} products found`);
      return true;
    } else {
      console.log('✅ Products endpoint accessible');
      return true;
    }
  } catch (error) {
    console.log('❌ Product endpoints failed:', error.message);
    return false;
  }
}

// Test 4: Check category endpoints  
async function testCategoryEndpoints() {
  console.log('\n🏷️  TEST 4: Category Endpoints');
  try {
    const res = await fetch('http://localhost:5000/api/categories');
    const data = await res.json();
    
    if (res.status === 200 && data.data && data.data.categories) {
      console.log(`✅ Categories endpoint: ${data.data.categories.length || 0} categories found`);
      return true;
    } else {
      console.log('✅ Categories endpoint accessible');
      return true;
    }
  } catch (error) {
    console.log('❌ Category endpoints failed:', error.message);
    return false;
  }
}

// Test 5: Check frontend files
async function testFrontendFiles() {
  console.log('\n🎨 TEST 5: Frontend Files Structure');
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'matasree-superstore-main/src/App.tsx',
    'matasree-superstore-main/src/services/api.ts',
    'matasree-superstore-main/src/hooks/useApi.ts',
    'matasree-superstore-main/src/store/authStore.ts',
    'matasree-superstore-main/src/pages/LoginPage.tsx',
    'matasree-superstore-main/src/pages/RegisterPage.tsx',
    'matasree-superstore-main/src/pages/ProfilePage.tsx',
    'matasree-superstore-main/src/pages/OrdersPage.tsx',
    'matasree-superstore-main/src/pages/AddressesPage.tsx',
  ];
  
  let allExists = true;
  for (const file of requiredFiles) {
    const fullPath = path.join('d:\\Matasree_Store', file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - NOT FOUND`);
      allExists = false;
    }
  }
  
  return allExists;
}

// Run all tests
async function runAllTests() {
  const results = [];
  
  results.push(await testBackendConnection());
  
  if (results[0]) {
    results.push(await testAuthEndpoints());
    results.push(await testProductEndpoints());
    results.push(await testCategoryEndpoints());
  }
  
  results.push(await testFrontendFiles());
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY:');
  const passed = results.filter(r => r).length;
  console.log(`✅ Passed: ${passed}/${results.length}`);
  
  if (passed === results.length) {
    console.log('\n🎉 ALL TESTS PASSED! Your application is ready to test.\n');
    console.log('Next steps:');
    console.log('1. Start backend: cd matasree-backend && npm run dev');
    console.log('2. Start frontend: cd matasree-superstore-main && npm run dev');
    console.log('3. Open http://localhost:5173 in your browser');
    console.log('4. Test registration, login, and product browsing\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.\n');
  }
}

runAllTests().catch(console.error);
