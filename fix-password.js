/**
 * Fix existing user's password
 */

import User from './src/models/User.js';

async function fixUserPassword() {
  try {
    const user = await User.findOne({ 
      where: { email: 'testuser.9508055555088@example.com' }
    });
    
    if (user) {
      console.log('🔍 Found user:', user.email);
      console.log('Current password hash:', user.password_hash?.substring(0, 20) + '...');
      
      // Update the user with plain password (let model hooks handle hashing)
      await user.update({
        password_hash: 'TestPassword123!' // Plain password, hooks will hash it
      });
      
      console.log('✅ Password updated successfully');
      
      // Verify the fix by reloading user
      await user.reload();
      console.log('New password hash:', user.password_hash?.substring(0, 20) + '...');
      
    } else {
      console.log('❌ User not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixUserPassword();
