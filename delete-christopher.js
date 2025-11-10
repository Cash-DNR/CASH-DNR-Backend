// Quick delete of specific user
import pkg from 'pg';
const { Client } = pkg;

const deleteUser = async () => {
  const connectionString = 'postgresql://cash_dnr_user:QKEyLJPdAMKeosylwpHxHnPY05SFSUNl@dpg-d2hhdpruibrs73fb18g0-a.oregon-postgres.render.com/cash_dnr';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to production database\n');
    
    // Delete user with ID 8012094321085 (Christopher White)
    const result = await client.query(
      'DELETE FROM users WHERE id_number = $1 RETURNING id, username, email, first_name, last_name, id_number',
      ['8012094321085']
    );
    
    if (result.rowCount > 0) {
      console.log('🗑️  Deleted User:');
      console.log('═'.repeat(70));
      const user = result.rows[0];
      console.log(`Name: ${user.first_name} ${user.last_name}`);
      console.log(`Email: ${user.email}`);
      console.log(`ID Number: ${user.id_number}`);
      console.log(`Username: ${user.username}`);
      console.log(`UUID: ${user.id}`);
      console.log('═'.repeat(70));
      console.log('✅ User deleted successfully\n');
    } else {
      console.log('ℹ️  No user found with ID number: 8012094321085\n');
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

deleteUser();