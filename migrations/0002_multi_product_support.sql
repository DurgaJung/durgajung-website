ALTER TABLE orders ADD COLUMN product_type TEXT NOT NULL DEFAULT 'software';

ALTER TABLE orders ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;

ALTER TABLE orders ADD COLUMN unit_price_npr REAL;

ALTER TABLE orders ADD COLUMN delivery_format TEXT;

ALTER TABLE orders ADD COLUMN delivery_method TEXT;

ALTER TABLE orders ADD COLUMN delivery_status TEXT DEFAULT 'pending';

ALTER TABLE orders ADD COLUMN tracking_reference TEXT;


ALTER TABLE sales ADD COLUMN product_type TEXT NOT NULL DEFAULT 'software';

ALTER TABLE sales ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;

ALTER TABLE sales ADD COLUMN unit_price_npr REAL;

ALTER TABLE sales ADD COLUMN delivery_format TEXT;

ALTER TABLE sales ADD COLUMN delivery_method TEXT;

ALTER TABLE sales ADD COLUMN delivery_status TEXT DEFAULT 'pending';

ALTER TABLE sales ADD COLUMN tracking_reference TEXT;


CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_code TEXT NOT NULL UNIQUE,
  product_type TEXT NOT NULL,
  product_name TEXT NOT NULL,
  description TEXT,
  price_npr REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  cover_image_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS software_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL UNIQUE,
  version TEXT,
  installer_file_url TEXT,
  installation_guide_url TEXT,
  user_manual_url TEXT,
  licence_required INTEGER NOT NULL DEFAULT 1,
  licence_type_default TEXT DEFAULT 'customer',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS book_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL UNIQUE,
  author_name TEXT,
  isbn TEXT,
  language TEXT,
  print_available INTEGER NOT NULL DEFAULT 0,
  pdf_available INTEGER NOT NULL DEFAULT 0,
  epub_available INTEGER NOT NULL DEFAULT 0,
  stock_quantity INTEGER,
  pdf_file_url TEXT,
  epub_file_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_products_type
ON products(product_type);

CREATE INDEX IF NOT EXISTS idx_products_status
ON products(status);

CREATE INDEX IF NOT EXISTS idx_orders_product_type
ON orders(product_type);

CREATE INDEX IF NOT EXISTS idx_sales_product_type
ON sales(product_type);
