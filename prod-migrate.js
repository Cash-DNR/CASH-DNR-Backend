/**
 * Simple Production Migration
 * Direct approach to migrate to production
 */

// Set environment to production
process.env.NODE_ENV = 'production';

console.log('🚀 CASH-DNR Production Migration Starting...');
console.log('===========================================');

try {
  // Import and run migration
  const { up } = await import('./src/migrations/20241217_002_phase1_foundational_operations.js');
  
  console.log('📊 Environment: PRODUCTION');
  console.log('🗄️  Target Database: cash_dnr (Cloud PostgreSQL)');
  console.log('');
  console.log('🚀 Executing Phase 1 migration...');
  
  await up();
  
  console.log('');
  console.log('🎉 Production Migration Completed Successfully!');
  console.log('✅ Phase 1 foundational operations deployed to production');
  
} catch (error) {
  console.error('❌ Production migration failed:', error.message);
  process.exit(1);
}
