CREATE DATABASE tractor_spare_parts;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50),
    opening_stock INTEGER DEFAULT 0,
    opening_cost DECIMAL(10, 2) DEFAULT 0.00,
    current_stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers Table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'PKR',
    ledger_balance DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    ledger_balance DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Import Invoices Table
CREATE TABLE import_invoices (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    invoice_no VARCHAR(100),
    currency VARCHAR(10),
    exchange_rate DECIMAL(10, 4) DEFAULT 1.0000,
    total_amount DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'draft', -- draft, finalized
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Import Items Table
CREATE TABLE import_items (
    id SERIAL PRIMARY KEY,
    import_invoice_id INTEGER REFERENCES import_invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL
);

-- Sales Invoices Table
CREATE TABLE sales_invoices (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    type VARCHAR(20) DEFAULT 'cash', -- cash, credit
    total_amount DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'draft', -- draft, finalized
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Items Table
CREATE TABLE sales_items (
    id SERIAL PRIMARY KEY,
    sales_invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL
);

-- Payments Table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- customer, supplier
    reference_id INTEGER, -- Can be linked to invoice if needed, or just general payment
    partner_id INTEGER NOT NULL, -- customer_id or supplier_id
    amount DECIMAL(12, 2) NOT NULL,
    method VARCHAR(50) DEFAULT 'cash', -- cash, bank
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Movements Table
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    quantity_change INTEGER NOT NULL,
    movement_type VARCHAR(50) NOT NULL, -- import, sale, adjustment
    reference_id INTEGER, -- invoice id
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Invoice Status & Date Indexes (for filtering and reports)
CREATE INDEX idx_import_invoices_status ON import_invoices(status);
CREATE INDEX idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX idx_import_invoices_created_at ON import_invoices(created_at);
CREATE INDEX idx_sales_invoices_created_at ON sales_invoices(created_at);
CREATE INDEX idx_import_invoices_status_created ON import_invoices(status, created_at);
CREATE INDEX idx_sales_invoices_status_created ON sales_invoices(status, created_at);
CREATE INDEX idx_sales_invoices_type_status ON sales_invoices(type, status);

-- Foreign Key Indexes (for JOINs)
CREATE INDEX idx_import_invoices_supplier_id ON import_invoices(supplier_id);
CREATE INDEX idx_sales_invoices_customer_id ON sales_invoices(customer_id);
CREATE INDEX idx_import_items_invoice ON import_items(import_invoice_id);
CREATE INDEX idx_sales_items_invoice ON sales_items(invoice_id);
CREATE INDEX idx_import_items_product ON import_items(product_id);
CREATE INDEX idx_sales_items_product ON sales_items(product_id);

-- Payments Indexes
CREATE INDEX idx_payments_type ON payments(type);
CREATE INDEX idx_payments_partner ON payments(type, partner_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Stock Movements Indexes
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_ref ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(date);

-- Products Indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_current_stock ON products(current_stock) WHERE current_stock > 0;
CREATE INDEX idx_products_name ON products(name);

-- Ledger Balance Partial Indexes (for receivables/payables reports)
CREATE INDEX idx_customers_balance ON customers(ledger_balance) WHERE ledger_balance > 0;
CREATE INDEX idx_suppliers_balance ON suppliers(ledger_balance) WHERE ledger_balance > 0;
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_suppliers_name ON suppliers(name);

-- User Login Index
CREATE INDEX idx_users_email ON users(email);
