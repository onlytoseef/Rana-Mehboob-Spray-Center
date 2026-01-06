require('dotenv').config();
const pool = require('./db');

(async () => {
    try {
        await pool.query("ALTER TABLE import_invoices ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'cash'");
        console.log('✅ Added type column to import_invoices');
    } catch(e) {
        console.log('Error:', e.message);
    } finally {
        pool.end();
    }
})();
