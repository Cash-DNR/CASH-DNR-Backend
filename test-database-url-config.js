// Test DATABASE_URL configuration locally
import { config } from 'dotenv';
import { Sequelize } from 'sequelize';

config();

const testDatabaseURL = async () => {
  console.log('🔍 Testing DATABASE_URL configuration...\n');
  
  // Use the DATABASE_URL from your .env file
  const databaseUrl = process.env.PROD_DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ PROD_DATABASE_URL not found in .env file');
    return;
  }
  
  console.log('📊 Testing with DATABASE_URL...');
  console.log(`URL: ${databaseUrl.substring(0, 50)}...`);
  
  try {
    // Create Sequelize instance with DATABASE_URL (same as production will use)
    const sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false,
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    });
    
    console.log('🔌 Attempting connection...');
    await sequelize.authenticate();
    console.log('✅ DATABASE_URL connection successful!');
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT NOW() as current_time;');
    console.log('⏰ Database time:', results[0].current_time);
    
    await sequelize.close();
    console.log('\n🎉 DATABASE_URL configuration is working correctly!');
    console.log('💡 This means the issue is with environment variables on Render.com');
    
  } catch (error) {
    console.error('❌ DATABASE_URL connection failed:', error.message);
    console.error('🔧 This suggests an issue with the DATABASE_URL format or database access');
  }
};

testDatabaseURL();