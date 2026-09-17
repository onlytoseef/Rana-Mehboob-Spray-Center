const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const pool = require('./db');

const confirmation = process.argv[2];
const includeUsers = process.argv.includes('--include-users');

async function clearAllData() {
    if (confirmation !== 'CLEAR_DATABASE') {
        console.error('This permanently deletes database data.');
        console.error('To continue, run: node clearData.js CLEAR_DATABASE');
        console.error('Add --include-users to delete user accounts too.');
        process.exitCode = 1;
        return;
    }

    const client = await pool.connect();
    
    try {
        console.log('🗑️  Starting data cleanup...');
        console.log(`⚠️  This will delete all data${includeUsers ? '' : ' except user accounts'}.\n`);
        
        await client.query('BEGIN');

        const tablesResult = await client.query(`
            SELECT quote_ident(table_name) AS table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
              AND ($1 OR table_name <> 'users')
            ORDER BY table_name
        `, [includeUsers]);

        if (tablesResult.rows.length > 0) {
            const tables = tablesResult.rows.map(row => `public.${row.table_name}`).join(', ');
            await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
        }

        await client.query('COMMIT');
        
        console.log('\n✅ All data cleared successfully!');
        if (!includeUsers) {
            console.log('👤 User accounts were preserved.');
        }
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error clearing data:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

clearAllData();
