// Check the actual columns in the users table
import { Sequelize } from 'sequelize';
import { config } from 'dotenv';

config();

const checkUserTableColumns = async () => {
  console.log('🔍 Checking users table columns...\n');
  
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
    
    console.log('📋 Users table columns:');
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'nullable' : 'not null'}`);
    });
    
    // Check specifically for phone-related columns
    const phoneColumns = columns.filter(col => col.column_name.includes('phone'));
    console.log('\n📱 Phone-related columns:');
    if (phoneColumns.length === 0) {
      console.log('   ❌ No phone columns found');
    } else {
      phoneColumns.forEach(col => {
        console.log(`   ✅ ${col.column_name} (${col.data_type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking table columns:', error.message);
  } finally {
    await sequelize.close();
  }
};

checkUserTableColumns();