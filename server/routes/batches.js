const router = require('express').Router();
const pool = require('../db');

// Get all batches for a product
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const result = await pool.query(`
            SELECT batch_id, batch_number, expiry_date, quantity
            FROM product_batches
            WHERE product_id = $1 AND quantity > 0
            ORDER BY expiry_date ASC
        `, [productId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Get all batches (for reports)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT pb.batch_id, pb.batch_number, pb.expiry_date, pb.quantity,
                   p.id as product_id, p.name as product_name
            FROM product_batches pb
            JOIN products p ON pb.product_id = p.id
            ORDER BY p.name, pb.expiry_date
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Get batch details
router.get('/:batchId', async (req, res) => {
    try {
        const { batchId } = req.params;
        const result = await pool.query(`
            SELECT pb.*, p.name as product_name
            FROM product_batches pb
            JOIN products p ON pb.product_id = p.id
            WHERE pb.batch_id = $1
        `, [batchId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Batch not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Create or update batch (used during import)
router.post('/', async (req, res) => {
    try {
        const { product_id, batch_number, expiry_date, quantity, import_id } = req.body;
        
        // Check if batch exists
        const existing = await pool.query(`
            SELECT batch_id, quantity FROM product_batches
            WHERE product_id = $1 AND batch_number = $2
        `, [product_id, batch_number]);
        
        if (existing.rows.length > 0) {
            // Update existing batch quantity
            const newQty = Number(existing.rows[0].quantity) + Number(quantity);
            const result = await pool.query(`
                UPDATE product_batches
                SET quantity = $1, expiry_date = COALESCE($2, expiry_date)
                WHERE batch_id = $3
                RETURNING *
            `, [newQty, expiry_date, existing.rows[0].batch_id]);
            res.json(result.rows[0]);
        } else {
            // Create new batch
            const result = await pool.query(`
                INSERT INTO product_batches (product_id, batch_number, expiry_date, quantity, import_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [product_id, batch_number, expiry_date, quantity, import_id]);
            res.json(result.rows[0]);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Decrease batch quantity (used during sale)
router.put('/decrease/:batchId', async (req, res) => {
    try {
        const { batchId } = req.params;
        const { quantity } = req.body;
        
        const result = await pool.query(`
            UPDATE product_batches
            SET quantity = quantity - $1
            WHERE batch_id = $2 AND quantity >= $1
            RETURNING *
        `, [quantity, batchId]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Insufficient batch quantity' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Increase batch quantity (used during return)
router.put('/increase/:batchId', async (req, res) => {
    try {
        const { batchId } = req.params;
        const { quantity } = req.body;
        
        const result = await pool.query(`
            UPDATE product_batches
            SET quantity = quantity + $1
            WHERE batch_id = $2
            RETURNING *
        `, [quantity, batchId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Batch not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
