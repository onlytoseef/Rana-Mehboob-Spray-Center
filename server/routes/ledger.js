const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// Get all customers with ledger summary
router.get("/customers", authorization, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.id,
                c.name,
                c.phone,
                COUNT(DISTINCT si.id) as total_invoices,
                COALESCE(SUM(si.total_amount), 0) as total_purchase,
                COALESCE(SUM(CASE WHEN si.type = 'cash' THEN si.total_amount ELSE 0 END), 0) as total_cash,
                COALESCE(SUM(CASE WHEN si.type = 'credit' THEN si.total_amount ELSE 0 END), 0) as total_credit,
                COALESCE((
                    SELECT SUM(p.amount) 
                    FROM payments p 
                    WHERE p.type = 'customer' AND p.partner_id = c.id
                ), 0) as total_paid,
                c.ledger_balance as balance
            FROM customers c
            LEFT JOIN sales_invoices si ON c.id = si.customer_id
            GROUP BY c.id
            ORDER BY c.name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single customer ledger details
router.get("/customer/:id", authorization, async (req, res) => {
    const { id } = req.params;
    
    try {
        // Get customer info
        const customerResult = await pool.query(
            "SELECT id, name, phone FROM customers WHERE id = $1",
            [id]
        );
        
        if (customerResult.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        
        const customer = customerResult.rows[0];

        // Get all invoices for this customer
        const invoicesResult = await pool.query(`
            SELECT 
                si.id,
                'INV-' || LPAD(si.id::text, 5, '0') as invoice_number,
                si.created_at as date,
                si.type,
                si.total_amount,
                COUNT(sit.id) as items_count
            FROM sales_invoices si
            LEFT JOIN sales_items sit ON si.id = sit.invoice_id
            WHERE si.customer_id = $1
            GROUP BY si.id
            ORDER BY si.created_at DESC
        `, [id]);

        // Get all payments from this customer
        const paymentsResult = await pool.query(`
            SELECT 
                id,
                amount,
                method as payment_type,
                '' as reference,
                '' as notes,
                created_at
            FROM payments
            WHERE type = 'customer' AND partner_id = $1
            ORDER BY created_at DESC
        `, [id]);

        // Calculate summary
        const summaryResult = await pool.query(`
            SELECT 
                COUNT(DISTINCT si.id) as total_invoices,
                COALESCE(SUM(si.total_amount), 0) as total_purchase,
                COALESCE(SUM(CASE WHEN si.type = 'cash' THEN si.total_amount ELSE 0 END), 0) as total_cash,
                COALESCE(SUM(CASE WHEN si.type = 'credit' THEN si.total_amount ELSE 0 END), 0) as total_credit,
                COALESCE((
                    SELECT SUM(p.amount) 
                    FROM payments p 
                    WHERE p.type = 'customer' AND p.partner_id = $1
                ), 0) as total_paid,
                COALESCE((
                    SELECT SUM(r.total_amount) 
                    FROM returns r 
                    WHERE r.return_type = 'customer' AND r.party_id = $1
                ), 0) as total_returns,
                c.ledger_balance as balance
            FROM customers c
            LEFT JOIN sales_invoices si ON c.id = si.customer_id
            WHERE c.id = $1
            GROUP BY c.id
        `, [id]);

        // Get all returns for this customer
        const returnsResult = await pool.query(`
            SELECT 
                r.id,
                r.return_no,
                r.total_amount,
                r.reason,
                r.refund_type,
                r.created_at
            FROM returns r
            WHERE r.return_type = 'customer' AND r.party_id = $1
            ORDER BY r.created_at DESC
        `, [id]);

        const summary = summaryResult.rows[0] || {
            total_invoices: 0,
            total_purchase: 0,
            total_cash: 0,
            total_credit: 0,
            total_paid: 0,
            total_returns: 0,
            balance: 0
        };

        res.json({
            customer,
            invoices: invoicesResult.rows,
            payments: paymentsResult.rows,
            returns: returnsResult.rows,
            summary
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== SUPPLIER LEDGER ====================

// Get all suppliers with ledger summary
router.get("/suppliers", authorization, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.id,
                s.name,
                s.phone,
                COUNT(DISTINCT ii.id) as total_invoices,
                COALESCE(SUM(ii.total_amount), 0) as total_imports,
                COALESCE((
                    SELECT SUM(p.amount) 
                    FROM payments p 
                    WHERE p.type = 'supplier' AND p.partner_id = s.id
                ), 0) as total_paid,
                s.ledger_balance as balance
            FROM suppliers s
            LEFT JOIN import_invoices ii ON s.id = ii.supplier_id AND ii.status = 'finalized'
            GROUP BY s.id
            ORDER BY s.name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single supplier ledger details
router.get("/supplier/:id", authorization, async (req, res) => {
    const { id } = req.params;
    
    try {
        // Get supplier info
        const supplierResult = await pool.query(
            "SELECT id, name, phone FROM suppliers WHERE id = $1",
            [id]
        );
        
        if (supplierResult.rows.length === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        
        const supplier = supplierResult.rows[0];

        // Get all import invoices for this supplier
        const invoicesResult = await pool.query(`
            SELECT 
                ii.id,
                ii.invoice_no,
                ii.created_at as date,
                ii.total_amount,
                ii.status,
                COUNT(iit.id) as items_count
            FROM import_invoices ii
            LEFT JOIN import_items iit ON ii.id = iit.import_invoice_id
            WHERE ii.supplier_id = $1
            GROUP BY ii.id
            ORDER BY ii.created_at DESC
        `, [id]);

        // Get all payments to this supplier
        const paymentsResult = await pool.query(`
            SELECT 
                id,
                amount,
                method as payment_type,
                notes,
                created_at
            FROM payments
            WHERE type = 'supplier' AND partner_id = $1
            ORDER BY created_at DESC
        `, [id]);

        // Get all returns to this supplier
        const returnsResult = await pool.query(`
            SELECT 
                r.id,
                r.return_no,
                r.total_amount,
                r.reason,
                r.refund_type,
                r.created_at
            FROM returns r
            WHERE r.return_type = 'supplier' AND r.party_id = $1
            ORDER BY r.created_at DESC
        `, [id]);

        // Calculate summary
        const summaryResult = await pool.query(`
            SELECT 
                COUNT(DISTINCT ii.id) as total_invoices,
                COALESCE(SUM(ii.total_amount), 0) as total_imports,
                COALESCE((
                    SELECT SUM(p.amount) 
                    FROM payments p 
                    WHERE p.type = 'supplier' AND p.partner_id = $1
                ), 0) as total_paid,
                COALESCE((
                    SELECT SUM(r.total_amount) 
                    FROM returns r 
                    WHERE r.return_type = 'supplier' AND r.party_id = $1
                ), 0) as total_returns,
                s.ledger_balance as balance
            FROM suppliers s
            LEFT JOIN import_invoices ii ON s.id = ii.supplier_id AND ii.status = 'finalized'
            WHERE s.id = $1
            GROUP BY s.id
        `, [id]);

        const summary = summaryResult.rows[0] || {
            total_invoices: 0,
            total_imports: 0,
            total_paid: 0,
            total_returns: 0,
            balance: 0
        };

        res.json({
            supplier,
            invoices: invoicesResult.rows,
            payments: paymentsResult.rows,
            returns: returnsResult.rows,
            summary
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
