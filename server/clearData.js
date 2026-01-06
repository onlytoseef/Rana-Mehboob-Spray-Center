const pool = require('./db');
require('dotenv').config();

async function clearAllData() {
    const client = await pool.connect();
    
    try {
        console.log('🗑️  Starting data cleanup...');
        console.log('⚠️  This will delete ALL data except user accounts.\n');
        
        await client.query('BEGIN');

        // Delete in order to respect foreign key constraints
        console.log('Deleting return_items...');
        await client.query('DELETE FROM return_items');

        console.log('Deleting returns...');
        await client.query('DELETE FROM returns');

        console.log('Deleting stock_movements...');
        await client.query('DELETE FROM stock_movements');

        console.log('Deleting payments...');
        await client.query('DELETE FROM payments');

        console.log('Deleting import_items...');
        await client.query('DELETE FROM import_items');

        console.log('Deleting import_invoices...');
        await client.query('DELETE FROM import_invoices');

        console.log('Deleting sales_items...');
        await client.query('DELETE FROM sales_items');

        console.log('Deleting sales_invoices...');
        await client.query('DELETE FROM sales_invoices');

        console.log('Deleting products...');
        await client.query('DELETE FROM products');

        console.log('Deleting suppliers...');
        await client.query('DELETE FROM suppliers');

        console.log('Deleting customers...');
        await client.query('DELETE FROM customers');

        console.log('Deleting categories...');
        await client.query('DELETE FROM categories');

        // Reset sequences to start from 1 again
        console.log('\nResetting ID sequences...');
        await client.query("ALTER SEQUENCE IF EXISTS return_items_id_seq RESTART WITH 1");
        await client.query("ALTER SEQUENCE IF EXISTS returns_id_seq RESTART WITH 1");
        await client.query("ALTER SEQUENCE IF EXISTS stock_movements_id_seq RESTART WITH 1");
        await client.query("ALTER SEQUENCE IF EXISTS payments_id_seq RESTART WITH 1");
        await client.query("ALTER SEQUENCE IF EXISTS import_items_id_seq RESTART WITH 1");
        await client.query("ALTER SEQUENCE IF EXISTS import_invoices_id_seq RESTART WITH 1");
        await client.query("ALTER SEQUENCE IF EXISTS sales_items_id_seq RESTART WITH 1");
        await client.query("ALTER SEQUENCE IF EXISTS sales_invoices_id_seq RESTART WITH 1");
        await client.query("ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1");
        await client.query("ALTER SEQUENCE IF EXISTS suppliers_id_seq RESTART WITH 1");
        await client.query("ALTER SEQUENCE IF EXISTS customers_id_seq RESTART WITH 1");
        await client.query("ALTER SEQUENCE IF EXISTS categories_id_seq RESTART WITH 1");

        await client.query('COMMIT');
        
        console.log('\n✅ All data cleared successfully!');
        console.log('👤 User accounts have been preserved.');
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error clearing data:', err.message);
    } finally {
        client.release();
        await pool.end();
        process.exit(0);
    }
}

clearAllData();
