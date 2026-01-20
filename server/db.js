const { Pool } = require('pg');
require('dotenv').config();
const { getDatabaseConfig, isConfigured } = require('./config');

// Get database configuration
const getDbConfig = () => {
  // First try config file, then fall back to env variables
  if (isConfigured()) {
    const dbConfig = getDatabaseConfig();
    return {
      user: dbConfig.user,
      password: dbConfig.password,
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.name
    };
  }
  
  // Fallback to environment variables
  return {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'spraycenter'
  };
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
    console.log('✅ Connected to PostgreSQL -', getDbConfig().database);
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
