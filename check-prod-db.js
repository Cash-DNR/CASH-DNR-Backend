// Check production database schema
import { Sequelize } from 'sequelize';
import { config } from 'dotenv';

config();

const sequelize = new Sequelize(process.env.PROD_DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function checkSchema() {
  try {
    console.log('🔍 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Connected to production database');

    // Check if users table exists and get its schema
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Users table schema:');
    console.table(results);

    // Check if gender column exists
    const hasGender = results.some(col => col.column_name === 'gender');
    console.log(hasGender ? '\n✅ Gender column EXISTS' : '\n❌ Gender column MISSING');

    // Check for any recent users
    const [users] = await sequelize.query(`
      SELECT id, email, first_name, last_name, gender, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    console.log('\n📊 Recent users:');
    console.table(users);

    await sequelize.close();
    console.log('\n✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkSchema();
