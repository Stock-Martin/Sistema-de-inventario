  import { useState, useRef } from 'react';
import { Package, Droplet, Database, Download, Trash2, Plus, Search, Edit2, X } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useInventory } from '../hooks/useInventory';
import { useTintometric } from '../hooks/useTintometric';
import { useStock } from '../hooks/useStock';
import * as XLSX from 'xlsx';

const SUCURSALES = ['MUNRO', 'VILLA MARTELLI', 'SAN FERNANDO', 'OLIVOS', 'MARTINEZ', 'VEN'];

type Tab = 'inventario' | 'tintometrico' | 'productos' | 'stock';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('inventario');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1147] to-[#2d1b69] text-white">
      {/* Navegación de pestañas */}
      <div className="bg-gradient-to-r from-[#1a1f3a] to-[#0f1229] border-b-2 border-cyan-500/30">
        <div className="max-w-[1800px] mx-auto px-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('inventario')}
              className={`flex items-center gap-3 px-8 py-4 font-bold transition-all relative ${
                activeTab === 'inventario'
                  ? 'text-cyan-400 bg-gradient-to-br from-[#1a1f3a] to-[#0f1229]'
                  : 'text-cyan-600 hover:text-cyan-400'
              }`}
            >
              <Package className="w-6 h-6" />
              <span>INVENTARIO</span>
              {activeTab === 'inventario' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tintometrico')}
              className={`flex items-center gap-3 px-8 py-4 font-bold transition-all relative ${
                activeTab === 'tintometrico'
                  ? 'text-cyan-400 bg-gradient-to-br from-[#1a1f3a] to-[#0f1229]'
                  : 'text-cyan-600 hover:text-cyan-400'
              }`}
            >
              <Droplet className="w-6 h-6" />
              <span>TINTOMÉTRICO</span>
              {activeTab === 'tintometrico' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('productos')}
              className={`flex items-center gap-3 px-8 py-4 font-bold transition-all relative ${
                activeTab === 'productos'
                  ? 'text-cyan-400 bg-gradient-to-br from-[#1a1f3a] to-[#0f1229]'
                  : 'text-cyan-600 hover:text-cyan-400'
              }`}
            >
              <Database className="w-6 h-6" />
              <span>PRODUCTOS</span>
              {activeTab === 'productos' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`flex items-center gap-3 px-8 py-4 font-bold transition-all relative ${
                activeTab === 'stock'
                  ? 'text-cyan-400 bg-gradient-to-br from-[#1a1f3a] to-[#0f1229]'
                  : 'text-cyan-600 hover:text-cyan-400'
              }`}
            >
              <Package className="w-6 h-6" />
              <span>STOCK</span>
              {activeTab === 'stock' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Contenido de las pestañas */}
      <div className="p-4 md:p-8">
        <div className="max-w-[1200px] mx-auto">
          {activeTab === 'inventario' && <InventarioTab />}
          {activeTab === 'tintometrico' && <TintometricoTab />}
          {activeTab === 'productos' && <ProductosTab />}
          {activeTab === 'stock' && <StockTab />}
        </div>
      </div>
    </div>
  );
}

function InventarioTab() {
  const [marbeteNumber, setMarbeteNumber] = useState('000000');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState('');
  const [editingMarbete, setEditingMarbete] = useState(false);
  const [tempMarbete, setTempMarbete] = useState('');
  const [foundProduct, setFoundProduct] = useState<any>(null);
  
  const skuInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { findProductByEan } = useProducts();
  const { records, addRecord, updateRecord, deleteRecord, clearAll } = useInventory(marbeteNumber);

const handleSkuChange = async (value: string) => {
  // 1. Limpieza profunda y normalización a MAYÚSCULAS
  let cleanedValue = value.replace(/[\r\n\t]/g, '').trim().toUpperCase();
  
  // 2. Manejo de notación científica (Excel)
  if (cleanedValue.includes('E+')) {
    try {
      const num = parseFloat(cleanedValue);
      if (!isNaN(num)) cleanedValue = num.toFixed(0);
    } catch (e) { console.error(e); }
  }
  
  // Actualizamos el estado con el valor limpio
  setSku(cleanedValue);
  
  if (!cleanedValue) {
    setFoundProduct(null);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    return;
  }
  
  if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
  
  searchTimeoutRef.current = setTimeout(async () => {
    // Buscamos el producto. 
    // IMPORTANTE: findProductByEan debe recibir el valor en mayúsculas
    const product = await findProductByEan(cleanedValue);
    
    if (product) {
      setFoundProduct(product);
      setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }, 150);
    } else {
      setFoundProduct(null);
    }
  }, 300);
};

