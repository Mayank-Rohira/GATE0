require('dotenv').config();
const { pool } = require('./database/db');

async function verify() {
  console.log('Testing connection to Supabase...');
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful! Current time from DB:', res.rows[0].now);
    
    console.log('Checking required tables...');
    const requiredTables = ['users', 'passes', 'guard_logs'];
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = tablesResult.rows.map(t => t.table_name);
    console.log('Found tables:', existingTables.length > 0 ? existingTables.join(', ') : 'None');

    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length === 0) {
      console.log('✅ All required tables (users, passes, guard_logs) are present.');
    } else {
      console.warn('❌ Missing required tables:', missingTables.join(', '));
      console.log('Please run backend/database/schema.sql to initialize the database.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message);
    if (err.message.includes('ENOTFOUND')) {
      console.error('HINT: This is likely a DNS issue. Try switching to the Connection Pooler URL in .env');
    }
    process.exit(1);
  }
}

verify();

