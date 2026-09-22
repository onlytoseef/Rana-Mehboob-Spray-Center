// Script to setup Supabase database tables
const pool = require('./db');

const setupDatabase = async () => {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Starting database setup...\n');

        // Users Table
        console.log('Creating users table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await client.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin'
        `);
        console.log('✅ users table created');

        // Categories Table
        console.log('Creating categories table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ categories table created');

        // Products Table
        console.log('Creating products table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                unit VARCHAR(50),
                opening_stock INTEGER DEFAULT 0,
                opening_cost DECIMAL(10, 2) DEFAULT 0.00,
                current_stock INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ products table created');

        // Suppliers Table
        console.log('Creating suppliers table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                city VARCHAR(100),
                address TEXT,
                currency VARCHAR(10) DEFAULT 'PKR',
                ledger_balance DECIMAL(12, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ suppliers table created');

        // Customers Table
        console.log('Creating customers table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                city VARCHAR(100),
                address TEXT,
                ledger_balance DECIMAL(12, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ customers table created');

        // Import Invoices Table
        console.log('Creating import_invoices table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS import_invoices (
                id SERIAL PRIMARY KEY,
                supplier_id INTEGER REFERENCES suppliers(id),
                invoice_no VARCHAR(100),
                type VARCHAR(20) DEFAULT 'cash',
                currency VARCHAR(10),
                exchange_rate DECIMAL(10, 4) DEFAULT 1.0000,
                total_amount DECIMAL(12, 2) DEFAULT 0.00,
                status VARCHAR(20) DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ import_invoices table created');

        // Import Items Table
        console.log('Creating import_items table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS import_items (
                id SERIAL PRIMARY KEY,
                import_invoice_id INTEGER REFERENCES import_invoices(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(12, 2) NOT NULL
            )
        `);
        const importColumnCheck = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'import_items'
              AND column_name IN ('invoice_id', 'import_invoice_id')
        `);
        const importColumns = importColumnCheck.rows.map(row => row.column_name);
        if (importColumns.includes('invoice_id') && !importColumns.includes('import_invoice_id')) {
            await client.query('ALTER TABLE import_items RENAME COLUMN invoice_id TO import_invoice_id');
        } else if (!importColumns.includes('import_invoice_id')) {
            await client.query(`
                ALTER TABLE import_items
                ADD COLUMN import_invoice_id INTEGER REFERENCES import_invoices(id) ON DELETE CASCADE
            `);
        }
        await client.query(`
            ALTER TABLE import_items
            ADD COLUMN IF NOT EXISTS batch_id INTEGER
        `);
        console.log('✅ import_items table created');

        // Sales Invoices Table
        console.log('Creating sales_invoices table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS sales_invoices (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER REFERENCES customers(id),
                type VARCHAR(20) DEFAULT 'cash',
                total_amount DECIMAL(12, 2) DEFAULT 0.00,
                discount_percent DECIMAL(5, 2) DEFAULT 0,
                discount_amount DECIMAL(12, 2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ sales_invoices table created');

        // Sales Items Table
        console.log('Creating sales_items table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS sales_items (
                id SERIAL PRIMARY KEY,
                invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(12, 2) NOT NULL
            )
        `);
        console.log('✅ sales_items table created');

        // Product batches used by imports and sales
        console.log('Creating product_batches table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS product_batches (
                batch_id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                batch_number VARCHAR(100) NOT NULL,
                expiry_date DATE,
                quantity INTEGER DEFAULT 0,
                import_id INTEGER REFERENCES import_invoices(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(product_id, batch_number)
            )
        `);
        await client.query(`
            ALTER TABLE sales_items
            ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES product_batches(batch_id) ON DELETE SET NULL
        `);
        await client.query(`
            ALTER TABLE import_items
            DROP CONSTRAINT IF EXISTS import_items_batch_id_fkey
        `);
        await client.query(`
            ALTER TABLE import_items
            ADD CONSTRAINT import_items_batch_id_fkey
            FOREIGN KEY (batch_id) REFERENCES product_batches(batch_id) ON DELETE SET NULL
        `);
        console.log('✅ product_batches and sales batch column ready');

        // Payments Table
        console.log('Creating payments table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                type VARCHAR(20) NOT NULL,
                partner_type VARCHAR(20),
                partner_id INTEGER NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                method VARCHAR(50) DEFAULT 'cash',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await client.query(`
            ALTER TABLE payments
            ADD COLUMN IF NOT EXISTS notes TEXT
        `);
        await client.query(`
            ALTER TABLE payments
            ADD COLUMN IF NOT EXISTS reference_id INTEGER
        `);
        await client.query(`
            ALTER TABLE payments
            ADD COLUMN IF NOT EXISTS partner_type VARCHAR(20)
        `);
        console.log('✅ payments table created');

        // Stock Movements Table
        console.log('Creating stock_movements table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS stock_movements (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                type VARCHAR(50) NOT NULL,
                reference_type VARCHAR(50),
                reference_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ stock_movements table created');

        // Returns tables
        console.log('Creating returns tables...');
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
        await client.query(`
            CREATE TABLE IF NOT EXISTS return_items (
                id SERIAL PRIMARY KEY,
                return_id INTEGER REFERENCES returns(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(12, 2) NOT NULL,
                total_price DECIMAL(12, 2) NOT NULL,
                batch_id INTEGER REFERENCES product_batches(batch_id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await client.query(`
            ALTER TABLE return_items
            ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES product_batches(batch_id) ON DELETE SET NULL
        `);
        console.log('✅ returns and return_items tables created');

        // Common indexes used by ledger, reports, and invoice lookups.
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_import_items_invoice ON import_items(import_invoice_id)',
            'CREATE INDEX IF NOT EXISTS idx_import_items_product ON import_items(product_id)',
            'CREATE INDEX IF NOT EXISTS idx_sales_items_invoice ON sales_items(invoice_id)',
            'CREATE INDEX IF NOT EXISTS idx_sales_items_product ON sales_items(product_id)',
            'CREATE INDEX IF NOT EXISTS idx_product_batches_product_id ON product_batches(product_id)',
            'CREATE INDEX IF NOT EXISTS idx_product_batches_batch_number ON product_batches(batch_number)',
            'CREATE INDEX IF NOT EXISTS idx_returns_type ON returns(return_type)',
            'CREATE INDEX IF NOT EXISTS idx_returns_party ON returns(party_id)',
            'CREATE INDEX IF NOT EXISTS idx_returns_invoice ON returns(invoice_id)',
            'CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id)',
            'CREATE INDEX IF NOT EXISTS idx_payments_type_partner ON payments(type, partner_id)',
            'CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)'
        ];
        for (const indexQuery of indexes) {
            await client.query(indexQuery);
        }
        console.log('✅ Database indexes created');

        // Create default admin user
        console.log('\nCreating default admin user...');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        await client.query(`
            INSERT INTO users (name, email, password_hash, role)
            VALUES ('Admin', 'admin@test.com', $1, 'admin')
            ON CONFLICT (email) DO NOTHING
        `, [hashedPassword]);
        console.log('✅ Admin user created (admin@test.com / 123456)');

        console.log('\n🎉 Database setup completed successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Admin Email: admin@test.com');
        console.log('🔑 Admin Password: 123456');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (err) {
        console.error('❌ Error setting up database:', err.message);
        throw err;
    } finally {
        client.release();
        process.exit(0);
    }
};

setupDatabase();
