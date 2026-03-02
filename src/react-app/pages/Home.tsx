import { useState, useRef } from 'react';
// CORRECCIÓN IMPORTANTE: Importación desde 'lucide-react' para evitar error de Vite
import { Package, Droplet, Database, Trash2, Search } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useInventory } from '../hooks/useInventory';

type Tab = 'inventario' | 'tintometrico' | 'productos' | 'stock';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('inventario');

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white font-sans">
      {/* Navegación Original */}
      <div className="bg-[#1a1f3a] border-b-2 border-cyan-500/30">
        <div className="max-w-[1800px] mx-auto px-4 flex gap-1">
          {(['inventario', 'tintometrico', 'productos', 'stock'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-6 py-4 font-bold transition-all relative uppercase text-[11px] tracking-widest ${
                activeTab === tab ? 'text-cyan-400 bg-[#0f1229]' : 'text-cyan-600 hover:text-cyan-400'
              }`}
            >
              {tab === 'inventario' && <Package className="w-4 h-4" />}
              {tab === 'tintometrico' && <Droplet className="w-4 h-4" />}
              {tab === 'productos' && <Database className="w-4 h-4" />}
              {tab === 'stock' && <Package className="w-4 h-4" />}
              <span>{tab}</span>
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500" />}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
        {activeTab === 'inventario' && <InventarioTab />}
        {activeTab === 'productos' && <ProductosTab />}
        {activeTab === 'tintometrico' && <div className="text-center p-20 text-cyan-500 font-bold uppercase">Módulo Tintométrico</div>}
        {activeTab === 'stock' && <div className="text-center p-20 text-cyan-500 font-bold uppercase">Módulo de Stock</div>}
      </div>
    </div>
  );
}

function InventarioTab() {
  const [marbeteNumber, setMarbeteNumber] = useState('000000');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState('');
  const [foundProduct, setFoundProduct] = useState<any>(null);
  
  const skuInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { findProductByEan } = useProducts();
  const { records, addRecord, deleteRecord, clearAll } = useInventory(marbeteNumber);

  const handleSkuChange = async (value: string) => {
    const cleanedValue = value.trim().toUpperCase();
    setSku(cleanedValue);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(async () => {
      if (!cleanedValue) {
        setFoundProduct(null);
        return;
      }
      const product = await findProductByEan(cleanedValue);
      if (product) {
        setFoundProduct(product);
        // Salto automático a cantidad al encontrar producto
        setTimeout(() => quantityInputRef.current?.focus(), 100);
      } else {
        setFoundProduct(null);
      }
    }, 300);
  };

  const handleQuantitySubmit = async () => {
    // 1. Validación: Asegurarse de que haya producto y cantidad válida
    const qty = parseInt(quantity);
    if (!foundProduct || isNaN(qty) || qty <= 0) {
      alert("Por favor, ingrese una cantidad válida y asegúrese de que el producto exista.");
      return;
    }

    try {
      // 2. Ejecutar el guardado
      await addRecord({
        marbete_number: marbeteNumber,
        product_id: foundProduct.id,
        ean: foundProduct.ean,
        code: foundProduct.code,
        description: foundProduct.description,
        quantity: qty,
      });

      // 3. Limpiar estados SOLO después de confirmar el guardado
      setSku('');
      setQuantity('');
      setFoundProduct(null);
      
      // 4. Devolver el foco al input de SKU para el siguiente producto
      setTimeout(() => skuInputRef.current?.focus(), 100);
      
    } catch (error) {
      console.error("Error al guardar el registro:", error);
      alert("No se pudo guardar el registro en la base de datos.");
    }
  };
  return (
    <div className="bg-[#1a1f3a] rounded-xl border border-cyan-500/20 p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-8 h-8 text-cyan-400" />
        <div>
          <h2 className="text-2xl font-bold text-cyan-400 uppercase tracking-tight">Inventario</h2>
          <p className="text-[10px] text-cyan-300/50 font-bold uppercase tracking-widest">✦ Sistema de Conteo General</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="text-cyan-300 text-[10px] font-bold uppercase mb-2 block tracking-widest">✦ Número de Marbete</label>
        <div className="bg-[#0a0e27] border border-cyan-500/20 rounded-lg p-6 text-center shadow-inner">
          <span className="text-6xl font-bold text-purple-300 tracking-tighter">{marbeteNumber}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-cyan-400 text-[10px] font-bold uppercase mb-1 block">Código de artículo o barra</label>
          <input
            ref={skuInputRef}
            type="text"
            value={sku}
            onChange={(e) => handleSkuChange(e.target.value)}
            placeholder="Escanea o ingresa el código..."
            className="w-full bg-[#0a0e27] border border-cyan-500/40 rounded px-4 py-3 text-cyan-300 focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>

        {foundProduct && (
          <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded text-purple-200 text-xs font-bold uppercase">
            PRODUCTO: {foundProduct.description}
          </div>
        )}

        <div>
          <label className="text-cyan-400 text-[10px] font-bold uppercase mb-1 block">Cantidad</label>
          <input
            ref={quantityInputRef}
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuantitySubmit()}
            className="w-full bg-[#0a0e27] border border-purple-500/40 rounded px-4 py-3 text-purple-300 text-center text-3xl font-bold focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleQuantitySubmit}
            className="bg-[#00a3a3] hover:bg-[#00c2c2] text-white font-bold py-4 rounded uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg"
          >
            Ingresar Datos
          </button>
          <button 
            onClick={clearAll}
            className="bg-[#e63946] hover:bg-red-500 text-white font-bold py-4 rounded uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg"
          >
            Limpiar Todo
          </button>
        </div>
      </div>

      {/* REGISTRO DE MERCADERÍA - Estética de tus fotos */}
      <div className="mt-8 bg-[#151a33] rounded-lg border border-purple-500/20 p-4 shadow-xl">
        <h3 className="text-purple-300 font-bold mb-4 uppercase text-xs tracking-wider">Registro de Mercadería</h3>
        <div className="grid grid-cols-[140px_1fr_80px_70px] gap-4 p-2 bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 font-bold text-[10px] uppercase rounded-t">
          <div>Código Art.</div>
          <div>Descripción</div>
          <div className="text-center">Cant.</div>
          <div className="text-center">Acciones</div>
        </div>
        <div className="bg-[#0a0e27]/60 rounded-b border-x border-b border-purple-500/10 max-h-[350px] overflow-auto">
          {records.length === 0 ? (
            <p className="p-10 text-center text-purple-400/30 font-bold uppercase text-[10px] tracking-widest">No hay registros</p>
          ) : (
            records.map((r) => (
              <div key={r.id} className="grid grid-cols-[140px_1fr_80px_70px] gap-4 p-3 border-b border-white/5 items-center hover:bg-white/5 transition-colors">
                <div className="text-cyan-300 font-mono text-[11px] font-bold">{r.code}</div>
                <div className="text-white text-[11px] truncate uppercase font-medium">{r.description}</div>
                <div className="text-center text-purple-300 font-bold text-lg">{r.quantity}</div>
                <button 
                  onClick={() => deleteRecord(r.id)} 
                  className="bg-[#e63946] hover:bg-red-600 text-white p-2 rounded w-8 h-8 mx-auto flex items-center justify-center shadow-md active:scale-90"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ProductosTab() {
  const { products, deleteProduct, deleteAllProducts } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => 
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#1a1f3a] rounded-xl border border-cyan-500/20 p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6 text-cyan-400">
        <Database className="w-8 h-8" />
        <h2 className="text-2xl font-bold uppercase tracking-tight">Productos</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input type="text" placeholder="CÓDIGO ARTÍCULO" className="bg-[#0a0e27] border border-purple-500/30 rounded p-3 text-[10px] text-purple-200 uppercase font-bold focus:outline-none" />
        <input type="text" placeholder="DESCRIPCIÓN" className="bg-[#0a0e27] border border-purple-500/30 rounded p-3 text-[10px] text-purple-200 uppercase font-bold focus:outline-none" />
        <input type="text" placeholder="CÓDIGO BARRA" className="bg-[#0a0e27] border border-purple-500/30 rounded p-3 text-[10px] text-purple-200 uppercase font-bold focus:outline-none" />
      </div>
      <button className="w-full bg-[#2ecc71] hover:bg-[#27ae60] text-white font-bold py-3 rounded mb-6 uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg">Agregar Producto</button>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button onClick={deleteAllProducts} className="bg-[#e63946] text-white py-3 rounded font-bold uppercase text-[10px] tracking-widest shadow-md">Eliminar Todo</button>
        <button className="bg-[#9b59b6] text-white py-3 rounded font-bold uppercase text-[10px] tracking-widest shadow-md">Importar Excel</button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 w-4 h-4" />
        <input 
          type="text" 
          placeholder="BUSCAR PRODUCTO..." 
          className="w-full bg-[#0a0e27] border border-cyan-500/30 rounded-lg pl-10 pr-4 py-3 text-cyan-300 text-[11px] font-bold focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-[#0a0e27]/80 rounded-lg border border-cyan-500/10 overflow-hidden shadow-2xl">
        <div className="max-h-[500px] overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#141830] z-10 border-b border-cyan-500/30">
              <tr className="text-cyan-400 text-[10px] uppercase font-bold">
                <th className="p-4">Código Artículo</th>
                <th className="p-4">Descripción</th>
                <th className="p-4 text-center">EAN / SKU</th>
                <th className="p-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono text-cyan-300 text-[11px] font-bold">{product.code}</td>
                  <td className="p-4 text-[11px] text-white uppercase font-medium">{product.description}</td>
                  <td className="p-4 text-center text-cyan-300/60 font-mono text-[11px]">{product.ean}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => deleteProduct(product.id)} className="bg-[#e63946] text-white p-2 rounded hover:bg-red-500 shadow-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}