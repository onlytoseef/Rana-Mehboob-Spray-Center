require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addIndexes() {
  const client = await pool.connect();
  
  try {
    console.log("🚀 Adding performance indexes...\n");

    const indexes = [
      // ============ INVOICES ============
      // For filtering by status (draft/finalized)
      "CREATE INDEX IF NOT EXISTS idx_import_invoices_status ON import_invoices(status)",
      "CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status)",
      
      // For date range queries (daily reports, dashboard)
      "CREATE INDEX IF NOT EXISTS idx_import_invoices_created_at ON import_invoices(created_at)",
      "CREATE INDEX IF NOT EXISTS idx_sales_invoices_created_at ON sales_invoices(created_at)",
      
      // For filtering by supplier/customer
      "CREATE INDEX IF NOT EXISTS idx_import_invoices_supplier_id ON import_invoices(supplier_id)",
      "CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON sales_invoices(customer_id)",
      
      // Composite index for common query patterns
      "CREATE INDEX IF NOT EXISTS idx_import_invoices_status_created ON import_invoices(status, created_at)",
      "CREATE INDEX IF NOT EXISTS idx_sales_invoices_status_created ON sales_invoices(status, created_at)",
      "CREATE INDEX IF NOT EXISTS idx_sales_invoices_type_status ON sales_invoices(type, status)",

      // ============ ITEMS ============
      // For getting items by invoice
      "CREATE INDEX IF NOT EXISTS idx_import_items_invoice ON import_items(import_invoice_id)",
      "CREATE INDEX IF NOT EXISTS idx_sales_items_invoice ON sales_items(invoice_id)",
      
      // For product lookups in items
      "CREATE INDEX IF NOT EXISTS idx_import_items_product ON import_items(product_id)",
      "CREATE INDEX IF NOT EXISTS idx_sales_items_product ON sales_items(product_id)",

      // ============ PAYMENTS ============
      // For filtering by type (customer/supplier)
      "CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type)",
      
      // For partner lookups
      "CREATE INDEX IF NOT EXISTS idx_payments_partner ON payments(type, partner_id)",
      
      // For date range queries
      "CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)",

      // ============ STOCK MOVEMENTS ============
      // For product history
      "CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)",
      
      // For reference lookups
      "CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON stock_movements(reference_type, reference_id)",
      
      // For date queries
      "CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(date)",

      // ============ PRODUCTS ============
      // For category filtering
      "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)",
      
      // For stock reports (products with stock)
      "CREATE INDEX IF NOT EXISTS idx_products_current_stock ON products(current_stock) WHERE current_stock > 0",

      // ============ CUSTOMERS & SUPPLIERS ============
      // For ledger reports (balance > 0)
      "CREATE INDEX IF NOT EXISTS idx_customers_balance ON customers(ledger_balance) WHERE ledger_balance > 0",
      "CREATE INDEX IF NOT EXISTS idx_suppliers_balance ON suppliers(ledger_balance) WHERE ledger_balance > 0",
      
      // For name searches
      "CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)",
      "CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name)",
      "CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)",

      // ============ USERS ============
      // For login by email
      "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"
    ];

    for (const indexSql of indexes) {
      try {
        await client.query(indexSql);
        const indexName = indexSql.match(/idx_\w+/)?.[0] || 'unknown';
        console.log(`✅ ${indexName}`);
      } catch (err) {
        console.log(`⚠️  ${err.message}`);
      }
    }

    console.log("\n✨ All indexes created successfully!");
    
    // Show index count
    const indexCount = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
    `);
    
    console.log(`\n📊 Total custom indexes: ${indexCount.rows[0].count}`);

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addIndexes();
