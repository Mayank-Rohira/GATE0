const { Pool } = require('pg');

const net = require('net');

const dbUrl = (process.env.DATABASE_URL || '').trim();

if (!dbUrl) {
  console.error('❌ CRITICAL: DATABASE_URL is missing in environment variables.');
} else {
  try {
    const host = new URL(dbUrl).hostname;
    console.log(`ℹ️ Database Connection: Connecting to ${host.substring(0, 5)}...`);
  } catch (e) {
    console.log('ℹ️ Database Connection: Using custom connection string');
  }
}

const dbConfig = {
  connectionString: dbUrl,
  // Recommended for use with Supabase Transaction Pooler
  max: 10
};

// Enable SSL for cloud-to-cloud connections (primarily for Render -> Supabase)
if (dbUrl && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
  dbConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(dbConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper for queries
const query = (text, params) => pool.query(text, params);

// Helper for transactions
const getClient = () => pool.connect();

module.exports = {
  query,
  getClient,
  pool
};
