// Delete ALL users from database
import { sequelize } from '../../src/config/database.js';
import User from '../../src/models/User.js';
import File from '../../src/models/File.js';

const deleteAllUsers = async () => {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get all users
    console.log('\n🔍 Finding all users...');
    const allUsers = await User.findAll({
      attributes: ['id', 'email', 'first_name', 'last_name', 'id_number']
    });

    console.log(`📊 Found ${allUsers.length} total user(s)`);

    if (allUsers.length === 0) {
      console.log('✅ No users found in database');
      return;
    }

    // Delete files for all users first
    console.log('\n🗑️ Deleting all user files...');
    const filesDeleted = await File.destroy({
      where: {},
      force: true // Hard delete
    });
    console.log(`🗑️ Deleted ${filesDeleted} file record(s)`);

    // List users before deletion
    console.log('\n👥 Users to be deleted:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.first_name} ${user.last_name}) - ID: ${user.id_number}`);
    });

    // Delete all users
    console.log('\n🗑️ Deleting all users...');
    const usersDeleted = await User.destroy({
      where: {},
      force: true // Hard delete
    });

    console.log(`✅ Successfully deleted ${usersDeleted} user(s)`);
    console.log('✅ Database cleanup complete');

  } catch (error) {
    console.error('❌ Error deleting users:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
};

deleteAllUsers();