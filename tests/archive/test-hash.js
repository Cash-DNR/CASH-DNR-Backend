/**
 * Test password hashing directly
 */

import bcrypt from 'bcryptjs';

async function testPasswordHashing() {
  const password = 'TestPassword123!';
  console.log('🔐 Testing password hashing...');
  console.log('Original password:', password);
  
  // Hash with salt rounds 10
  const hash10 = await bcrypt.hash(password, 10);
  console.log('Hash with rounds 10:', hash10);
  console.log('Verify hash 10:', await bcrypt.compare(password, hash10));
  
  // Hash with salt rounds 12  
  const hash12 = await bcrypt.hash(password, 12);
  console.log('Hash with rounds 12:', hash12);
  console.log('Verify hash 12:', await bcrypt.compare(password, hash12));
  
  // Test the stored hash from database
  const storedHash = '$2a$12$irj'; // truncated from debug output
  console.log('\nStored hash starts with:', storedHash);
  console.log('This indicates salt rounds of 12, but we used 10 in code');
  
  // Test if the issue is with double hashing
  const doubleHash = await bcrypt.hash(hash10, 10);
  console.log('\nDouble hash test:', doubleHash);
  console.log('Double hash verify:', await bcrypt.compare(password, doubleHash));
}

testPasswordHashing();
