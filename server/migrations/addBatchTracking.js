const pool = require('../db');

async function addBatchTracking() {
    try {
        console.log('Adding batch tracking system...');

        // Create product_batches table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_batches (
                batch_id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                batch_number VARCHAR(100) NOT NULL,
                expiry_date DATE,
                quantity INTEGER DEFAULT 0,
                import_id INTEGER REFERENCES import_invoices(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(product_id, batch_number)
            );
        `);
        console.log('✅ product_batches table created');

        // Add batch_id to import_items
        const importItemsCheck = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'import_items' AND column_name = 'batch_id'
        `);
        if (importItemsCheck.rows.length === 0) {
            await pool.query(`
                ALTER TABLE import_items 
                ADD COLUMN batch_id INTEGER REFERENCES product_batches(batch_id) ON DELETE SET NULL
            `);
            console.log('✅ batch_id added to import_items');
        }

        // Add batch_id to sales_items
        const saleItemsCheck = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'sales_items' AND column_name = 'batch_id'
        `);
        if (saleItemsCheck.rows.length === 0) {
            await pool.query(`
                ALTER TABLE sales_items 
                ADD COLUMN batch_id INTEGER REFERENCES product_batches(batch_id) ON DELETE SET NULL
            `);
            console.log('✅ batch_id added to sales_items');
        }

        // Add batch_id to return_items
        const returnItemsCheck = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'return_items' AND column_name = 'batch_id'
        `);
        if (returnItemsCheck.rows.length === 0) {
            await pool.query(`
                ALTER TABLE return_items 
                ADD COLUMN batch_id INTEGER REFERENCES product_batches(batch_id) ON DELETE SET NULL
            `);
            console.log('✅ batch_id added to return_items');
        }

        // Create index for faster batch lookups
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_product_batches_product_id ON product_batches(product_id);
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_product_batches_batch_number ON product_batches(batch_number);
        `);
        console.log('✅ Indexes created');

        console.log('✅ Batch tracking system added successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

addBatchTracking();
