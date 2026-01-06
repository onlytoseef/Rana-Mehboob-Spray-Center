const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// Create Import Invoice (Draft)
router.post("/", authorization, async (req, res) => {
  try {
    const { supplier_id, type } = req.body;
    
    // Auto-generate invoice number: IMP-YYYYMMDD-XXXX
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM import_invoices WHERE DATE(created_at) = CURRENT_DATE"
    );
    const count = parseInt(countResult.rows[0].count) + 1;
    const invoice_no = `IMP-${dateStr}-${count.toString().padStart(4, '0')}`;
    
    const newInvoice = await pool.query(
      "INSERT INTO import_invoices (supplier_id, invoice_no, type, status) VALUES($1, $2, $3, 'draft') RETURNING *",
      [supplier_id, invoice_no, type || 'cash']
    );
    res.json(newInvoice.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get All Import Invoices
router.get("/", authorization, async (req, res) => {
  try {
    const allInvoices = await pool.query(`
      SELECT i.*, s.name as supplier_name 
      FROM import_invoices i 
      LEFT JOIN suppliers s ON i.supplier_id = s.id 
      ORDER BY i.created_at DESC
    `);
    res.json(allInvoices.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get Single Import Invoice with Items
router.get("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await pool.query(`
      SELECT i.*, s.name as supplier_name 
      FROM import_invoices i 
      LEFT JOIN suppliers s ON i.supplier_id = s.id 
      WHERE i.id = $1
    `, [id]);
    
    const items = await pool.query(`
      SELECT ii.*, p.name as product_name 
      FROM import_items ii 
      LEFT JOIN products p ON ii.product_id = p.id 
      WHERE ii.import_invoice_id = $1
    `, [id]);
    
    res.json({ invoice: invoice.rows[0], items: items.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Add Item to Import Invoice
router.post("/:id/items", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, quantity, unit_price } = req.body;
    const total_price = quantity * unit_price;
    
    // Check if invoice is draft
    const invoice = await pool.query("SELECT status FROM import_invoices WHERE id = $1", [id]);
    if (invoice.rows[0]?.status !== 'draft') {
      return res.status(400).json("Cannot modify finalized invoice");
    }
    
    const newItem = await pool.query(
      "INSERT INTO import_items (import_invoice_id, product_id, quantity, unit_price, total_price) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [id, product_id, quantity, unit_price, total_price]
    );
    
    // Update invoice total
    await pool.query(`
      UPDATE import_invoices SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0) FROM import_items WHERE import_invoice_id = $1
      ) WHERE id = $1
    `, [id]);
    
    res.json(newItem.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete Item from Import Invoice
router.delete("/:id/items/:itemId", authorization, async (req, res) => {
  try {
    const { id, itemId } = req.params;
    
    // Check if invoice is draft
    const invoice = await pool.query("SELECT status FROM import_invoices WHERE id = $1", [id]);
    if (invoice.rows[0]?.status !== 'draft') {
      return res.status(400).json("Cannot modify finalized invoice");
    }
    
    await pool.query("DELETE FROM import_items WHERE id = $1", [itemId]);
    
    // Update invoice total
    await pool.query(`
      UPDATE import_invoices SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0) FROM import_items WHERE import_invoice_id = $1
      ) WHERE id = $1
    `, [id]);
    
    res.json("Item deleted");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Finalize Import Invoice
router.post("/:id/finalize", authorization, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    // Check if already finalized
    const invoice = await client.query("SELECT * FROM import_invoices WHERE id = $1", [id]);
    if (invoice.rows[0]?.status === 'finalized') {
      await client.query('ROLLBACK');
      return res.status(400).json("Invoice already finalized");
    }
    
    // Get all items
    const items = await client.query("SELECT * FROM import_items WHERE import_invoice_id = $1", [id]);
    
    // Update stock for each item
    for (const item of items.rows) {
      // Update product stock
      await client.query(
        "UPDATE products SET current_stock = current_stock + $1 WHERE id = $2",
        [item.quantity, item.product_id]
      );
      
      // Create stock movement
      await client.query(
        "INSERT INTO stock_movements (product_id, quantity, type, reference_type, reference_id) VALUES ($1, $2, 'in', 'import', $3)",
        [item.product_id, item.quantity, id]
      );
    }
    
    // Update supplier ledger ONLY for credit invoices (increase payable)
    if (invoice.rows[0].type === 'credit') {
      const totalAmount = parseFloat(invoice.rows[0].total_amount);
      await client.query(
        "UPDATE suppliers SET ledger_balance = ledger_balance + $1 WHERE id = $2",
        [totalAmount, invoice.rows[0].supplier_id]
      );
    }
    
    // Mark invoice as finalized
    await client.query("UPDATE import_invoices SET status = 'finalized' WHERE id = $1", [id]);
    
    await client.query('COMMIT');
    
    res.json({ message: "Invoice finalized successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send("Server Error");
  } finally {
    client.release();
  }
});

// Delete Draft Invoice
router.delete("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if invoice is draft
    const invoice = await pool.query("SELECT status FROM import_invoices WHERE id = $1", [id]);
    if (invoice.rows[0]?.status !== 'draft') {
      return res.status(400).json("Cannot delete finalized invoice");
    }
    
    await pool.query("DELETE FROM import_invoices WHERE id = $1", [id]);
    res.json("Invoice deleted");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
