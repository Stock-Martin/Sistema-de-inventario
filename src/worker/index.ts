import { Hono } from "hono";
import { cors } from "hono/cors"; // Importamos el permiso
import products from "./routes/products";
import inventory from "./routes/inventory";
import tintometric from "./routes/tintometric";
import stock from "./routes/stock";

const app = new Hono<{ Bindings: Env }>();

// ESTO ES LO QUE FALTA: Permite que cualquier dispositivo se conecte
app.use("*", cors({
  origin: "*", 
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.route('/api/products', products);
app.route('/api/inventory', inventory);
app.route('/api/tintometric', tintometric);
app.route('/api/stock', stock);

export default app;