import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

const tintometricRecordSchema = z.object({
  sucursal: z.string().min(1),
  product_id: z.number(),
  ean: z.string().min(1),
  quantity: z.number().min(0),
});

// Get records by sucursal
app.get('/sucursal/:sucursal', async (c) => {
  const sucursal = c.req.param('sucursal');
  
  const { results } = await c.env.DB.prepare(`
    SELECT 
      tr.*,
      p.code,
      p.description
    FROM tintometric_records tr
    LEFT JOIN products p ON tr.product_id = p.id
    WHERE tr.sucursal = ?
    ORDER BY tr.created_at DESC
  `).bind(sucursal).all();
  
  return c.json(results);
});

// Create tintometric record
app.post('/', zValidator('json', tintometricRecordSchema), async (c) => {
  const data = c.req.valid('json');
  
  const result = await c.env.DB.prepare(`
    INSERT INTO tintometric_records (sucursal, product_id, ean, quantity)
    VALUES (?, ?, ?, ?)
  `).bind(
    data.sucursal,
    data.product_id,
    data.ean,
    data.quantity
  ).run();
  
  return c.json({ id: result.meta.last_row_id, ...data });
});

// Update tintometric record
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const { quantity } = await c.req.json();
  
  await c.env.DB.prepare(
    'UPDATE tintometric_records SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(quantity, id).run();
  
  return c.json({ success: true });
});

// Delete tintometric record
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM tintometric_records WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Delete all records for a sucursal
app.delete('/sucursal/:sucursal', async (c) => {
  const sucursal = c.req.param('sucursal');
  await c.env.DB.prepare('DELETE FROM tintometric_records WHERE sucursal = ?').bind(sucursal).run();
  return c.json({ success: true });
});

export default app;
