PRAGMA foreign_keys = ON;

-- =========================================================
-- MERO MANDALI ADMIN / SALES DATABASE
-- Version: 1.0
-- Final customer price: NPR 5,000
-- VAT: NOT USED
-- =========================================================


-- =========================================================
-- 1. ORDERS
-- Customer purchase/payment submissions
-- =========================================================

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    order_number TEXT NOT NULL UNIQUE,

    product_code TEXT NOT NULL DEFAULT 'MERO-MANDALI',
    product_name TEXT NOT NULL DEFAULT 'Mero Mandali',

    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    church_organization TEXT,

    amount_npr REAL NOT NULL DEFAULT 5000.00,

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'under_review',
            'approved',
            'rejected',
            'completed',
            'cancelled'
        )),

    customer_notes TEXT,
    admin_notes TEXT,

    submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TEXT,
    approved_at TEXT,
    rejected_at TEXT,
    completed_at TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 2. PAYMENTS
-- Payment information and receipt/proof
-- =========================================================

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    order_id INTEGER NOT NULL,

    payment_method TEXT NOT NULL,
    transaction_reference TEXT,

    amount_npr REAL NOT NULL DEFAULT 5000.00,

    payment_date TEXT,

    receipt_file_url TEXT,
    receipt_file_name TEXT,

    status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (status IN (
            'submitted',
            'under_review',
            'confirmed',
            'rejected'
        )),

    confirmed_by TEXT,
    confirmed_at TEXT,
    rejected_at TEXT,

    admin_notes TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 3. SALES
-- Permanent completed sales register
-- One row per approved/completed customer sale
-- =========================================================

CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    sale_number TEXT NOT NULL UNIQUE,

    order_id INTEGER NOT NULL UNIQUE,
    payment_id INTEGER,

    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    church_organization TEXT,

    product_code TEXT NOT NULL DEFAULT 'MERO-MANDALI',
    product_name TEXT NOT NULL DEFAULT 'Mero Mandali',

    total_paid_npr REAL NOT NULL DEFAULT 5000.00,

    payment_method TEXT,
    transaction_reference TEXT,
    payment_date TEXT,

    invoice_number TEXT UNIQUE,

    licence_id INTEGER,
    licence_key TEXT,

    licence_type TEXT DEFAULT 'customer'
        CHECK (licence_type IN (
            'customer'
        )),

    licence_status TEXT DEFAULT 'pending'
        CHECK (licence_status IN (
            'pending',
            'active',
            'disabled',
            'reset',
            'expired',
            'not_issued'
        )),

    device_id TEXT,
    reset_count INTEGER NOT NULL DEFAULT 0,

    invoice_sent INTEGER NOT NULL DEFAULT 0
        CHECK (invoice_sent IN (0,1)),

    licence_email_sent INTEGER NOT NULL DEFAULT 0
        CHECK (licence_email_sent IN (0,1)),

    installer_sent INTEGER NOT NULL DEFAULT 0
        CHECK (installer_sent IN (0,1)),

    installation_guide_sent INTEGER NOT NULL DEFAULT 0
        CHECK (installation_guide_sent IN (0,1)),

    user_manual_sent INTEGER NOT NULL DEFAULT 0
        CHECK (user_manual_sent IN (0,1)),

    approved_by TEXT,
    approved_at TEXT,

    notes TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (payment_id)
        REFERENCES payments(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 4. INVOICES
-- Numbered invoices generated after payment confirmation
-- =========================================================

CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    invoice_number TEXT NOT NULL UNIQUE,

    sale_id INTEGER NOT NULL UNIQUE,
    order_id INTEGER NOT NULL,

    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,

    product_name TEXT NOT NULL DEFAULT 'Mero Mandali',

    amount_npr REAL NOT NULL DEFAULT 5000.00,

    invoice_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    pdf_file_url TEXT,
    pdf_file_name TEXT,

    signed_by TEXT NOT NULL DEFAULT 'Durga Jung Kunwar',
    signature_file_url TEXT,

    email_sent INTEGER NOT NULL DEFAULT 0
        CHECK (email_sent IN (0,1)),

    email_sent_at TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sale_id)
        REFERENCES sales(id)
        ON DELETE CASCADE,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT
);


-- =========================================================
-- 5. DELIVERY HISTORY
-- Tracks what was sent to each customer
-- =========================================================

CREATE TABLE IF NOT EXISTS delivery_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    sale_id INTEGER NOT NULL,
    order_id INTEGER,

    delivery_type TEXT NOT NULL
        CHECK (delivery_type IN (
            'licence',
            'invoice',
            'installer',
            'installation_guide',
            'user_manual',
            'complete_package'
        )),

    recipient_email TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'sent',
            'failed'
        )),

    email_provider TEXT,
    provider_message_id TEXT,

    error_message TEXT,

    sent_at TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sale_id)
        REFERENCES sales(id)
        ON DELETE CASCADE,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 6. ADMIN ACTIVITY LOG
-- Owner/admin audit history
-- =========================================================

CREATE TABLE IF NOT EXISTS admin_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    admin_email TEXT NOT NULL,

    action TEXT NOT NULL,

    entity_type TEXT,
    entity_id INTEGER,

    description TEXT,

    ip_address TEXT,
    user_agent TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_email
ON orders(customer_email);

CREATE INDEX IF NOT EXISTS idx_orders_submitted_at
ON orders(submitted_at);

CREATE INDEX IF NOT EXISTS idx_payments_order_id
ON payments(order_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
ON payments(status);

CREATE INDEX IF NOT EXISTS idx_sales_order_id
ON sales(order_id);

CREATE INDEX IF NOT EXISTS idx_sales_email
ON sales(customer_email);

CREATE INDEX IF NOT EXISTS idx_sales_licence_key
ON sales(licence_key);

CREATE INDEX IF NOT EXISTS idx_sales_created_at
ON sales(created_at);

CREATE INDEX IF NOT EXISTS idx_invoices_sale_id
ON invoices(sale_id);

CREATE INDEX IF NOT EXISTS idx_delivery_sale_id
ON delivery_history(sale_id);

CREATE INDEX IF NOT EXISTS idx_admin_activity_date
ON admin_activity(created_at);


-- =========================================================
-- IMPORTANT:
--
-- The unlimited OWNER licence is deliberately NOT stored
-- in the customer SALES table.
--
-- Owner licensing will be handled separately by the
-- Mero Mandali licence system.
-- =========================================================
