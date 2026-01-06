const pool = require('./db');
require('dotenv').config();

async function initDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Starting database initialization...\n');

        // Create all tables
        await client.query(`
            -- Users Table
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Categories Table
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Products Table
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                unit VARCHAR(50),
                opening_stock INTEGER DEFAULT 0,
                opening_cost DECIMAL(10, 2) DEFAULT 0.00,
                current_stock INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Suppliers Table
            CREATE TABLE IF NOT EXISTS suppliers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                currency VARCHAR(10) DEFAULT 'PKR',
                ledger_balance DECIMAL(12, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Customers Table
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                ledger_balance DECIMAL(12, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Import Invoices Table
            CREATE TABLE IF NOT EXISTS import_invoices (
                id SERIAL PRIMARY KEY,
                supplier_id INTEGER REFERENCES suppliers(id),
                invoice_no VARCHAR(100),
                type VARCHAR(20) DEFAULT 'cash',
                total_amount DECIMAL(12, 2) DEFAULT 0.00,
                status VARCHAR(20) DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Import Items Table
            CREATE TABLE IF NOT EXISTS import_items (
                id SERIAL PRIMARY KEY,
                import_invoice_id INTEGER REFERENCES import_invoices(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(12, 2) NOT NULL
            );

            -- Sales Invoices Table
            CREATE TABLE IF NOT EXISTS sales_invoices (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER REFERENCES customers(id),
                invoice_no VARCHAR(100),
                type VARCHAR(20) DEFAULT 'cash',
                total_amount DECIMAL(12, 2) DEFAULT 0.00,
                discount_percent DECIMAL(5, 2) DEFAULT 0.00,
                discount_amount DECIMAL(12, 2) DEFAULT 0.00,
                status VARCHAR(20) DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Sales Items Table
            CREATE TABLE IF NOT EXISTS sales_items (
                id SERIAL PRIMARY KEY,
                invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(12, 2) NOT NULL
            );

            -- Payments Table
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                type VARCHAR(20) NOT NULL,
                reference_id INTEGER,
                partner_id INTEGER NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                method VARCHAR(50) DEFAULT 'cash',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Stock Movements Table
            CREATE TABLE IF NOT EXISTS stock_movements (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                type VARCHAR(50) NOT NULL,
                reference_type VARCHAR(50),
                reference_id INTEGER,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ All tables created successfully!\n');

        // List all tables
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('📋 Tables in database:');
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        console.log('\n🎉 Database initialization complete!');
        
    } catch (err) {
        console.error('❌ Error initializing database:', err.message);
        throw err;
    } finally {
        client.release();
        process.exit(0);
    }
}

initDatabase();
