const pool = require('./db');

async function checkTables() {
    try {
        const result = await pool.query(`
            SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
        `);
        console.log('Tables:', result.rows);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkTables();
