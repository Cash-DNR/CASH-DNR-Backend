// Check the actual columns in the production users table
import { Sequelize } from 'sequelize';
import { config } from 'dotenv';

config();

const checkUserTableColumns = async () => {
  console.log('🔍 Checking production users table columns...\n');
  
  const prodConfig = {
    dialect: 'postgres',
    host: process.env.PROD_DB_HOST,
    port: process.env.PROD_DB_PORT,
    database: process.env.PROD_DB_NAME,
    username: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASSWORD,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  };

  const sequelize = new Sequelize(prodConfig);

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to production database\n');
    
    // Check the actual columns in the users table
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Production users table columns:');
    console.log('=' .repeat(80));
    columns.forEach((col, index) => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` (default: ${col.column_default})` : '';
      console.log(`${(index + 1).toString().padStart(2)}. ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | ${nullable}${defaultVal}`);
    });
    
    // Check specifically for phone-related columns
    const phoneColumns = columns.filter(col => col.column_name.toLowerCase().includes('phone'));
    console.log('\n📱 Phone-related columns:');
    if (phoneColumns.length === 0) {
      console.log('   ❌ No phone columns found');
    } else {
      phoneColumns.forEach(col => {
        console.log(`   ✅ ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'nullable' : 'not null'}`);
      });
    }
    
    // Check for address-related columns
    const addressColumns = columns.filter(col => col.column_name.toLowerCase().includes('address'));
    console.log('\n🏠 Address-related columns:');
    if (addressColumns.length === 0) {
      console.log('   ❌ No address columns found');
    } else {
      addressColumns.forEach(col => {
        console.log(`   ✅ ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'nullable' : 'not null'}`);
      });
    }
    
    // Check for any JSONB columns
    const jsonbColumns = columns.filter(col => col.data_type.toLowerCase().includes('jsonb'));
    console.log('\n🔧 JSONB columns:');
    if (jsonbColumns.length === 0) {
      console.log('   ❌ No JSONB columns found');
    } else {
      jsonbColumns.forEach(col => {
        console.log(`   ✅ ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'nullable' : 'not null'}`);
      });
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log(`📊 Total columns: ${columns.length}`);
    
  } catch (error) {
    console.error('❌ Error checking table columns:', error.message);
  } finally {
    await sequelize.close();
  }
};

checkUserTableColumns();