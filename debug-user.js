/**
 * Debug user password storage
 */

import User from './src/models/User.js';
import bcrypt from 'bcryptjs';

async function debugUser() {
  try {
    const user = await User.findOne({ 
      where: { email: 'testuser.9508055555088@example.com' }
    });
    
    if (user) {
      console.log('🔍 User found:');
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  ID Number:', user.id_number);
      console.log('  Password Hash Length:', user.password_hash?.length);
      console.log('  Password Hash Starts With:', user.password_hash?.substring(0, 10));
      
      // Test password comparison
      const testPassword = 'TestPassword123!';
      console.log('\n🔐 Testing password comparison:');
      console.log('  Test Password:', testPassword);
      
      if (user.password_hash) {
        const isMatch = await bcrypt.compare(testPassword, user.password_hash);
        console.log('  Password Match:', isMatch);
        
        // Test with a freshly hashed version
        const freshHash = await bcrypt.hash(testPassword, 10);
        const freshMatch = await bcrypt.compare(testPassword, freshHash);
        console.log('  Fresh Hash Match (control):', freshMatch);
      } else {
        console.log('  ❌ No password hash stored!');
      }
    } else {
      console.log('❌ User not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugUser();
