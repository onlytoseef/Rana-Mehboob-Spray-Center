const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// Create Sales Invoice (Draft)
router.post("/", authorization, async (req, res) => {
  try {
    const { customer_id, type } = req.body;
    const newInvoice = await pool.query(
      "INSERT INTO sales_invoices (customer_id, type, status) VALUES($1, $2, 'draft') RETURNING *",
      [customer_id, type || 'cash']
    );
    res.json(newInvoice.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get All Sales Invoices
router.get("/", authorization, async (req, res) => {
  try {
    const allInvoices = await pool.query(`
      SELECT s.*, c.name as customer_name 
      FROM sales_invoices s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      ORDER BY s.created_at DESC
    `);
    res.json(allInvoices.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get Single Sales Invoice with Items
router.get("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await pool.query(`
      SELECT s.*, c.name as customer_name 
      FROM sales_invoices s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      WHERE s.id = $1
    `, [id]);
    
    const items = await pool.query(`
      SELECT si.*, p.name as product_name, p.current_stock 
      FROM sales_items si 
      LEFT JOIN products p ON si.product_id = p.id 
      WHERE si.invoice_id = $1
    `, [id]);
    
    res.json({ invoice: invoice.rows[0], items: items.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Add Item to Sales Invoice
router.post("/:id/items", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, quantity, unit_price } = req.body;
    const total_price = quantity * unit_price;
    
    // Check if invoice is draft
    const invoice = await pool.query("SELECT status FROM sales_invoices WHERE id = $1", [id]);
    if (invoice.rows[0]?.status !== 'draft') {
      return res.status(400).json("Cannot modify finalized invoice");
    }
    
    // Check stock availability
    const product = await pool.query("SELECT current_stock FROM products WHERE id = $1", [product_id]);
    if (product.rows[0]?.current_stock < quantity) {
      return res.status(400).json(`Insufficient stock. Available: ${product.rows[0]?.current_stock}`);
    }
    
    const newItem = await pool.query(
      "INSERT INTO sales_items (invoice_id, product_id, quantity, unit_price, total_price) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [id, product_id, quantity, unit_price, total_price]
    );
    
    // Update invoice total
    await pool.query(`
      UPDATE sales_invoices SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0) FROM sales_items WHERE invoice_id = $1
      ) WHERE id = $1
    `, [id]);
    
    res.json(newItem.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete Item from Sales Invoice
router.delete("/:id/items/:itemId", authorization, async (req, res) => {
  try {
    const { id, itemId } = req.params;
    
    // Check if invoice is draft
    const invoice = await pool.query("SELECT status FROM sales_invoices WHERE id = $1", [id]);
    if (invoice.rows[0]?.status !== 'draft') {
      return res.status(400).json("Cannot modify finalized invoice");
    }
    
    await pool.query("DELETE FROM sales_items WHERE id = $1", [itemId]);
    
    // Update invoice total
    await pool.query(`
      UPDATE sales_invoices SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0) FROM sales_items WHERE invoice_id = $1
      ) WHERE id = $1
    `, [id]);
    
    res.json("Item deleted");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Finalize Sales Invoice
router.post("/:id/finalize", authorization, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    // Check if already finalized
    const invoice = await client.query("SELECT * FROM sales_invoices WHERE id = $1", [id]);
    if (invoice.rows[0]?.status === 'finalized') {
      await client.query('ROLLBACK');
      return res.status(400).json("Invoice already finalized");
    }
    
    // Get all items
    const items = await client.query("SELECT * FROM sales_items WHERE invoice_id = $1", [id]);
    
    // Verify stock and update for each item
    for (const item of items.rows) {
      const product = await client.query("SELECT current_stock FROM products WHERE id = $1", [item.product_id]);
      
      const currentStock = parseFloat(product.rows[0]?.current_stock) || 0;
      const requiredQty = parseFloat(item.quantity) || 0;
      
      if (currentStock < requiredQty) {
        await client.query('ROLLBACK');
        return res.status(400).json(`Insufficient stock for product ID ${item.product_id}. Available: ${currentStock}, Required: ${requiredQty}`);
      }
      
      // Update product stock
      await client.query(
        "UPDATE products SET current_stock = current_stock - $1 WHERE id = $2",
        [requiredQty, item.product_id]
      );
      
      // Create stock movement
      await client.query(
        "INSERT INTO stock_movements (product_id, quantity, type, reference_type, reference_id) VALUES ($1, $2, 'out', 'sale', $3)",
        [item.product_id, item.quantity, id]
      );
    }
    
    // Update customer ledger if credit sale
    if (invoice.rows[0].type === 'credit') {
      await client.query(
        "UPDATE customers SET ledger_balance = ledger_balance + $1 WHERE id = $2",
        [invoice.rows[0].total_amount, invoice.rows[0].customer_id]
      );
    }
    
    // Mark invoice as finalized
    await client.query("UPDATE sales_invoices SET status = 'finalized' WHERE id = $1", [id]);
    
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

// Create Complete Sales Invoice (All-in-one: Create + Items + Discount + Finalize)
router.post("/create-complete", authorization, async (req, res) => {
  const client = await pool.connect();
  try {
    const { customer_id, type, items, discount_percent } = req.body;
    
    if (!customer_id) {
      return res.status(400).json({ message: "Customer is required" });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }
    
    await client.query('BEGIN');
    
    // Calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.quantity * item.unit_price;
    }
    
    // Calculate discount
    const discountPercent = parseFloat(discount_percent) || 0;
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const totalAmount = subtotal - discountAmount;
    
    // Check stock availability for all items first
    for (const item of items) {
      const product = await client.query("SELECT current_stock, name FROM products WHERE id = $1", [item.product_id]);
      if (!product.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Product not found` });
      }
      if (product.rows[0].current_stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Insufficient stock for ${product.rows[0].name}. Available: ${product.rows[0].current_stock}` });
      }
    }
    
    // Create invoice (directly as finalized)
    const newInvoice = await client.query(
      `INSERT INTO sales_invoices (customer_id, type, total_amount, discount_percent, discount_amount, status) 
       VALUES($1, $2, $3, $4, $5, 'finalized') RETURNING *`,
      [customer_id, type || 'cash', totalAmount, discountPercent, discountAmount]
    );
    
    const invoiceId = newInvoice.rows[0].id;
    
    // Add items and update stock
    for (const item of items) {
      const totalPrice = item.quantity * item.unit_price;
      
      // Insert item
      await client.query(
        "INSERT INTO sales_items (invoice_id, product_id, quantity, unit_price, total_price) VALUES($1, $2, $3, $4, $5)",
        [invoiceId, item.product_id, item.quantity, item.unit_price, totalPrice]
      );
      
      // Deduct stock
      await client.query(
        "UPDATE products SET current_stock = current_stock - $1 WHERE id = $2",
        [item.quantity, item.product_id]
      );
      
      // Create stock movement
      await client.query(
        "INSERT INTO stock_movements (product_id, quantity, type, reference_type, reference_id) VALUES ($1, $2, 'out', 'sale', $3)",
        [item.product_id, item.quantity, invoiceId]
      );
    }
    
    // Update customer ledger if credit sale
    if (type === 'credit') {
      await client.query(
        "UPDATE customers SET ledger_balance = ledger_balance + $1 WHERE id = $2",
        [totalAmount, customer_id]
      );
    }
    
    await client.query('COMMIT');
    
    res.json({ id: invoiceId, message: "Invoice created and finalized successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  } finally {
    client.release();
  }
});

// Delete Draft Invoice
router.delete("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if invoice is draft
    const invoice = await pool.query("SELECT status FROM sales_invoices WHERE id = $1", [id]);
    if (invoice.rows[0]?.status !== 'draft') {
      return res.status(400).json("Cannot delete finalized invoice");
    }
    
    await pool.query("DELETE FROM sales_invoices WHERE id = $1", [id]);
    res.json("Invoice deleted");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
