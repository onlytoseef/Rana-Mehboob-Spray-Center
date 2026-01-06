const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// Create Payment
router.post("/", authorization, async (req, res) => {
  const client = await pool.connect();
  try {
    const { type, partner_id, amount, method, reference_id } = req.body;
    
    await client.query('BEGIN');
    
    // Insert payment
    const newPayment = await client.query(
      "INSERT INTO payments (type, partner_id, amount, method, reference_id) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [type, partner_id, amount, method, reference_id]
    );
    
    // Update ledger based on payment type
    if (type === 'customer') {
      // Customer payment reduces their receivable balance
      await client.query(
        "UPDATE customers SET ledger_balance = ledger_balance - $1 WHERE id = $2",
        [amount, partner_id]
      );
    } else if (type === 'supplier') {
      // Supplier payment reduces our payable balance
      await client.query(
        "UPDATE suppliers SET ledger_balance = ledger_balance - $1 WHERE id = $2",
        [amount, partner_id]
      );
    }
    
    await client.query('COMMIT');
    
    res.json(newPayment.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send("Server Error");
  } finally {
    client.release();
  }
});

// Get All Payments
router.get("/", authorization, async (req, res) => {
  try {
    const allPayments = await pool.query(`
      SELECT p.*, 
        CASE 
          WHEN p.type = 'customer' THEN c.name 
          WHEN p.type = 'supplier' THEN s.name 
        END as partner_name
      FROM payments p 
      LEFT JOIN customers c ON p.type = 'customer' AND p.partner_id = c.id
      LEFT JOIN suppliers s ON p.type = 'supplier' AND p.partner_id = s.id
      ORDER BY p.created_at DESC
    `);
    res.json(allPayments.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get Payments by Customer
router.get("/customer/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const payments = await pool.query(
      "SELECT * FROM payments WHERE type = 'customer' AND partner_id = $1 ORDER BY created_at DESC",
      [id]
    );
    res.json(payments.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get Payments by Supplier
router.get("/supplier/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const payments = await pool.query(
      "SELECT * FROM payments WHERE type = 'supplier' AND partner_id = $1 ORDER BY created_at DESC",
      [id]
    );
    res.json(payments.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// =====================
// SUPPLIER PAYMENTS (Cash Payment to Suppliers)
// =====================

// Get all supplier payments
router.get('/supplier-payments', authorization, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, s.name as supplier_name 
            FROM payments p
            JOIN suppliers s ON p.partner_id = s.id
            WHERE p.type = 'supplier'
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create supplier payment
router.post('/supplier-payment', authorization, async (req, res) => {
    const { supplier_id, amount, reference, notes } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Insert payment record
        const paymentResult = await client.query(`
            INSERT INTO payments (type, partner_id, amount, method, reference_id, notes)
            VALUES ('supplier', $1, $2, 'cash', $3, $4)
            RETURNING *
        `, [supplier_id, amount, reference || null, notes || null]);

        // Update supplier ledger balance
        await client.query(`
            UPDATE suppliers 
            SET ledger_balance = ledger_balance - $1
            WHERE id = $2
        `, [amount, supplier_id]);

        await client.query('COMMIT');

        res.status(201).json(paymentResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

// =====================
// CREDIT VOUCHERS (to customers)
// =====================

// Get all credit vouchers
router.get('/credit-vouchers', authorization, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, c.name as customer_name 
            FROM payments p
            JOIN customers c ON p.partner_id = c.id
            WHERE p.type = 'customer' AND p.method = 'credit_voucher'
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create credit voucher
router.post('/credit-voucher', authorization, async (req, res) => {
    const { customer_id, amount, reference, notes } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Insert credit voucher
        const voucherResult = await client.query(`
            INSERT INTO payments (type, partner_id, amount, method, reference_id, notes)
            VALUES ('customer', $1, $2, 'credit_voucher', $3, $4)
            RETURNING *
        `, [customer_id, amount, reference || null, notes || null]);

        // Update customer ledger balance (reduce their debt)
        await client.query(`
            UPDATE customers 
            SET ledger_balance = ledger_balance - $1
            WHERE id = $2
        `, [amount, customer_id]);

        await client.query('COMMIT');

        res.status(201).json(voucherResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

// =====================
// CASH RECEIVED (from customers)
// =====================

// Get all cash received
router.get('/cash-received', authorization, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, c.name as customer_name 
            FROM payments p
            JOIN customers c ON p.partner_id = c.id
            WHERE p.type = 'customer' AND p.method = 'cash'
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Record cash received
router.post('/cash-received', authorization, async (req, res) => {
    const { customer_id, amount, reference, notes } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Insert cash received record
        const receiptResult = await client.query(`
            INSERT INTO payments (type, partner_id, amount, method, reference_id, notes)
            VALUES ('customer', $1, $2, 'cash', $3, $4)
            RETURNING *
        `, [customer_id, amount, reference || null, notes || null]);

        // Update customer ledger balance (reduce their debt)
        await client.query(`
            UPDATE customers 
            SET ledger_balance = ledger_balance - $1
            WHERE id = $2
        `, [amount, customer_id]);

        await client.query('COMMIT');

        res.status(201).json(receiptResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

module.exports = router;
