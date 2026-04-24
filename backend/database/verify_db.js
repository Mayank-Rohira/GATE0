const db = require('./db');

async function verifyDatabase() {
  console.log('--- Database Verification Starting ---');
  console.log('ℹ️ DNS Preference: IPv4 First');
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
    console.error('❌ DATABASE CONNECTION FAILED! THE SYSTEM IS RUNNING IN AMNESIC FALLBACK MODE.');
    console.error('⚠️ ALL DATA WILL BE LOST ON RESTART. CHECK YOUR DATABASE_URL.');
    console.error(`Reason: ${err.message}`);
    if (err.message.includes('SSL')) {
      console.log('👉 Tip: Check if sslmode=require is set in your DATABASE_URL.');
    }
  }
  console.log('--- Database Verification Finished ---');
}

module.exports = verifyDatabase;
