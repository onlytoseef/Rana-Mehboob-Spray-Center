const bcrypt = require('bcryptjs');
require('dotenv').config();
const pool = require('./db');

async function setup() {
    try {
        console.log('Connected to PostgreSQL using DATABASE_URL...');

        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table ready!');

        // Create categories table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Categories table ready!');

        // Create other tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                unit VARCHAR(50),
                opening_stock DECIMAL(10,2) DEFAULT 0,
                opening_cost DECIMAL(10,2) DEFAULT 0,
                current_stock DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                currency VARCHAR(10) DEFAULT 'PKR',
                ledger_balance DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                ledger_balance DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS import_invoices (
                id SERIAL PRIMARY KEY,
                supplier_id INTEGER REFERENCES suppliers(id),
                invoice_no VARCHAR(100),
                type VARCHAR(20) DEFAULT 'cash',
                price INTEGER DEFAULT 0,
                total_amount DECIMAL(15,2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS import_items (
                id SERIAL PRIMARY KEY,
                import_invoice_id INTEGER REFERENCES import_invoices(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER,
                unit_price INTEGER,
                total_price INTEGER
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS sales_invoices (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER REFERENCES customers(id),
                type VARCHAR(20) DEFAULT 'cash',
                total_amount DECIMAL(15,2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS sales_items (
                id SERIAL PRIMARY KEY,
                invoice_id INTEGER REFERENCES sales_invoices(id),
                product_id INTEGER REFERENCES products(id),
                quantity DECIMAL(10,2),
                unit_price DECIMAL(10,2),
                total_price DECIMAL(15,2)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_batches (
                batch_id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                batch_number VARCHAR(100) NOT NULL,
                expiry_date DATE,
                quantity DECIMAL(10,2) DEFAULT 0,
                import_id INTEGER REFERENCES import_invoices(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(product_id, batch_number)
            )
        `);

        await pool.query(`
            ALTER TABLE import_items
            ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES product_batches(batch_id) ON DELETE SET NULL
        `);

        await pool.query(`
            ALTER TABLE sales_items
            ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES product_batches(batch_id) ON DELETE SET NULL
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                type VARCHAR(20) NOT NULL,
                partner_id INTEGER NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                method VARCHAR(20) DEFAULT 'cash',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            ALTER TABLE payments
            ADD COLUMN IF NOT EXISTS notes TEXT
        `);

        await pool.query(`
            ALTER TABLE payments
            ADD COLUMN IF NOT EXISTS reference_id INTEGER
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS stock_movements (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                type VARCHAR(20),
                quantity DECIMAL(10,2),
                reference_type VARCHAR(50),
                reference_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ All tables created!');

        // Create admin user
        const existing = await pool.query("SELECT * FROM users WHERE email = $1", ['admin@test.com']);
        
        if (existing.rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);
            await pool.query(
                "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)",
                ['Admin', 'admin@test.com', hashedPassword]
            );
            console.log('✅ Admin user created!');
        }

        console.log('\n========================================');
        console.log('🎉 Setup Complete!');
        console.log('========================================');
        console.log('Login with:');
        console.log('  Email: admin@test.com');
        console.log('  Password: 123456');
        console.log('========================================\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

setup();
