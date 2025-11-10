// Check the actual enum values for file_type in production
import pkg from 'pg';
const { Client } = pkg;

const checkFileTypeEnum = async () => {
  const connectionString = 'postgresql://cash_dnr_user:QKEyLJPdAMKeosylwpHxHnPY05SFSUNl@dpg-d2hhdpruibrs73fb18g0-a.oregon-postgres.render.com/cash_dnr';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to production database\n');
    
    // Get enum values for file_type
    const result = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'enum_files_file_type'
      )
      ORDER BY enumsortorder;
    `);
    
    console.log('📋 file_type ENUM values in production:');
    console.log('═'.repeat(70));
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. "${row.enumlabel}"`);
    });
    
    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

checkFileTypeEnum();