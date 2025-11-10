// Check the actual files table structure in production
import pkg from 'pg';
const { Client } = pkg;

const checkFilesTable = async () => {
  const connectionString = 'postgresql://cash_dnr_user:QKEyLJPdAMKeosylwpHxHnPY05SFSUNl@dpg-d2hhdpruibrs73fb18g0-a.oregon-postgres.render.com/cash_dnr';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to production database\n');
    
    // Get columns from files table
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'files'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Files Table Structure:');
    console.log('═'.repeat(70));
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

checkFilesTable();