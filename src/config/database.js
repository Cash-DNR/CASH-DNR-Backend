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

  // In production, prioritize DATABASE_URL if available
  if (environment === 'production' && process.env.DATABASE_URL) {
    return {
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
        min: 0,
        acquire: 60000, // Increased timeout
        idle: 10000
      },
      define: {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    };
  }

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
  } else if (environment === 'production') {
    // Fallback to individual environment variables if DATABASE_URL not available
    if (!process.env.PROD_DB_HOST && !process.env.DATABASE_URL) {
      console.warn('⚠️ Production database not configured. Set DATABASE_URL or individual PROD_DB_* variables.');
      // Return a minimal config that won't crash
      return {
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'dummy',
        username: 'dummy',
        password: 'dummy',
        logging: false,
        pool: { max: 1, min: 0, acquire: 30000, idle: 10000 }
      };
    }

    return {
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
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 60000, // Increased timeout
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
let sequelize;

try {
  if (isProduction && process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
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
        min: 0,
        acquire: 60000,
        idle: 10000
      },
      define: {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    });
  } else {
    sequelize = new Sequelize(getDatabaseConfig());
  }
} catch (error) {
  console.error('❌ Error creating Sequelize instance:', error.message);
  // Create a dummy instance to prevent crashes
  sequelize = new Sequelize('sqlite::memory:');
}

export { sequelize };

// Test the connection
const testConnection = async() => {
  try {
    await sequelize.authenticate();
    const env = process.env.NODE_ENV || 'development';
    const dbName = isDevelopment ? process.env.DEV_DB_NAME : process.env.PROD_DB_NAME;
    console.log('✅ Database connection established successfully.');
    console.log(`📊 Environment: ${env.toUpperCase()}`);
    console.log(`🗄️  Database: ${dbName}`);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    console.error('🔧 Check your database credentials in the .env file');
  }
};

// Export for testing
export { testConnection };
