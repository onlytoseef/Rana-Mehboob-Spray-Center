const router = require('express').Router();
const { Pool } = require('pg');
const { 
    readConfig, 
    isConfigured, 
    getDatabaseConfig, 
    saveDatabaseConfig,
    resetConfig 
} = require('../config');

// Get current config status
router.get('/status', (req, res) => {
    try {
        const configured = isConfigured();
        const config = configured ? getDatabaseConfig() : null;
        
        res.json({
            isConfigured: configured,
            database: config ? {
                host: config.host,
                port: config.port,
                name: config.name,
                user: config.user,
                // Don't send password to frontend for security
                hasPassword: !!config.password
            } : null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Test database connection
router.post('/test-connection', async (req, res) => {
    const { host, port, name, user, password } = req.body;
    
    // Create temporary pool for testing
    const testPool = new Pool({
        host: host || 'localhost',
        port: parseInt(port) || 5432,
        database: name || 'postgres',
        user: user || 'postgres',
        password: password || '',
        connectionTimeoutMillis: 5000 // 5 second timeout
    });
    
    try {
        const client = await testPool.connect();
        
        // Check if database exists
        const dbCheck = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [name]
        );
        
        client.release();
        await testPool.end();
        
        if (dbCheck.rows.length === 0) {
            res.json({
                success: true,
                message: 'Connection successful! Database does not exist but will be created.',
                databaseExists: false
            });
        } else {
            res.json({
                success: true,
                message: 'Connection successful! Database exists.',
                databaseExists: true
            });
        }
    } catch (err) {
        await testPool.end().catch(() => {});
        res.json({
            success: false,
            message: `Connection failed: ${err.message}`
        });
    }
});

// Save database configuration
router.post('/save', async (req, res) => {
    const { host, port, name, user, password } = req.body;
    
    try {
        // Validate required fields
        if (!host || !name || !user) {
            return res.status(400).json({ 
                error: 'Host, database name, and user are required' 
            });
        }
        
        // Save config
        const saved = saveDatabaseConfig({
            host: host,
            port: parseInt(port) || 5432,
            name: name,
            user: user,
            password: password || ''
        });
        
        if (saved) {
            // Recreate pool with new config
            const { recreatePool } = require('../db');
            recreatePool();
            
            res.json({
                success: true,
                message: 'Configuration saved successfully'
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to save configuration' 
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Initialize database tables
router.post('/init-database', async (req, res) => {
    try {
        const pool = require('../db').getPool();
        
        // Create tables
        await pool.query(`
            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                user_name VARCHAR(255) NOT NULL,
                user_email VARCHAR(255) UNIQUE NOT NULL,
                user_password VARCHAR(255) NOT NULL,
                user_role VARCHAR(50) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Categories table
            CREATE TABLE IF NOT EXISTS categories (
                category_id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Suppliers table
            CREATE TABLE IF NOT EXISTS suppliers (
                supplier_id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                contact_person VARCHAR(255),
                phone VARCHAR(50),
                email VARCHAR(255),
                address TEXT,
                opening_balance DECIMAL(12,2) DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Customers table
            CREATE TABLE IF NOT EXISTS customers (
                customer_id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                contact_person VARCHAR(255),
                phone VARCHAR(50),
                email VARCHAR(255),
                address TEXT,
                opening_balance DECIMAL(12,2) DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Products table
            CREATE TABLE IF NOT EXISTS products (
                product_id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                part_number VARCHAR(100),
                category_id INTEGER REFERENCES categories(category_id),
                purchase_price DECIMAL(12,2) DEFAULT 0,
                sale_price DECIMAL(12,2) DEFAULT 0,
                stock INTEGER DEFAULT 0,
                min_stock INTEGER DEFAULT 0,
                description TEXT,
                type VARCHAR(20) DEFAULT 'piece',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Imports (purchases) table
            CREATE TABLE IF NOT EXISTS imports (
                import_id SERIAL PRIMARY KEY,
                supplier_id INTEGER REFERENCES suppliers(supplier_id),
                invoice_number VARCHAR(100),
                import_date DATE DEFAULT CURRENT_DATE,
                total_amount DECIMAL(12,2) DEFAULT 0,
                discount_type VARCHAR(20) DEFAULT 'fixed',
                discount_value DECIMAL(12,2) DEFAULT 0,
                discount_amount DECIMAL(12,2) DEFAULT 0,
                paid_amount DECIMAL(12,2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'finalized',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Import items table
            CREATE TABLE IF NOT EXISTS import_items (
                item_id SERIAL PRIMARY KEY,
                import_id INTEGER REFERENCES imports(import_id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(product_id),
                quantity INTEGER DEFAULT 1,
                unit_price DECIMAL(12,2) DEFAULT 0,
                total_price DECIMAL(12,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Sales table
            CREATE TABLE IF NOT EXISTS sales (
                sale_id SERIAL PRIMARY KEY,
                customer_id INTEGER REFERENCES customers(customer_id),
                invoice_number VARCHAR(100),
                sale_date DATE DEFAULT CURRENT_DATE,
                total_amount DECIMAL(12,2) DEFAULT 0,
                discount_type VARCHAR(20) DEFAULT 'fixed',
                discount_value DECIMAL(12,2) DEFAULT 0,
                discount_amount DECIMAL(12,2) DEFAULT 0,
                paid_amount DECIMAL(12,2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'finalized',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Sale items table
            CREATE TABLE IF NOT EXISTS sale_items (
                item_id SERIAL PRIMARY KEY,
                sale_id INTEGER REFERENCES sales(sale_id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(product_id),
                quantity INTEGER DEFAULT 1,
                unit_price DECIMAL(12,2) DEFAULT 0,
                total_price DECIMAL(12,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Payments table
            CREATE TABLE IF NOT EXISTS payments (
                payment_id SERIAL PRIMARY KEY,
                payment_type VARCHAR(50) NOT NULL,
                reference_id INTEGER,
                reference_type VARCHAR(50),
                customer_id INTEGER REFERENCES customers(customer_id),
                supplier_id INTEGER REFERENCES suppliers(supplier_id),
                amount DECIMAL(12,2) NOT NULL,
                payment_date DATE DEFAULT CURRENT_DATE,
                payment_method VARCHAR(50) DEFAULT 'cash',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Returns table
            CREATE TABLE IF NOT EXISTS returns (
                return_id SERIAL PRIMARY KEY,
                return_type VARCHAR(20) NOT NULL,
                customer_id INTEGER REFERENCES customers(customer_id),
                supplier_id INTEGER REFERENCES suppliers(supplier_id),
                original_invoice_id INTEGER,
                return_date DATE DEFAULT CURRENT_DATE,
                total_amount DECIMAL(12,2) DEFAULT 0,
                refund_method VARCHAR(20) DEFAULT 'credit',
                reason TEXT,
                notes TEXT,
                status VARCHAR(20) DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Return items table
            CREATE TABLE IF NOT EXISTS return_items (
                return_item_id SERIAL PRIMARY KEY,
                return_id INTEGER REFERENCES returns(return_id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(product_id),
                quantity INTEGER DEFAULT 1,
                unit_price DECIMAL(12,2) DEFAULT 0,
                total_price DECIMAL(12,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        res.json({
            success: true,
            message: 'Database tables created successfully'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create database if it doesn't exist
router.post('/create-database', async (req, res) => {
    const { host, port, name, user, password } = req.body;
    
    // Connect to default 'postgres' database to create new database
    const adminPool = new Pool({
        host: host || 'localhost',
        port: parseInt(port) || 5432,
        database: 'postgres',
        user: user || 'postgres',
        password: password || ''
    });
    
    try {
        // Check if database exists
        const dbCheck = await adminPool.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [name]
        );
        
        if (dbCheck.rows.length === 0) {
            // Create database
            await adminPool.query(`CREATE DATABASE "${name}"`);
            await adminPool.end();
            
            res.json({
                success: true,
                message: `Database "${name}" created successfully`
            });
        } else {
            await adminPool.end();
            res.json({
                success: true,
                message: `Database "${name}" already exists`
            });
        }
    } catch (err) {
        await adminPool.end().catch(() => {});
        res.status(500).json({ error: err.message });
    }
});

// Reset configuration
router.post('/reset', (req, res) => {
    try {
        resetConfig();
        res.json({
            success: true,
            message: 'Configuration reset successfully'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
