const pool = require('../db');
require('dotenv').config();

async function addReturnTables() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Creating return tables...\n');

        await client.query(`
            -- Sales Returns Table
            CREATE TABLE IF NOT EXISTS sales_returns (
                id SERIAL PRIMARY KEY,
                return_no VARCHAR(100),
                invoice_id INTEGER REFERENCES sales_invoices(id),
                customer_id INTEGER REFERENCES customers(id),
                total_amount DECIMAL(12, 2) DEFAULT 0.00,
                reason VARCHAR(100),
                refund_type VARCHAR(50) DEFAULT 'credit',
                notes TEXT,
                status VARCHAR(20) DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Sales Return Items Table
            CREATE TABLE IF NOT EXISTS sales_return_items (
                id SERIAL PRIMARY KEY,
                return_id INTEGER REFERENCES sales_returns(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(12, 2) NOT NULL
            );
        `);

        console.log('✅ Return tables created successfully!\n');

        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name LIKE '%return%'
            ORDER BY table_name
        `);

        console.log('📋 Return tables in database:');
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        console.log('\n🎉 Migration complete!');
        
    } catch (err) {
        console.error('❌ Error:', err.message);
        throw err;
    } finally {
        client.release();
        process.exit(0);
    }
}

addReturnTables();
