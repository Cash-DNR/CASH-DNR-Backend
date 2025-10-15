/**
 * Phase 1 API Testing Script
 * Tests the core CASH-DNR Phase 1 functionality
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';
let authToken = null;

// Test user credentials
const testUser = {
  idNumber: '9001010000001',
  contactInfo: {
    email: 'test@example.com',
    phone: '+27 82 123 4567'
  },
  homeAddress: {
    streetAddress: '123 Test Street',
    town: 'Test Town',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '8001'
  }
};

/**
 * Test user registration and authentication
 */
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    // Register user
    console.log('📝 Registering test user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
    console.log('✅ User registered successfully:', registerResponse.data.message);
    
    // Login user
    console.log('🔑 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.contactInfo.email,
      password: 'defaultPassword123' // The system generates a default password
    });
    
    authToken = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    return true;
    
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.message?.includes('exists')) {
      console.log('👤 User already exists, trying login...');
      try {
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: testUser.contactInfo.email,
          password: 'defaultPassword123' // The system generates a default password
        });
        authToken = loginResponse.data.token;
        console.log('✅ Login successful');
        return true;
      } catch (loginError) {
        console.error('❌ Login failed:', loginError.response?.data || loginError.message);
        return false;
      }
    } else {
      console.error('❌ Registration failed:', error.response?.data || error.message);
      return false;
    }
  }
}

/**
 * Test cash note registration
 */
async function testCashNoteRegistration() {
  console.log('\n💰 Testing Cash Note Registration...');
  
  if (!authToken) {
    console.error('❌ No auth token available');
    return false;
  }
  
  try {
    const cashNoteData = {
      denomination: 100.00,
      note_type: 'ZAR_100',
      serial_number: 'ZAR100-TEST-001',
      scan_method: 'qr_code',
      qr_code_data: 'QR_ZAR100_TEST_001_2024'
    };
    
    console.log('💵 Registering R100 cash note...');
    const response = await axios.post(
      `${API_BASE}/cash-notes/register`,
      cashNoteData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Cash note registered successfully:');
    console.log(`   Reference: ${response.data.cashNote.reference_code}`);
    console.log(`   Status: ${response.data.cashNote.status}`);
    console.log(`   Owner: ${response.data.cashNote.current_owner_id}`);
    
    return response.data.cashNote;
    
  } catch (error) {
    console.error('❌ Cash note registration failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test cash note scanning
 */
async function testCashNoteScanning(referenceCode) {
  console.log('\n📱 Testing Cash Note Scanning...');
  
  if (!authToken || !referenceCode) {
    console.error('❌ Missing auth token or reference code');
    return false;
  }
  
  try {
    console.log(`🔍 Scanning cash note: ${referenceCode}`);
    const response = await axios.post(
      `${API_BASE}/cash-notes/scan`,
      {
        reference_code: referenceCode,
        scan_method: 'mobile_camera'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Cash note scanned successfully:');
    console.log(`   Status: ${response.data.cashNote.status}`);
    console.log(`   Last scanned: ${response.data.cashNote.updated_at}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Cash note scanning failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Run all Phase 1 tests
 */
async function runPhase1Tests() {
  console.log('🚀 Starting Phase 1 CASH-DNR API Tests');
  console.log('=====================================');
  
  try {
    // Test authentication
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      console.log('❌ Authentication tests failed, stopping...');
      return;
    }
    
    // Test cash note registration
    const cashNote = await testCashNoteRegistration();
    if (!cashNote) {
      console.log('❌ Cash note registration failed, stopping...');
      return;
    }
    
    // Test cash note scanning
    const scanSuccess = await testCashNoteScanning(cashNote.reference_code);
    if (!scanSuccess) {
      console.log('❌ Cash note scanning failed');
    }
    
    console.log('\n🎉 Phase 1 Tests Completed!');
    console.log('============================');
    console.log('✅ Authentication: Working');
    console.log('✅ Cash Note Registration: Working');
    console.log(`✅ Cash Note Scanning: ${scanSuccess ? 'Working' : 'Failed'}`);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run tests
runPhase1Tests();
