require('dotenv').config();
const { pool } = require('./database/db');

async function verify() {
  console.log('Testing connection to Supabase...');
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful! Current time from DB:', res.rows[0].now);
    
    console.log('Checking tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tables.rows.length === 0) {
      console.log('No tables found in public schema. You might need to run schema.sql.');
    } else {
      console.log('Found tables:', tables.rows.map(t => t.table_name).join(', '));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
}

verify();
