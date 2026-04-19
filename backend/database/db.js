const { Pool } = require('pg');

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  // Force IPv4 to avoid ENETUNREACH errors on ipv6 resolution (common on Render)
  family: 4
};

// Enable SSL for cloud-to-cloud connections (primarily for Render -> Supabase)
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')) {
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
