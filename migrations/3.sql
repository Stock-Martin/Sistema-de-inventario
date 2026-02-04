
CREATE TABLE tintometric_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sucursal TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  ean TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tintometric_sucursal ON tintometric_records(sucursal);
CREATE INDEX idx_tintometric_product ON tintometric_records(product_id);
