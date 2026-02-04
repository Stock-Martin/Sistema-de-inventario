import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

const productSchema = z.object({
  ean: z.string().min(1),
  code: z.string().min(1),
  description: z.string().min(1),
});

// Get all products
app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM products ORDER BY description ASC'
  ).all();
  return c.json(results);
});

// Get product by EAN or code
app.get('/by-ean/:ean', async (c) => {
  // Limpiar el término de búsqueda de cualquier carácter especial, espacios extra, etc.
  const searchTerm = c.req.param('ean')
    .replace(/[\r\n\t]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim();
  
  console.log('API: Buscando código:', searchTerm, 'Longitud:', searchTerm.length);
  
  // Buscar por EAN o CODE, ignorando mayúsculas/minúsculas y espacios
  const product = await c.env.DB.prepare(
    `SELECT * FROM products 
     WHERE LOWER(REPLACE(TRIM(ean), ' ', '')) = LOWER(REPLACE(?, ' ', ''))
     OR LOWER(REPLACE(TRIM(code), ' ', '')) = LOWER(REPLACE(?, ' ', ''))`
  ).bind(searchTerm, searchTerm).first();
  
  if (!product) {
    console.log('API: ✗ Producto NO encontrado para:', searchTerm);
    return c.json({ error: 'Producto no encontrado' }, 404);
  }
  
  console.log('API: ✓ Producto encontrado:', product);
  return c.json(product);
});

// Create product
app.post('/', zValidator('json', productSchema), async (c) => {
  const data = c.req.valid('json');
  
  try {
    const result = await c.env.DB.prepare(
      'INSERT INTO products (ean, code, description) VALUES (?, ?, ?)'
    ).bind(data.ean, data.code, data.description).run();
    
    return c.json({ id: result.meta.last_row_id, ...data });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'El EAN ya existe' }, 400);
    }
    throw error;
  }
});

// Delete product
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Delete all products
app.delete('/', async (c) => {
  await c.env.DB.prepare('DELETE FROM products').run();
  return c.json({ success: true });
});

// Bulk import products
app.post('/bulk', async (c) => {
  const products = await c.req.json();
  
  if (!Array.isArray(products)) {
    return c.json({ error: 'Se esperaba un array de productos' }, 400);
  }
  
  const stmt = c.env.DB.prepare(
    'INSERT OR REPLACE INTO products (ean, code, description) VALUES (?, ?, ?)'
  );
  
  const batch = products.map(p => stmt.bind(p.ean, p.code, p.description));
  await c.env.DB.batch(batch);
  
  return c.json({ success: true, count: products.length });
});

export default app;
