const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// ==================== GET ALL RETURNS ====================

// Get All Returns (both customer and supplier)
router.get("/", authorization, async (req, res) => {
    try {
        const { return_type } = req.query;
        
        let query = `
            SELECT 
                r.id,
                r.return_no,
                r.return_type,
                r.invoice_id,
                r.party_id,
                r.total_amount,
                r.reason,
                r.refund_type,
                r.notes,
                r.status,
                r.created_at,
                CASE 
                    WHEN r.return_type = 'customer' THEN c.name
                    WHEN r.return_type = 'supplier' THEN s.name
                END as party_name,
                CASE 
                    WHEN r.return_type = 'customer' THEN 'INV-' || si.id::text
                    WHEN r.return_type = 'supplier' THEN ii.invoice_no
                END as original_invoice_no
            FROM returns r
            LEFT JOIN customers c ON r.return_type = 'customer' AND r.party_id = c.id
            LEFT JOIN suppliers s ON r.return_type = 'supplier' AND r.party_id = s.id
            LEFT JOIN sales_invoices si ON r.return_type = 'customer' AND r.invoice_id = si.id
            LEFT JOIN import_invoices ii ON r.return_type = 'supplier' AND r.invoice_id = ii.id
        `;
        
        if (return_type) {
            query += ` WHERE r.return_type = $1 ORDER BY r.created_at DESC`;
            const result = await pool.query(query, [return_type]);
            return res.json(result.rows);
        }
        
        query += ` ORDER BY r.created_at DESC`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get Single Return with Items
router.get("/:id", authorization, async (req, res) => {
    try {
        const { id } = req.params;
        
        const returnData = await pool.query(`
            SELECT 
                r.*,
                CASE 
                    WHEN r.return_type = 'customer' THEN c.name
                    WHEN r.return_type = 'supplier' THEN s.name
                END as party_name
            FROM returns r
            LEFT JOIN customers c ON r.return_type = 'customer' AND r.party_id = c.id
            LEFT JOIN suppliers s ON r.return_type = 'supplier' AND r.party_id = s.id
            WHERE r.id = $1
        `, [id]);
        
        const items = await pool.query(`
            SELECT ri.*, p.name as product_name, pb.batch_number, pb.expiry_date
            FROM return_items ri 
            LEFT JOIN products p ON ri.product_id = p.id 
            LEFT JOIN product_batches pb ON ri.batch_id = pb.batch_id
            WHERE ri.return_id = $1
        `, [id]);
        
        res.json({ return: returnData.rows[0], items: items.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==================== GET INVOICES BY PARTY ====================

// Get Customer Invoices (with date filter)
router.get("/invoices/customer/:customerId", authorization, async (req, res) => {
    try {
        const { customerId } = req.params;
        const { from_date, to_date } = req.query;
        
        let query = `
            SELECT si.id, 'INV-' || si.id as invoice_no, si.total_amount, si.created_at, c.name as customer_name, si.type
            FROM sales_invoices si
            LEFT JOIN customers c ON si.customer_id = c.id
            WHERE si.customer_id = $1 AND si.status = 'finalized'
        `;
        const params = [customerId];
        
        if (from_date) {
            params.push(from_date);
            query += ` AND DATE(si.created_at) >= $${params.length}`;
        }
        if (to_date) {
            params.push(to_date);
            query += ` AND DATE(si.created_at) <= $${params.length}`;
        }
        
        query += ` ORDER BY si.created_at DESC`;
        
        const invoices = await pool.query(query, params);
        res.json(invoices.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get Supplier Invoices (with date filter)
router.get("/invoices/supplier/:supplierId", authorization, async (req, res) => {
    try {
        const { supplierId } = req.params;
        const { from_date, to_date } = req.query;
        
        let query = `
            SELECT ii.id, ii.invoice_no, ii.total_amount, ii.created_at, s.name as supplier_name
            FROM import_invoices ii
            LEFT JOIN suppliers s ON ii.supplier_id = s.id
            WHERE ii.supplier_id = $1 AND ii.status = 'finalized'
        `;
        const params = [supplierId];
        
        if (from_date) {
            params.push(from_date);
            query += ` AND DATE(ii.created_at) >= $${params.length}`;
        }
        if (to_date) {
            params.push(to_date);
            query += ` AND DATE(ii.created_at) <= $${params.length}`;
        }
        
        query += ` ORDER BY ii.created_at DESC`;
        
        const invoices = await pool.query(query, params);
        res.json(invoices.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==================== GET INVOICE ITEMS FOR RETURN ====================

// Get Customer Invoice Items (shows what can be returned)
router.get("/invoice/customer/:invoiceId", authorization, async (req, res) => {
    try {
        const { invoiceId } = req.params;
        
        const invoice = await pool.query(`
            SELECT si.*, c.name as customer_name 
            FROM sales_invoices si 
            LEFT JOIN customers c ON si.customer_id = c.id 
            WHERE si.id = $1 AND si.status = 'finalized'
        `, [invoiceId]);
        
        if (invoice.rows.length === 0) {
            return res.status(404).json("Invoice not found or not finalized");
        }
        
        const items = await pool.query(`
            SELECT 
                sit.id,
                sit.product_id,
                sit.batch_id,
                p.name as product_name,
                pb.batch_number,
                pb.expiry_date,
                sit.quantity as sold_quantity,
                sit.unit_price,
                sit.total_price,
                COALESCE(returned.returned_qty, 0) as already_returned,
                sit.quantity - COALESCE(returned.returned_qty, 0) as returnable_quantity
            FROM sales_items sit
            LEFT JOIN products p ON sit.product_id = p.id
            LEFT JOIN product_batches pb ON sit.batch_id = pb.batch_id
            LEFT JOIN (
                SELECT ri.product_id, ri.batch_id, r.invoice_id, SUM(ri.quantity) as returned_qty
                FROM return_items ri
                JOIN returns r ON ri.return_id = r.id
                WHERE r.invoice_id = $1 AND r.return_type = 'customer'
                GROUP BY ri.product_id, ri.batch_id, r.invoice_id
            ) returned ON sit.product_id = returned.product_id 
                AND (sit.batch_id = returned.batch_id OR (sit.batch_id IS NULL AND returned.batch_id IS NULL))
                AND sit.invoice_id = returned.invoice_id
            WHERE sit.invoice_id = $1
        `, [invoiceId]);
        
        res.json({ invoice: invoice.rows[0], items: items.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get Supplier Invoice Items (shows what can be returned)
router.get("/invoice/supplier/:invoiceId", authorization, async (req, res) => {
    try {
        const { invoiceId } = req.params;
        
        const invoice = await pool.query(`
            SELECT ii.*, s.name as supplier_name 
            FROM import_invoices ii 
            LEFT JOIN suppliers s ON ii.supplier_id = s.id 
            WHERE ii.id = $1 AND ii.status = 'finalized'
        `, [invoiceId]);
        
        if (invoice.rows.length === 0) {
            return res.status(404).json("Invoice not found or not finalized");
        }
        
        const items = await pool.query(`
            SELECT 
                iit.id,
                iit.product_id,
                iit.batch_id,
                p.name as product_name,
                pb.batch_number,
                pb.expiry_date,
                iit.quantity as purchased_quantity,
                iit.unit_price,
                iit.total_price,
                COALESCE(returned.returned_qty, 0) as already_returned,
                iit.quantity - COALESCE(returned.returned_qty, 0) as returnable_quantity
            FROM import_items iit
            LEFT JOIN products p ON iit.product_id = p.id
            LEFT JOIN product_batches pb ON iit.batch_id = pb.batch_id
            LEFT JOIN (
                SELECT ri.product_id, ri.batch_id, r.invoice_id, SUM(ri.quantity) as returned_qty
                FROM return_items ri
                JOIN returns r ON ri.return_id = r.id
                WHERE r.invoice_id = $1 AND r.return_type = 'supplier'
                GROUP BY ri.product_id, ri.batch_id, r.invoice_id
            ) returned ON iit.product_id = returned.product_id 
                AND (iit.batch_id = returned.batch_id OR (iit.batch_id IS NULL AND returned.batch_id IS NULL))
                AND iit.import_invoice_id = returned.invoice_id
            WHERE iit.import_invoice_id = $1
        `, [invoiceId]);
        
        res.json({ invoice: invoice.rows[0], items: items.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==================== CREATE RETURN ====================

// Create Return (Customer or Supplier)
router.post("/", authorization, async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { return_type, invoice_id, party_id, items, reason, refund_type, notes } = req.body;
        
        if (!return_type || !['customer', 'supplier'].includes(return_type)) {
            return res.status(400).json("Invalid return type. Must be 'customer' or 'supplier'");
        }
        
        if (!items || items.length === 0) {
            return res.status(400).json("At least one item is required for return");
        }
        
        // Calculate total amount
        const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        
        // Generate return number
        const prefix = return_type === 'customer' ? 'CRET' : 'SRET';
        const lastReturn = await client.query(
            `SELECT return_no FROM returns WHERE return_type = $1 ORDER BY id DESC LIMIT 1`,
            [return_type]
        );
        let returnNo = `${prefix}-00001`;
        if (lastReturn.rows.length > 0 && lastReturn.rows[0].return_no) {
            const lastNum = parseInt(lastReturn.rows[0].return_no.split('-')[1]);
            returnNo = `${prefix}-${String(lastNum + 1).padStart(5, '0')}`;
        }
        
        // Create return record
        const newReturn = await client.query(
            `INSERT INTO returns (return_no, return_type, invoice_id, party_id, total_amount, reason, refund_type, notes, status) 
             VALUES($1, $2, $3, $4, $5, $6, $7, $8, 'completed') RETURNING *`,
            [returnNo, return_type, invoice_id, party_id, total_amount, reason, refund_type, notes]
        );
        
        const returnId = newReturn.rows[0].id;
        
        // Insert return items and update stock
        for (const item of items) {
            // Insert return item with batch_id
            await client.query(
                `INSERT INTO return_items (return_id, product_id, quantity, unit_price, total_price, batch_id) 
                 VALUES($1, $2, $3, $4, $5, $6)`,
                [returnId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price, item.batch_id || null]
            );
            
            if (return_type === 'customer') {
                // CUSTOMER RETURN: Add stock back (items coming back to us)
                await client.query(
                    "UPDATE products SET current_stock = current_stock + $1 WHERE id = $2",
                    [item.quantity, item.product_id]
                );
                
                // Also add stock back to the batch if batch_id exists
                if (item.batch_id) {
                    await client.query(
                        "UPDATE product_batches SET quantity = quantity + $1 WHERE batch_id = $2",
                        [item.quantity, item.batch_id]
                    );
                }
                
                // Record stock movement
                await client.query(
                    `INSERT INTO stock_movements (product_id, quantity, type, reference_type, reference_id) 
                     VALUES($1, $2, 'return_in', 'customer_return', $3)`,
                    [item.product_id, item.quantity, returnId]
                );
            } else {
                // SUPPLIER RETURN: Remove stock (items going back to supplier)
                await client.query(
                    "UPDATE products SET current_stock = current_stock - $1 WHERE id = $2",
                    [item.quantity, item.product_id]
                );
                
                // Also remove stock from the batch if batch_id exists
                if (item.batch_id) {
                    await client.query(
                        "UPDATE product_batches SET quantity = quantity - $1 WHERE batch_id = $2",
                        [item.quantity, item.batch_id]
                    );
                }
                
                // Record stock movement
                await client.query(
                    `INSERT INTO stock_movements (product_id, quantity, type, reference_type, reference_id) 
                     VALUES($1, $2, 'return_out', 'supplier_return', $3)`,
                    [item.product_id, item.quantity, returnId]
                );
            }
        }
        
        // Update ledger balance
        if (return_type === 'customer') {
            // Customer return: Reduce customer's ledger balance (credit to customer)
            await client.query(
                "UPDATE customers SET ledger_balance = ledger_balance - $1 WHERE id = $2",
                [total_amount, party_id]
            );
            
            // Record payment if cash refund
            if (refund_type === 'cash') {
                await client.query(
                    `INSERT INTO payments (type, reference_id, partner_id, amount, method, notes) 
                     VALUES('customer_refund', $1, $2, $3, 'cash', $4)`,
                    [returnId, party_id, total_amount, `Refund for return ${returnNo}`]
                );
            }
        } else {
            // Supplier return: Reduce supplier's ledger balance (we owe them less)
            await client.query(
                "UPDATE suppliers SET ledger_balance = ledger_balance - $1 WHERE id = $2",
                [total_amount, party_id]
            );
            
            // Record as supplier credit
            if (refund_type === 'credit') {
                await client.query(
                    `INSERT INTO payments (type, reference_id, partner_id, amount, method, notes) 
                     VALUES('supplier_credit', $1, $2, $3, 'adjustment', $4)`,
                    [returnId, party_id, total_amount, `Credit for return ${returnNo}`]
                );
            }
        }
        
        await client.query('COMMIT');
        
        res.json({ 
            message: "Return created successfully", 
            return: newReturn.rows[0],
            return_no: returnNo
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Server Error: " + err.message);
    } finally {
        client.release();
    }
});

// ==================== STATISTICS ====================

// Get Return Statistics
router.get("/stats/summary", authorization, async (req, res) => {
    try {
        const customerStats = await pool.query(`
            SELECT 
                COUNT(*) as total_returns,
                COALESCE(SUM(total_amount), 0) as total_amount
            FROM returns
            WHERE return_type = 'customer'
        `);
        
        const supplierStats = await pool.query(`
            SELECT 
                COUNT(*) as total_returns,
                COALESCE(SUM(total_amount), 0) as total_amount
            FROM returns
            WHERE return_type = 'supplier'
        `);
        
        const byReason = await pool.query(`
            SELECT reason, return_type, COUNT(*) as count, SUM(total_amount) as amount
            FROM returns
            WHERE reason IS NOT NULL
            GROUP BY reason, return_type
            ORDER BY count DESC
        `);
        
        res.json({ 
            customer: customerStats.rows[0],
            supplier: supplierStats.rows[0],
            byReason: byReason.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
