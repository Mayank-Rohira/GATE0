const db = require('./db');

async function verifyDatabase() {
  console.log('--- Database Verification Starting ---');
  try {
    // 1. Check basic connectivity
    await db.query('SELECT 1');
    console.log('✅ Connection to PostgreSQL successful.');

    // 2. Check if users table exists
    const usersTable = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (usersTable.rows[0].exists) {
      console.log('✅ Tables: "users" table found.');
      
      // 3. Check for specific columns to ensure schema integrity
      const columns = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users';
      `);
      const colNames = columns.rows.map(c => c.column_name);
      console.log(`✅ Schema: Found users columns: ${colNames.join(', ')}`);
    } else {
      console.error('❌ Error: "users" table NOT FOUND in database.');
      console.log('👉 Please ensure you have run the schema.sql in your Supabase SQL Editor.');
    }
  } catch (err) {
    console.error('❌ Database connection failed!');
    console.error(`Reason: ${err.message}`);
    if (err.message.includes('SSL')) {
      console.log('👉 Tip: Check if sslmode=require is set in your DATABASE_URL.');
    }
  }
  console.log('--- Database Verification Finished ---');
}

module.exports = verifyDatabase;
