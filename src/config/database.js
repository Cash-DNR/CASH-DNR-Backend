import { Sequelize } from 'sequelize';
import { config } from 'dotenv';

// Load environment variables
config();

// Get current environment with trimming
const environment = (process.env.NODE_ENV || 'development').trim().toLowerCase();
const isDevelopment = environment === 'development';
const isProduction = environment === 'production';

// Function to get database configuration based on environment
const getDatabaseConfig = () => {
  const environment = (process.env.NODE_ENV || 'development').trim().toLowerCase();
  
  if (environment === 'development') {
    return {
      dialect: 'postgres',
      host: process.env.DEV_DB_HOST,
      port: process.env.DEV_DB_PORT,
      database: process.env.DEV_DB_NAME,
      username: process.env.DEV_DB_USER,
      password: process.env.DEV_DB_PASSWORD,
      logging: console.log, // Enable logging in development
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    };
  } else if (isProduction) {
    return {
      dialect: 'postgres',
      host: process.env.PROD_DB_HOST,
      port: process.env.PROD_DB_PORT,
      database: process.env.PROD_DB_NAME,
      username: process.env.PROD_DB_USER,
      password: process.env.PROD_DB_PASSWORD,
      logging: false, // Disable logging in production
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
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
    };
  } else {
    // Throw error if environment is not properly set
    throw new Error(
      `Invalid NODE_ENV: "${environment}". Must be either "development" or "production". ` +
      'Please set NODE_ENV in your environment variables.'
    );
  }
};

// Create Sequelize instance with environment-specific config
export const sequelize = new Sequelize(getDatabaseConfig());

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    const env = process.env.NODE_ENV || 'development';
    const dbName = isDevelopment ? process.env.DEV_DB_NAME : process.env.PROD_DB_NAME;
    console.log(`✅ Database connection established successfully.`);
    console.log(`📊 Environment: ${env.toUpperCase()}`);
    console.log(`🗄️  Database: ${dbName}`);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    console.error('🔧 Check your database credentials in the .env file');
  }
};

// Export for testing
export { testConnection };
