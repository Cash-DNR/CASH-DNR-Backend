/**
 * Test script for ID verification using the actual Home Affairs API
 * Tests the live Home Affairs API endpoint to verify citizen ID
 */
import fetch from 'node-fetch';

const BASE_URL = 'https://cash-dnr-api.onrender.com';
const ID_NUMBER = '8203141234089'; // The ID we've been testing

async function testIdVerification() {
  console.log('='.repeat(60));
  console.log('HOME AFFAIRS API VERIFICATION TEST');
  console.log('='.repeat(60));
  console.log(`Testing ID: ${ID_NUMBER}`);
  console.log(`Endpoint: GET ${BASE_URL}/home-affairs/citizens/${ID_NUMBER}`);
  console.log('-'.repeat(60));

  try {
    console.log('📡 Sending request to Home Affairs API...');
    
    const response = await fetch(`${BASE_URL}/home-affairs/citizens/${ID_NUMBER}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CASH-DNR-Backend/1.0.0'
      }
    });

    console.log(`\n📊 Status Code: ${response.status}`);
    console.log(`📊 Status Text: ${response.statusText}`);
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.log('⚠️ Response is not JSON, getting text...');
      data = await response.text();
    }

    console.log('\n📄 Response:');
    if (typeof data === 'object') {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }

    if (response.status === 200 && data.success && data.citizen) {
      console.log('\n' + '='.repeat(60));
      console.log('✅ VERIFICATION SUCCESSFUL');
      console.log('='.repeat(60));
      console.log(`Name: ${data.citizen.fullName}`);
      console.log(`ID Number: ${data.citizen.idNumber}`);
      console.log(`Date of Birth: ${data.citizen.dateOfBirth}`);
      console.log(`Gender: ${data.citizen.gender}`);
    } else if (response.status === 429) {
      console.log('\n' + '='.repeat(60));
      console.log('⚠️ RATE LIMITED');
      console.log('='.repeat(60));
      console.log('The API is rate limiting requests');
      console.log('This is why our registration is failing in production');
    } else if (response.status === 404) {
      console.log('\n' + '='.repeat(60));
      console.log('❓ ID NOT FOUND');
      console.log('='.repeat(60));
      console.log('The ID number was not found in the Home Affairs database');
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('❌ VERIFICATION FAILED');
      console.log('='.repeat(60));
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${data.error || data.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('🚨 REQUEST FAILED');
    console.log('='.repeat(60));
    console.error(`Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test completed at:', new Date().toISOString());
  console.log('='.repeat(60));
}

// Run the test
testIdVerification();