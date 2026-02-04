
CREATE TABLE stock_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  ean TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  counted_quantity INTEGER,
  system_quantity INTEGER,
  difference INTEGER,
  status TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_inventory_product_id ON stock_inventory(product_id);
CREATE INDEX idx_stock_inventory_ean ON stock_inventory(ean);
CREATE INDEX idx_stock_inventory_status ON stock_inventory(status);
