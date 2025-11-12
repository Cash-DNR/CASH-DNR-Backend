// Delete users from production database
import pkg from 'pg';
const { Client } = pkg;
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const deleteUsers = async () => {
  console.log('═'.repeat(70));
  console.log('🗑️  DELETE USERS FROM PRODUCTION DATABASE');
  console.log('═'.repeat(70));
  console.log('\n⚠️  WARNING: This will delete users from the PRODUCTION database!');
  console.log('Database: cash_dnr (Render.com)\n');

  const connectionString = 'postgresql://cash_dnr_user:QKEyLJPdAMKeosylwpHxHnPY05SFSUNl@dpg-d2hhdpruibrs73fb18g0-a.oregon-postgres.render.com/cash_dnr';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to production database\n');

    // Show deletion options
    console.log('DELETE OPTIONS:');
    console.log('─'.repeat(70));
    console.log('1. Delete ALL test users (emails containing "test", "debug", "fixed", etc.)');
    console.log('2. Delete user by EMAIL');
    console.log('3. Delete user by ID NUMBER');
    console.log('4. Delete user by USER ID (UUID)');
    console.log('5. Delete ALL users (⚠️  DANGEROUS!)');
    console.log('6. List all users (view only)');
    console.log('0. Cancel/Exit\n');

    const choice = await question('Enter your choice (0-6): ');

    switch (choice.trim()) {
      case '1':
        // Delete all test users
        console.log('\n🔍 Finding test users...');
        const testQuery = `
          SELECT id, email, first_name, last_name, id_number, created_at 
          FROM users 
          WHERE email LIKE '%test%' OR email LIKE '%debug%' OR email LIKE '%fixed%' 
             OR email LIKE '%fresh%' OR email LIKE '%working%' OR email LIKE '%michelle%'
          ORDER BY created_at DESC
        `;
        
        const testResult = await client.query(testQuery);
        
        if (testResult.rows.length > 0) {
          console.log(`\nFound ${testResult.rows.length} test user(s):\n`);
          testResult.rows.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (${user.first_name} ${user.last_name}) - ID: ${user.id_number}`);
          });
          
          const confirm = await question(`\n⚠️  Delete these ${testResult.rows.length} users? (yes/no): `);
          if (confirm.toLowerCase() === 'yes') {
            const deleteQuery = `
              DELETE FROM users 
              WHERE email LIKE '%test%' OR email LIKE '%debug%' OR email LIKE '%fixed%' 
                 OR email LIKE '%fresh%' OR email LIKE '%working%' OR email LIKE '%michelle%'
              RETURNING id, email
            `;
            const deleteResult = await client.query(deleteQuery);
            console.log(`\n✅ Deleted ${deleteResult.rowCount} user(s)\n`);
            deleteResult.rows.forEach(user => {
              console.log(`   ✓ Deleted: ${user.email}`);
            });
          } else {
            console.log('\n❌ Deletion cancelled');
          }
        } else {
          console.log('\nℹ️  No test users found');
        }
        break;

      case '2':
        // Delete by email
        const email = await question('\nEnter email to delete: ');
        const emailCheckQuery = 'SELECT id, email, first_name, last_name FROM users WHERE email = $1';
        const emailCheck = await client.query(emailCheckQuery, [email]);
        
        if (emailCheck.rows.length > 0) {
          const user = emailCheck.rows[0];
          console.log(`\n📋 User found:`);
          console.log(`   Name: ${user.first_name} ${user.last_name}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   ID: ${user.id}`);
          
          const confirmEmail = await question('\n⚠️  Delete this user? (yes/no): ');
          if (confirmEmail.toLowerCase() === 'yes') {
            const deleteEmailQuery = 'DELETE FROM users WHERE email = $1 RETURNING email';
            await client.query(deleteEmailQuery, [email]);
            console.log(`\n✅ Deleted user: ${email}`);
          } else {
            console.log('\n❌ Deletion cancelled');
          }
        } else {
          console.log(`\n❌ No user found with email: ${email}`);
        }
        break;

      case '3':
        // Delete by ID number
        const idNumber = await question('\nEnter ID number to delete: ');
        const idCheckQuery = 'SELECT id, email, first_name, last_name, id_number FROM users WHERE id_number = $1';
        const idCheck = await client.query(idCheckQuery, [idNumber]);
        
        if (idCheck.rows.length > 0) {
          const user = idCheck.rows[0];
          console.log(`\n📋 User found:`);
          console.log(`   Name: ${user.first_name} ${user.last_name}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   ID Number: ${user.id_number}`);
          
          const confirmId = await question('\n⚠️  Delete this user? (yes/no): ');
          if (confirmId.toLowerCase() === 'yes') {
            const deleteIdQuery = 'DELETE FROM users WHERE id_number = $1 RETURNING email';
            await client.query(deleteIdQuery, [idNumber]);
            console.log(`\n✅ Deleted user with ID: ${idNumber}`);
          } else {
            console.log('\n❌ Deletion cancelled');
          }
        } else {
          console.log(`\n❌ No user found with ID number: ${idNumber}`);
        }
        break;

      case '4':
        // Delete by UUID
        const userId = await question('\nEnter User ID (UUID) to delete: ');
        const uuidCheckQuery = 'SELECT id, email, first_name, last_name FROM users WHERE id = $1';
        const uuidCheck = await client.query(uuidCheckQuery, [userId]);
        
        if (uuidCheck.rows.length > 0) {
          const user = uuidCheck.rows[0];
          console.log(`\n📋 User found:`);
          console.log(`   Name: ${user.first_name} ${user.last_name}`);
          console.log(`   Email: ${user.email}`);
          
          const confirmUuid = await question('\n⚠️  Delete this user? (yes/no): ');
          if (confirmUuid.toLowerCase() === 'yes') {
            const deleteUuidQuery = 'DELETE FROM users WHERE id = $1 RETURNING email';
            await client.query(deleteUuidQuery, [userId]);
            console.log(`\n✅ Deleted user: ${user.email}`);
          } else {
            console.log('\n❌ Deletion cancelled');
          }
        } else {
          console.log(`\n❌ No user found with ID: ${userId}`);
        }
        break;

      case '5':
        // Delete ALL users
        console.log('\n⚠️⚠️⚠️  DANGER: DELETE ALL USERS ⚠️⚠️⚠️');
        const countQuery = 'SELECT COUNT(*) FROM users';
        const countResult = await client.query(countQuery);
        const totalUsers = countResult.rows[0].count;
        
        console.log(`\nThis will delete ALL ${totalUsers} users from the production database!`);
        const confirmAll = await question('Type "DELETE ALL USERS" to confirm: ');
        
        if (confirmAll === 'DELETE ALL USERS') {
          const deleteAllQuery = 'DELETE FROM users RETURNING email';
          const deleteAllResult = await client.query(deleteAllQuery);
          console.log(`\n✅ Deleted ALL ${deleteAllResult.rowCount} users from production`);
        } else {
          console.log('\n❌ Deletion cancelled (confirmation text did not match)');
        }
        break;

      case '6':
        // List all users
        console.log('\n📋 ALL USERS IN PRODUCTION:');
        console.log('─'.repeat(70));
        const listQuery = 'SELECT id, email, first_name, last_name, id_number, created_at FROM users ORDER BY created_at DESC';
        const listResult = await client.query(listQuery);
        
        if (listResult.rows.length > 0) {
          console.log(`\nTotal users: ${listResult.rows.length}\n`);
          listResult.rows.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   Name: ${user.first_name} ${user.last_name}`);
            console.log(`   ID Number: ${user.id_number || 'N/A'}`);
            console.log(`   User ID: ${user.id}`);
            console.log(`   Created: ${user.created_at}`);
            console.log('');
          });
        } else {
          console.log('\nℹ️  No users in database');
        }
        break;

      case '0':
        console.log('\n✅ Cancelled - No changes made');
        break;

      default:
        console.log('\n❌ Invalid choice');
        break;
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await client.end();
    rl.close();
    console.log('\n✅ Database connection closed');
  }
};

deleteUsers();