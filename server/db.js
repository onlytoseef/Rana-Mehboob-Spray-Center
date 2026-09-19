const { Pool } = require('pg');
require('dotenv').config();

const getDbConfig = () => {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  return { connectionString };
};

// Create pool with config
let pool = new Pool(getDbConfig());

// Function to recreate pool (used after config changes)
const recreatePool = () => {
  pool.end().catch(() => {}); // Close old pool
  pool = new Pool(getDbConfig());
  return pool;
};

// Test connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL using DATABASE_URL');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    return false;
  }
};

// Initial connection test
testConnection();

// Export pool and helper functions
module.exports = pool;
module.exports.getPool = () => pool;
module.exports.recreatePool = recreatePool;
module.exports.testConnection = testConnection;
