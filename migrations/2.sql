
CREATE TABLE inventory_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  marbete_number TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  ean TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_marbete ON inventory_records(marbete_number);
CREATE INDEX idx_inventory_product ON inventory_records(product_id);
