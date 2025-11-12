// Quick production database connection test
import { Sequelize } from 'sequelize';
import { config } from 'dotenv';

config();

const testProductionDatabase = async () => {
  console.log('🔍 Testing production database connection...\n');
  
  // Get production database config from .env
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

  console.log('📊 Production Database Configuration:');
  console.log(`   Host: ${prodConfig.host}`);
  console.log(`   Port: ${prodConfig.port}`);
  console.log(`   Database: ${prodConfig.database}`);
  console.log(`   Username: ${prodConfig.username}`);
  console.log(`   Password: ${'*'.repeat(prodConfig.password?.length || 0)}\n`);

  const sequelize = new Sequelize(prodConfig);

  try {
    console.log('🔌 Attempting connection...');
    await sequelize.authenticate();
    console.log('✅ Production database connection successful!');
    console.log('🎉 Your database is ready for production use.\n');
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT NOW() as current_time;');
    console.log('⏰ Database time:', results[0].current_time);
    
  } catch (error) {
    console.error('❌ Production database connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.parent?.code || 'Unknown'}\n`);
    
    if (error.parent?.code === 'ECONNREFUSED') {
      console.log('💡 Possible issues:');
      console.log('   - Database server is not running');
      console.log('   - Host/port is incorrect');
      console.log('   - Network connectivity issues');
    } else if (error.parent?.code === 'ENOTFOUND') {
      console.log('💡 Possible issues:');
      console.log('   - Database host URL is incorrect');
      console.log('   - DNS resolution failed');
    } else if (error.message.includes('authentication')) {
      console.log('💡 Possible issues:');
      console.log('   - Username or password is incorrect');
      console.log('   - Database user permissions');
    }
  } finally {
    await sequelize.close();
  }
};

testProductionDatabase();