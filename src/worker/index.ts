import { Hono } from "hono";
import products from "./routes/products";
import inventory from "./routes/inventory";
import tintometric from "./routes/tintometric";
import stock from "./routes/stock";

const app = new Hono<{ Bindings: Env }>();

app.route('/api/products', products);
app.route('/api/inventory', inventory);
app.route('/api/tintometric', tintometric);
app.route('/api/stock', stock);

export default app;
