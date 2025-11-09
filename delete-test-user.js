// Delete test users from database
import { sequelize } from './src/config/database.js';
import User from './src/models/User.js';
import File from './src/models/File.js';

const deleteTestUsers = async () => {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Delete users with the test ID number
    const idNumber = '8012094321085';
    
    console.log(`\n🔍 Looking for users with ID number: ${idNumber}`);
    
    const users = await User.findAll({
      where: { id_number: idNumber }
    });

    console.log(`📊 Found ${users.length} user(s) with this ID number`);

    if (users.length === 0) {
      console.log('✅ No test users to delete');
      process.exit(0);
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
    }

    console.log(`\n✅ Successfully deleted ${users.length} test user(s)`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error deleting test users:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

deleteTestUsers();
