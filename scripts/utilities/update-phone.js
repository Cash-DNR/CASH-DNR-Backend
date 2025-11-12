/**
 * Update phone number in database
 */

import { User } from './src/models/index.js';
import { sequelize } from './src/config/database.js';

async function updatePhoneNumber() {
  try {
    await sequelize.authenticate();
    console.log('🔍 Connected to database');
    
    // Find the user
    const user = await User.findOne({
      where: { email: 'testuser.9508055555088@example.com' }
    });
    
    if (user) {
      console.log('📱 Current phone number:', user.phone_number);
      console.log('📱 Current phone (legacy):', user.phone);
      
      // Update the phone number
      // phone_number can be in local format, but phone field requires +27 XX XXX XXXX format
      await user.update({
        phone_number: '0682606328',
        phone: '+27 68 260 6328'  // Convert to required format
      });
      
      console.log('✅ Phone number updated successfully');
      console.log('📱 New phone number:', user.phone_number);
      console.log('📱 New phone (legacy):', user.phone);
    } else {
      console.log('❌ User not found with email: testuser.9508055555088@example.com');
    }
    
    await sequelize.close();
    console.log('🔐 Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updatePhoneNumber();
