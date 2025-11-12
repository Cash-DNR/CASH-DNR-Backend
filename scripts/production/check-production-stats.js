// Check production user statistics
import pkg from 'pg';
const { Client } = pkg;

const checkProductionUsers = async () => {
  const connectionString = 'postgresql://cash_dnr_user:QKEyLJPdAMKeosylwpHxHnPY05SFSUNl@dpg-d2hhdpruibrs73fb18g0-a.oregon-postgres.render.com/cash_dnr';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to production database\n');
    console.log('═'.repeat(70));
    console.log('📊 PRODUCTION USER STATISTICS');
    console.log('═'.repeat(70));
    
    // Total users
    const totalResult = await client.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(totalResult.rows[0].count);
    console.log(`\n📈 Total Users: ${totalUsers}`);
    
    // Users by verification status
    const verifiedResult = await client.query(`
      SELECT 
        home_affairs_verified,
        is_verified,
        is_active,
        COUNT(*) as count
      FROM users
      GROUP BY home_affairs_verified, is_verified, is_active
      ORDER BY count DESC
    `);
    
    console.log('\n📋 Users by Status:');
    console.log('─'.repeat(70));
    verifiedResult.rows.forEach(row => {
      console.log(`  Home Affairs: ${row.home_affairs_verified ? '✓' : '✗'} | Verified: ${row.is_verified ? '✓' : '✗'} | Active: ${row.is_active ? '✓' : '✗'} → ${row.count} users`);
    });
    
    // Users by gender
    const genderResult = await client.query(`
      SELECT gender, COUNT(*) as count
      FROM users
      WHERE gender IS NOT NULL
      GROUP BY gender
      ORDER BY count DESC
    `);
    
    if (genderResult.rows.length > 0) {
      console.log('\n👥 Users by Gender:');
      console.log('─'.repeat(70));
      genderResult.rows.forEach(row => {
        const genderLabel = row.gender === 'M' ? 'Male' : row.gender === 'F' ? 'Female' : 'Other';
        console.log(`  ${genderLabel}: ${row.count}`);
      });
    }
    
    // Recent registrations
    const recentResult = await client.query(`
      SELECT 
        id,
        username,
        email,
        first_name,
        last_name,
        id_number,
        home_affairs_verified,
        is_verified,
        is_active,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('\n🕐 Recent Registrations (Last 10):');
    console.log('─'.repeat(70));
    recentResult.rows.forEach((user, index) => {
      const date = new Date(user.created_at).toLocaleString();
      console.log(`\n${index + 1}. ${user.first_name} ${user.last_name} (${user.username})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID Number: ${user.id_number}`);
      console.log(`   Status: HA:${user.home_affairs_verified ? '✓' : '✗'} | Verified:${user.is_verified ? '✓' : '✗'} | Active:${user.is_active ? '✓' : '✗'}`);
      console.log(`   Registered: ${date}`);
    });
    
    // Files statistics
    const filesResult = await client.query(`
      SELECT 
        file_type,
        COUNT(*) as count,
        SUM(file_size)::BIGINT as total_size
      FROM files
      GROUP BY file_type
      ORDER BY count DESC
    `);
    
    if (filesResult.rows.length > 0) {
      console.log('\n📎 Uploaded Files by Type:');
      console.log('─'.repeat(70));
      let totalFiles = 0;
      let totalSize = 0;
      filesResult.rows.forEach(row => {
        const sizeMB = (row.total_size / 1024 / 1024).toFixed(2);
        console.log(`  ${row.file_type}: ${row.count} files (${sizeMB} MB)`);
        totalFiles += parseInt(row.count);
        totalSize += parseInt(row.total_size);
      });
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
      console.log(`  ${'─'.repeat(50)}`);
      console.log(`  Total: ${totalFiles} files (${totalSizeMB} MB)`);
    }
    
    // Users with files
    const usersWithFilesResult = await client.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM files
    `);
    const usersWithFiles = parseInt(usersWithFilesResult.rows[0].count);
    
    console.log('\n📊 File Upload Statistics:');
    console.log('─'.repeat(70));
    console.log(`  Users with uploaded files: ${usersWithFiles} (${((usersWithFiles/totalUsers)*100).toFixed(1)}%)`);
    console.log(`  Users without files: ${totalUsers - usersWithFiles} (${(((totalUsers-usersWithFiles)/totalUsers)*100).toFixed(1)}%)`);
    
    console.log('\n' + '═'.repeat(70));
    console.log('✅ Production database check complete');
    console.log('═'.repeat(70) + '\n');
    
    await client.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
};

checkProductionUsers();