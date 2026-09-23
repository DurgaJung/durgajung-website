CREATE TABLE IF NOT EXISTS license_installs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_code TEXT NOT NULL,
  product_name TEXT,
  license_key TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  sale_number TEXT,
  sale_id INTEGER,
  device_id TEXT,
  device_label TEXT,
  install_status TEXT NOT NULL DEFAULT 'not_installed',
  activated_at TEXT,
  last_seen_at TEXT,
  last_synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_license_installs_key
ON license_installs(license_key);

CREATE INDEX IF NOT EXISTS idx_license_installs_sale
ON license_installs(sale_id);

CREATE INDEX IF NOT EXISTS idx_license_installs_email
ON license_installs(customer_email);
