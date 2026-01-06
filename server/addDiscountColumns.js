// Add discount columns to sales_invoices table
const pool = require('./db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Adding discount columns to sales_invoices table...');
        
        // Add discount_percent column if not exists
        await client.query(`
            ALTER TABLE sales_invoices 
            ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5, 2) DEFAULT 0
        `);
        
        // Add discount_amount column if not exists
        await client.query(`
            ALTER TABLE sales_invoices 
            ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12, 2) DEFAULT 0
        `);
        
        console.log('Discount columns added successfully!');
        
    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