const handleQuantitySubmit = async () => {
  // Verificamos que tengamos los datos necesarios
  if (!sku.trim() || !quantity.trim() || !foundProduct) {
    alert("Primero debes encontrar un producto válido");
    return;
  }

  const success = await addRecord({
    marbete_number: marbeteNumber,
    product_id: foundProduct.id,
    ean: foundProduct.ean || sku, 
    code: foundProduct.code,         // Usamos directamente lo que encontramos
    description: foundProduct.description, 
    quantity: parseInt(quantity),
  });

  if (success) {
    setSku('');
    setQuantity('');
    setFoundProduct(null); // Limpiamos para el próximo escaneo
    skuInputRef.current?.focus();
  }
};

  const handleChangeMarbete = () => {
    setTempMarbete(marbeteNumber);
    setEditingMarbete(true);
  };

  const handleSaveMarbete = () => {
    if (tempMarbete.trim()) {
      setMarbeteNumber(tempMarbete);
      setEditingMarbete(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1229] rounded-2xl border-2 border-cyan-500/30 p-6 md:p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-10 h-10 text-cyan-400" />
        <div>
          <h2 className="text-3xl font-bold text-cyan-400">INVENTARIO</h2>
          <p className="text-cyan-300/60 text-sm">✦ SISTEMA DE CONTEO GENERAL</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="text-cyan-300 text-sm mb-2 block">✦ NÚMERO DE MARBETE</label>
        <div className="bg-[#0a0e27] rounded-lg p-6 md:p-8 border-2 border-purple-500/30">
          {editingMarbete ? (
            <div className="flex gap-2 items-center justify-center">
              <input
                type="text"
                value={tempMarbete}
                onChange={(e) => setTempMarbete(e.target.value)}
                className="text-4xl md:text-6xl font-bold text-center text-purple-300 tracking-widest bg-transparent border-b-2 border-purple-500 focus:outline-none w-64"
                autoFocus
              />
              <button onClick={handleSaveMarbete} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded">✓</button>
              <button onClick={() => setEditingMarbete(false)} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded">✕</button>
            </div>
          ) : (
            <div className="text-5xl md:text-7xl font-bold text-center text-purple-300 tracking-widest">{marbeteNumber}</div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-cyan-300 text-sm mb-2 block">CÓDIGO DE ARTÍCULO O CÓDIGO DE BARRA</label>
        <input
          ref={skuInputRef}
          type="text"
          value={sku}
          onChange={(e) => handleSkuChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && foundProduct) {
              e.preventDefault();
              quantityInputRef.current?.focus();
            }
          }}
          placeholder="Escanea o ingresa el código..."
          className="w-full bg-[#0a0e27] border-2 border-cyan-500/50 rounded-lg px-4 py-3 text-cyan-300 text-lg"
        />
        {sku && !foundProduct && (
          <div className="mt-3 bg-red-900/40 border-2 border-red-500 rounded-lg p-4 text-center text-red-300">
            ⚠ PRODUCTO NO ENCONTRADO
          </div>
        )}
      </div>

      {foundProduct && (
        <div className="mb-6">
          <label className="text-purple-300 text-sm mb-2 block">DESCRIPCIÓN DEL PRODUCTO</label>
          <div className="bg-[#0a0e27] border-2 border-purple-500/50 rounded-lg px-4 py-3 text-purple-300 text-lg font-semibold">
            {foundProduct.description}
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="text-cyan-300 text-sm mb-2 block">CANTIDAD</label>
        <input
          ref={quantityInputRef}
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuantitySubmit()}
          placeholder="0"
          className="w-full bg-[#0a0e27] border-2 border-purple-500/50 rounded-lg px-4 py-3 text-purple-300 text-center text-3xl font-bold"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button onClick={handleQuantitySubmit} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold py-4 rounded-lg">INGRESAR DATOS</button>
        <button onClick={() => { setSku(''); setFoundProduct(null); }} className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold py-4 rounded-lg">BORRAR CÓDIGO</button>
        <button onClick={() => setQuantity('')} className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold py-4 rounded-lg">BORRAR CANT.</button>
        <button onClick={handleChangeMarbete} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 rounded-lg">CAMBIAR MARBETE</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button onClick={clearAll} className="bg-gradient-to-r from-pink-600 to-red-600 text-white font-bold py-4 rounded-lg">LIMPIAR TODO</button>
        <button
          onClick={() => {
            const wb = XLSX.utils.book_new();
            const wsData = [['MARBETE', 'EAN', 'CODIGO', 'DESCRIPCION', 'CANTIDAD'], ...records.map(r => [r.marbete_number || marbeteNumber, r.ean, r.code, r.description, r.quantity])];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
            XLSX.writeFile(wb, `inventario_marbete_${marbeteNumber}.xlsx`);
          }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" /> EXPORTAR EXCEL
        </button>
      </div>

      <RecordsTable records={records} onUpdate={updateRecord} onDelete={deleteRecord} />
    </div>
  );
}

function TintometricoTab() {
  const [selectedSucursal, setSelectedSucursal] = useState('MUNRO');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState('');
  const [foundProduct, setFoundProduct] = useState<any>(null);

  const skuInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { findProductByEan } = useProducts();
  const { records, addRecord, updateRecord, deleteRecord, clearAll } = useTintometric(selectedSucursal);

const handleSkuChange = async (value: string) => {
    // Normalizamos a MAYÚSCULAS y limpiamos caracteres del lector
    let cleanedValue = value.replace(/[\r\n\t]/g, '').trim().toUpperCase();
    
    if (cleanedValue.includes('E+')) {
      try {
        const num = parseFloat(cleanedValue);
        if (!isNaN(num)) cleanedValue = num.toFixed(0);
      } catch (e) { console.error(e); }
    }
    
    setSku(cleanedValue);
    
    if (!cleanedValue) {
      setFoundProduct(null);
      return;
    }
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(async () => {
      // Ahora la búsqueda es insensible a mayúsculas/minúsculas porque enviamos todo en UPCASE
      const product = await findProductByEan(cleanedValue); 
      
      if (product) {
        setFoundProduct(product);
        setTimeout(() => {
          quantityInputRef.current?.focus();
          quantityInputRef.current?.select();
        }, 150);
      } else {
        setFoundProduct(null);
      }
    }, 300);
  };

  const handleQuantitySubmit = async () => {
    if (!sku.trim() || !quantity.trim() || !foundProduct) return;
    const success = await addRecord({
      sucursal: selectedSucursal,
      product_id: foundProduct.id,
      ean: foundProduct.ean || sku, 
      code: foundProduct.code,
      description: foundProduct.description,
      quantity: parseInt(quantity),
    });
    
    if (success) {
      setSku('');
      setQuantity('');
      setFoundProduct(null);
      skuInputRef.current?.focus();
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1229] rounded-2xl border-2 border-cyan-500/30 p-6 md:p-8 shadow-2xl">
      <div className="mb-8">
        <h3 className="text-purple-300 text-sm mb-4 text-center font-bold">SELECCIONAR SUCURSAL</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SUCURSALES.map((sucursal) => (
            <button
              key={sucursal}
              onClick={() => setSelectedSucursal(sucursal)}
              className={`py-4 px-3 rounded-lg font-bold text-sm transition-all ${
                selectedSucursal === sucursal
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'bg-purple-900/40 border-2 border-purple-500/30 text-purple-300'
              }`}
            >
              {sucursal}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Droplet className="w-10 h-10 text-cyan-400" />
        <div>
          <h2 className="text-3xl font-bold text-cyan-400">BAJA TINTOMÉTRICO</h2>
          <p className="text-cyan-300/60 text-sm">✦ MAQUINA</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="text-cyan-300 text-sm mb-2 block">CÓDIGO DE ARTÍCULO O CÓDIGO DE BARRA</label>
        <input
          ref={skuInputRef}
          type="text"
          value={sku}
          onChange={(e) => handleSkuChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && foundProduct) {
              e.preventDefault();
              quantityInputRef.current?.focus();
            }
          }}
          placeholder="Escanea o ingresa el código..."
          className="w-full bg-[#0a0e27] border-2 border-cyan-500/50 rounded-lg px-4 py-3 text-cyan-300 text-lg"
        />
      </div>

      {foundProduct && (
        <div className="mb-6">
          <label className="text-purple-300 text-sm mb-2 block">DESCRIPCIÓN DEL PRODUCTO</label>
          <div className="bg-[#0a0e27] border-2 border-purple-500/50 rounded-lg px-4 py-3 text-purple-300 text-lg font-semibold">
            {foundProduct.description}
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="text-cyan-300 text-sm mb-2 block">CANTIDAD O BASE B.H.A</label>
        <input
          ref={quantityInputRef}
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuantitySubmit()}
          placeholder="0"
          className="w-full bg-[#0a0e27] border-2 border-purple-500/50 rounded-lg px-4 py-3 text-purple-300 text-center text-3xl font-bold"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <button onClick={handleQuantitySubmit} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold py-4 rounded-lg">INGRESAR BAJA</button>
        <button onClick={() => { setSku(''); setFoundProduct(null); }} className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold py-4 rounded-lg">BORRAR CÓDIGO</button>
        <button onClick={() => setQuantity('')} className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold py-4 rounded-lg">BORRAR CANT.</button>
      </div>

      <button onClick={clearAll} className="w-full bg-gradient-to-r from-pink-600 to-red-600 text-white font-bold py-4 rounded-lg mb-6">LIMPIAR TODO</button>

      <RecordsTable records={records} onUpdate={updateRecord} onDelete={deleteRecord} />
    </div>
  );
}

function ProductosTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState({ ean: '', code: '', description: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { products, addProduct, deleteProduct, deleteAllProducts, bulkImportProducts } = useProducts();

  const filteredProducts = products.filter(
    (p) =>
      p.ean.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = async () => {
    if (!newProduct.ean || !newProduct.code || !newProduct.description) {
      alert('Por favor complete todos los campos');
      return;
    }
    const success = await addProduct(newProduct);
    if (success) setNewProduct({ ean: '', code: '', description: '' });
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const data: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
      const productsData = data.slice(1).filter(row => row && row.length >= 3).map(row => ({
        code: String(row[0] || '').trim(),
        description: String(row[1] || '').trim(),
        ean: String(row[2] || '').trim()
      })).filter(p => p.ean && p.code && p.description);

      if (productsData.length > 0) {
        await bulkImportProducts(productsData);
        alert(`Importados ${productsData.length} productos`);
      }
    } catch (err) { alert('Error al importar'); }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1229] rounded-2xl border-2 border-cyan-500/30 p-6 md:p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-10 h-10 text-cyan-400" />
        <h2 className="text-3xl font-bold text-cyan-400">PRODUCTOS</h2>
      </div>

      <div className="bg-purple-900/40 rounded-lg p-6 border-2 border-purple-500/30 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input type="text" placeholder="CÓDIGO ARTÍCULO" value={newProduct.code} onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })} className="bg-[#0a0e27] border border-purple-500 rounded px-4 py-3 text-purple-300" />
          <input type="text" placeholder="DESCRIPCIÓN" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="bg-[#0a0e27] border border-purple-500 rounded px-4 py-3 text-purple-300" />
          <input type="text" placeholder="CÓDIGO BARRA" value={newProduct.ean} onChange={(e) => setNewProduct({ ...newProduct, ean: e.target.value })} className="bg-[#0a0e27] border border-purple-500 rounded px-4 py-3 text-purple-300" />
        </div>
        <button onClick={handleAddProduct} className="w-full bg-green-500 text-white font-bold py-4 rounded-lg">AGREGAR PRODUCTO</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button onClick={deleteAllProducts} className="bg-red-600 text-white py-3 rounded-lg font-bold">ELIMINAR TODO</button>
        <label className="bg-purple-600 text-white py-3 rounded-lg font-bold text-center cursor-pointer">
          IMPORTAR EXCEL <input type="file" onChange={handleImportExcel} className="hidden" />
        </label>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="BUSCAR PRODUCTO..." className="w-full bg-[#0a0e27] border-2 border-cyan-500/50 rounded-lg pl-10 py-4 text-cyan-300" />
      </div>

      <div className="bg-[#0a0e27]/50 rounded-lg p-4 max-h-[500px] overflow-auto">
        <div className="min-w-[800px]">
          {filteredProducts.map((product) => (
            <div key={product.id} className="grid grid-cols-[200px_1fr_200px_80px] gap-4 py-3 border-b border-purple-500/20">
              <div className="text-cyan-300">{product.code}</div>
              <div className="text-cyan-300">{product.description}</div>
              <div className="text-cyan-300">{product.ean}</div>
              <button onClick={() => deleteProduct(product.id)} className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StockTab() {
  const fileInputRefInventory = useRef<HTMLInputElement>(null);
  const fileInputRefStock = useRef<HTMLInputElement>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  const { records, importInventory, importStock, calculate, clearAll } = useStock();
  const { findProductByEan } = useProducts();

  const handleImportInventory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const data: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
      const items = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 5) continue;
        const ean = String(row[1] || '').trim();
        const code = String(row[2] || '').trim();
        const description = String(row[3] || '').trim();
        const quantity = parseInt(String(row[4] || '0'));
        if (ean && code) {
          const product = await findProductByEan(ean);
          items.push({ product_id: product?.id || 0, ean, code, description, quantity });
        }
      }
      if (items.length > 0) await importInventory(items);
    } catch (err) { alert('Error al importar'); }
  };

  const handleImportStock = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const data: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
      const items = data.slice(1).filter(row => row && row.length >= 3).map(row => ({
        code: String(row[0] || '').trim(),
        description: String(row[1] || '').trim(),
        ean: String(row[2] || '').trim(),
        quantity: parseInt(String(row[3] || '0'))
      }));
      if (items.length > 0) {
        await importStock(items);
        await calculate();
      }
    } catch (err) { alert('Error al importar'); }
  };

  const filteredRecords = records.filter(r => filterStatus === 'ALL' || r.status === filterStatus);

  return (
    <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1229] rounded-2xl border-2 border-cyan-500/30 p-6 md:p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-10 h-10 text-cyan-400" />
        <h2 className="text-3xl font-bold text-cyan-400">STOCK</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-900/40 p-6 border-2 border-purple-500/30 rounded-lg text-center">
          <label className="cursor-pointer bg-purple-600 text-white px-4 py-3 rounded-lg font-bold block">
            IMPORTAR INVENTARIO <input type="file" onChange={handleImportInventory} className="hidden" />
          </label>
        </div>
        <div className="bg-pink-900/40 p-6 border-2 border-pink-500/30 rounded-lg text-center">
          <label className="cursor-pointer bg-pink-600 text-white px-4 py-3 rounded-lg font-bold block">
            IMPORTAR STOCK <input type="file" onChange={handleImportStock} className="hidden" />
          </label>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['ALL', 'CRUCE', 'SOBRANTE', 'FALTANTE'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-lg font-bold ${filterStatus === s ? 'bg-cyan-500 text-white' : 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/30'}`}>{s}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button onClick={clearAll} className="bg-red-600 text-white font-bold py-4 rounded-lg">LIMPIAR TODO</button>
        <button onClick={() => {
            const wb = XLSX.utils.book_new();
            const wsData = [['CODIGO', 'DESCRIPCION', 'EAN', 'CONTADO', 'SISTEMA', 'DIFERENCIA', 'ESTADO'], ...filteredRecords.map(r => [r.code, r.description, r.ean, r.counted_quantity, r.system_quantity, r.difference, r.status])];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, 'Stock');
            XLSX.writeFile(wb, 'comparacion_stock.xlsx');
        }} className="bg-green-600 text-white font-bold py-4 rounded-lg">EXPORTAR EXCEL</button>
      </div>

      <div className="bg-[#0a0e27]/50 rounded-lg p-4 max-h-[500px] overflow-auto">
        <div className="min-w-[900px]">
          {filteredRecords.map((record, index) => (
            <div key={index} className="grid grid-cols-[120px_1fr_120px_100px_100px_100px_120px] gap-3 py-2 border-b border-purple-500/10 text-xs items-center">
              <div className="text-cyan-300 font-mono">{record.code}</div>
              <div className="text-purple-100 truncate">{record.description}</div>
              <div className="text-cyan-300">{record.ean}</div>
              <div className="text-center text-purple-300 font-bold">{record.counted_quantity}</div>
              <div className="text-center text-purple-300 font-bold">{record.system_quantity}</div>
             <div className={`text-center font-bold ${(record.difference ?? 0) > 0 ? 'text-yellow-400' : (record.difference ?? 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
  {record.difference ?? 0}
</div>
              <div className="text-center"><span className="px-2 py-1 rounded bg-purple-500/30 text-purple-300 font-bold">{record.status}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecordsTable({ records, onUpdate, onDelete }: { records: any[]; onUpdate: (id: number, q: number) => void; onDelete: (id: number) => void; }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState('');

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-lg p-6 border-2 border-purple-500/30 mt-6">
      <h3 className="text-purple-300 font-bold text-lg mb-4">REGISTRO DE MERCADERÍA</h3>
      
      {/* --- ENCABEZADOS VISIBLES --- */}
      <div className="grid grid-cols-[150px_1fr_120px_120px] gap-4 py-2 px-4 bg-cyan-900/40 border border-cyan-500/50 rounded-t-lg text-cyan-300 font-bold text-xs">
        <div>CÓDIGO ART.</div>
        <div>DESCRIPCIÓN</div>
        <div className="text-center">CANT.</div>
        <div className="text-center">ACCIONES</div>
      </div>

      <div className="bg-[#0a0e27]/50 rounded-b-lg p-4 max-h-[400px] overflow-auto border-x border-b border-purple-500/30">
        {records.length === 0 ? (
          <div className="text-center py-12 text-purple-400/60">NO HAY REGISTROS</div>
        ) : (
          <div className="min-w-[700px]">
            {records.map((record) => (
              <div key={record.id} className="grid grid-cols-[150px_1fr_120px_120px] gap-4 py-3 border-b border-purple-500/10 items-center">
                {/* Forzamos que se vea algo aunque el dato venga vacío para debuggear */}
                <div className="text-cyan-300 font-mono">{record.code || "---"}</div>
                <div className="text-cyan-100 uppercase text-sm truncate">{record.description || "SIN DESCRIPCIÓN"}</div>
                
                <div className="text-center">
                  {editingId === record.id ? (
                    <input type="number" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} className="w-20 bg-[#0a0e27] border border-purple-500 rounded px-2 text-center text-purple-300" autoFocus />
                  ) : (
                    <span className="text-purple-300 font-bold text-xl">{record.quantity}</span>
                  )}
                </div>

                <div className="flex justify-center gap-2">
                  <button onClick={() => onDelete(record.id)} className="bg-red-600 text-white w-8 h-8 rounded flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}