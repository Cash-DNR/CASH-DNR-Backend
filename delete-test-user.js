// Delete test users from database
import { sequelize } from './src/config/database.js';
import User from './src/models/User.js';
import File from './src/models/File.js';

// Test ID numbers to look for and delete
const testIdNumbers = [
  '8012094321085', // Christopher White
  '8203141234089'  // Michelle White
];

const deleteTestUsers = async () => {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    let totalDeleted = 0;

    for (const idNumber of testIdNumbers) {
      console.log(`\n🔍 Looking for users with ID number: ${idNumber}`);
      
      const users = await User.findAll({
        where: { id_number: idNumber }
      });

      console.log(`📊 Found ${users.length} user(s) with this ID number`);

      if (users.length === 0) {
        console.log(`✅ No users found for ID: ${idNumber}`);
        continue;
      }

      // Delete files associated with these users first
      for (const user of users) {
        console.log(`\n📧 User: ${user.email} (ID: ${user.id})`);
        
        // Delete associated files
        const deletedFiles = await File.destroy({
          where: { user_id: user.id }
        });
        console.log(`  🗑️  Deleted ${deletedFiles} file(s)`);
        
        // Delete user
        await user.destroy();
        console.log(`  ✅ User deleted`);
        totalDeleted++;
      }
    }

    console.log(`\n✅ Successfully deleted ${totalDeleted} test user(s) across all ID numbers`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error deleting test users:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

deleteTestUsers();
