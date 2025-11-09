// Check production database tables
import { Sequelize } from 'sequelize';
import { config } from 'dotenv';

config();

const checkProductionTables = async () => {
  console.log('🔍 Checking production database tables...\n');
  
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
    
    // Check if users table exists and has data
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables in production database:');
    if (tables.length === 0) {
      console.log('   ❌ No tables found! Database needs migration.');
    } else {
      tables.forEach(table => {
        console.log(`   ✅ ${table.table_name}`);
      });
    }
    
    // Check specifically for users table
    if (tables.some(t => t.table_name === 'users')) {
      const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users;');
      console.log(`\n👥 Users table: ${userCount[0].count} records`);
    } else {
      console.log('\n❌ Users table not found - migration needed!');
    }
    
  } catch (error) {
    console.error('❌ Error checking production database:', error.message);
  } finally {
    await sequelize.close();
  }
};

checkProductionTables();