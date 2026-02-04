import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

const inventoryRecordSchema = z.object({
  marbete_number: z.string().min(1),
  product_id: z.number(),
  ean: z.string().min(1),
  quantity: z.number().min(0),
});

// Get records by marbete
app.get('/marbete/:marbete', async (c) => {
  const marbete = c.req.param('marbete');
  
  const { results } = await c.env.DB.prepare(`
    SELECT 
      ir.*,
      p.code,
      p.description
    FROM inventory_records ir
    LEFT JOIN products p ON ir.product_id = p.id
    WHERE ir.marbete_number = ?
    ORDER BY ir.created_at DESC
  `).bind(marbete).all();
  
  return c.json(results);
});

// Create inventory record
app.post('/', zValidator('json', inventoryRecordSchema), async (c) => {
  const data = c.req.valid('json');
  
  const result = await c.env.DB.prepare(`
    INSERT INTO inventory_records (marbete_number, product_id, ean, quantity)
    VALUES (?, ?, ?, ?)
  `).bind(
    data.marbete_number,
    data.product_id,
    data.ean,
    data.quantity
  ).run();
  
  return c.json({ id: result.meta.last_row_id, ...data });
});

// Update inventory record
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const { quantity } = await c.req.json();
  
  await c.env.DB.prepare(
    'UPDATE inventory_records SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(quantity, id).run();
  
  return c.json({ success: true });
});

// Delete inventory record
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM inventory_records WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Delete all records for a marbete
app.delete('/marbete/:marbete', async (c) => {
  const marbete = c.req.param('marbete');
  await c.env.DB.prepare('DELETE FROM inventory_records WHERE marbete_number = ?').bind(marbete).run();
  return c.json({ success: true });
});

export default app;
