import { Hono } from 'hono';

type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

// Get all stock records
app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM stock_inventory ORDER BY code ASC'
  ).all();
  return c.json(results);
});

// Import inventory count (carga de inventario)
app.post('/import-inventory', async (c) => {
  const items = await c.req.json();
  
  if (!Array.isArray(items)) {
    return c.json({ error: 'Se esperaba un array de items' }, 400);
  }
  
  // Clear existing data
  await c.env.DB.prepare('DELETE FROM stock_inventory').run();
  
  // Insert inventory counts
  const stmt = c.env.DB.prepare(`
    INSERT INTO stock_inventory (product_id, ean, code, description, counted_quantity)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const batch = items.map(item => 
    stmt.bind(
      item.product_id || 0,
      item.ean || '',
      item.code || '',
      item.description || '',
      item.quantity || 0
    )
  );
  
  await c.env.DB.batch(batch);
  
  return c.json({ success: true, count: items.length });
});

// Import system stock (carga de stock)
app.post('/import-stock', async (c) => {
  const items = await c.req.json();
  
  if (!Array.isArray(items)) {
    return c.json({ error: 'Se esperaba un array de items' }, 400);
  }
  
  // Update system quantities
  for (const item of items) {
    await c.env.DB.prepare(`
      UPDATE stock_inventory 
      SET system_quantity = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE ean = ? OR code = ?
    `).bind(item.quantity || 0, item.ean || '', item.code || '').run();
  }
  
  return c.json({ success: true, count: items.length });
});

// Calculate differences and status
app.post('/calculate', async (c) => {
  await c.env.DB.prepare(`
    UPDATE stock_inventory
    SET difference = COALESCE(counted_quantity, 0) - COALESCE(system_quantity, 0),
        status = CASE
          WHEN COALESCE(counted_quantity, 0) > COALESCE(system_quantity, 0) THEN 'SOBRANTE'
          WHEN COALESCE(counted_quantity, 0) < COALESCE(system_quantity, 0) THEN 'FALTANTE'
          WHEN COALESCE(counted_quantity, 0) = COALESCE(system_quantity, 0) AND COALESCE(counted_quantity, 0) > 0 THEN 'CRUCE'
          ELSE 'SIN_DATOS'
        END,
        updated_at = CURRENT_TIMESTAMP
  `).run();
  
  return c.json({ success: true });
});

// Clear all stock data
app.delete('/', async (c) => {
  await c.env.DB.prepare('DELETE FROM stock_inventory').run();
  return c.json({ success: true });
});

export default app;
