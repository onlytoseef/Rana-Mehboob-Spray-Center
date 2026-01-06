const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// Dashboard Stats
router.get("/stats", authorization, async (req, res) => {
  try {
    // Today's date range
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Today's sales (finalized only - both cash and credit)
    const todaySales = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales_invoices 
      WHERE status = 'finalized' 
      AND created_at >= $1 AND created_at <= $2
    `, [startOfDay, endOfDay]);

    // Today's imports (finalized only)
    const todayImports = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM import_invoices 
      WHERE status = 'finalized' 
      AND created_at >= $1 AND created_at <= $2
    `, [startOfDay, endOfDay]);

    // Total stock value - calculate from import items average cost
    const stockValue = await pool.query(`
      SELECT COALESCE(SUM(
        p.current_stock * COALESCE(
          (SELECT AVG(ii.unit_price) FROM import_items ii 
           JOIN import_invoices inv ON ii.import_invoice_id = inv.id 
           WHERE ii.product_id = p.id AND inv.status = 'finalized'),
          p.opening_cost
        )
      ), 0) as total
      FROM products p
      WHERE p.current_stock > 0
    `);

    // Total receivables (customer ledger)
    const totalReceivables = await pool.query(`
      SELECT COALESCE(SUM(ledger_balance), 0) as total
      FROM customers WHERE ledger_balance > 0
    `);

    // Total payables (supplier ledger)
    const totalPayables = await pool.query(`
      SELECT COALESCE(SUM(ledger_balance), 0) as total
      FROM suppliers WHERE ledger_balance > 0
    `);

    // Today's cash - ONLY cash sales (type='cash'), no imports
    const todayCash = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales_invoices 
      WHERE status = 'finalized' 
      AND type = 'cash'
      AND created_at >= $1 AND created_at <= $2
    `, [startOfDay, endOfDay]);

    // Cash Sales (all time) - total cash sales
    const cashSales = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales_invoices 
      WHERE status = 'finalized' 
      AND type = 'cash'
    `);

    // Credit Sales (receivables from credit sales)
    const creditSales = await pool.query(`
      SELECT COALESCE(SUM(ledger_balance), 0) as total
      FROM customers WHERE ledger_balance > 0
    `);

    // Credit Cash Received - payments received from customers against credit sales
    const creditCashReceived = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments 
      WHERE type = 'customer'
    `);

    res.json({
      todaySales: parseFloat(todaySales.rows[0].total),
      todayImports: parseFloat(todayImports.rows[0].total),
      stockValue: parseFloat(stockValue.rows[0].total),
      totalReceivables: parseFloat(totalReceivables.rows[0].total),
      totalPayables: parseFloat(totalPayables.rows[0].total),
      todayCash: parseFloat(todayCash.rows[0].total),
      cashSales: parseFloat(cashSales.rows[0].total),
      creditSales: parseFloat(creditSales.rows[0].total),
      creditCashReceived: parseFloat(creditCashReceived.rows[0].total),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Daily Report
router.get("/daily", authorization, async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate(), 23, 59, 59, 999);

    const sales = await pool.query(`
      SELECT s.*, c.name as customer_name
      FROM sales_invoices s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.status = 'finalized' AND s.created_at >= $1 AND s.created_at <= $2
      ORDER BY s.created_at DESC
    `, [startOfDay, endOfDay]);

    const imports = await pool.query(`
      SELECT i.*, s.name as supplier_name
      FROM import_invoices i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.status = 'finalized' AND i.created_at >= $1 AND i.created_at <= $2
      ORDER BY i.created_at DESC
    `, [startOfDay, endOfDay]);

    const payments = await pool.query(`
      SELECT p.*, 
        CASE 
          WHEN p.type = 'customer' THEN c.name 
          WHEN p.type = 'supplier' THEN s.name 
        END as partner_name
      FROM payments p 
      LEFT JOIN customers c ON p.type = 'customer' AND p.partner_id = c.id
      LEFT JOIN suppliers s ON p.type = 'supplier' AND p.partner_id = s.id
      WHERE p.created_at >= $1 AND p.created_at <= $2
      ORDER BY p.created_at DESC
    `, [startOfDay, endOfDay]);

    res.json({ sales: sales.rows, imports: imports.rows, payments: payments.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Supplier Report
router.get("/supplier/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await pool.query("SELECT * FROM suppliers WHERE id = $1", [id]);

    const invoices = await pool.query(`
      SELECT * FROM import_invoices 
      WHERE supplier_id = $1 AND status = 'finalized'
      ORDER BY created_at DESC
    `, [id]);

    const payments = await pool.query(`
      SELECT * FROM payments 
      WHERE type = 'supplier' AND partner_id = $1
      ORDER BY created_at DESC
    `, [id]);

    res.json({
      supplier: supplier.rows[0],
      invoices: invoices.rows,
      payments: payments.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Customer Report
router.get("/customer/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);

    const invoices = await pool.query(`
      SELECT * FROM sales_invoices 
      WHERE customer_id = $1 AND status = 'finalized'
      ORDER BY created_at DESC
    `, [id]);

    const payments = await pool.query(`
      SELECT * FROM payments 
      WHERE type = 'customer' AND partner_id = $1
      ORDER BY created_at DESC
    `, [id]);

    res.json({
      customer: customer.rows[0],
      invoices: invoices.rows,
      payments: payments.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
