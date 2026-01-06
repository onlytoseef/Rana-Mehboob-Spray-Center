const pool = require('./db');

async function checkPaymentsTable() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'payments'
        `);
        console.log('Payments table columns:');
        console.log(result.rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkPaymentsTable();
