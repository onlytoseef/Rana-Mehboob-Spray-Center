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

        // Payments Table
        console.log('Creating payments table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                type VARCHAR(20) NOT NULL,
                partner_type VARCHAR(20) NOT NULL,
                partner_id INTEGER NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                method VARCHAR(50) DEFAULT 'cash',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
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
