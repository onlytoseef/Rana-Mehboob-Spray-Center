// Migration script to create new returns tables
const pool = require('./db');

async function migrateReturns() {
    const client = await pool.connect();
    
    try {
        console.log('Starting returns migration...');
        
        // Drop old tables if exist
        await client.query(`DROP TABLE IF EXISTS sales_return_items CASCADE`);
        await client.query(`DROP TABLE IF EXISTS sales_returns CASCADE`);
        console.log('✅ Dropped old sales_returns tables');
        
        // Create new unified returns table
        await client.query(`
            CREATE TABLE IF NOT EXISTS returns (
                id SERIAL PRIMARY KEY,
                return_no VARCHAR(20) UNIQUE NOT NULL,
                return_type VARCHAR(20) NOT NULL CHECK (return_type IN ('customer', 'supplier')),
                invoice_id INTEGER NOT NULL,
                party_id INTEGER NOT NULL,
                total_amount DECIMAL(12, 2) DEFAULT 0,
                reason VARCHAR(50),
                refund_type VARCHAR(20) DEFAULT 'credit',
                notes TEXT,
                status VARCHAR(20) DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created returns table');
        
        // Create return items table
        await client.query(`
            CREATE TABLE IF NOT EXISTS return_items (
                id SERIAL PRIMARY KEY,
                return_id INTEGER REFERENCES returns(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(12, 2) NOT NULL,
                total_price DECIMAL(12, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created return_items table');
        
        // Create indexes
        await client.query(`CREATE INDEX IF NOT EXISTS idx_returns_type ON returns(return_type)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_returns_party ON returns(party_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_returns_invoice ON returns(invoice_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id)`);
        console.log('✅ Created indexes');
        
        console.log('\n✅ Returns migration completed successfully!');
        
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

migrateReturns();
