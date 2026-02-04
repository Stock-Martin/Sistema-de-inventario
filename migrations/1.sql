
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ean TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_ean ON products(ean);
CREATE INDEX idx_products_code ON products(code);
