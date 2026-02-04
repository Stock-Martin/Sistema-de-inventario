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
    let cleanedValue = value.replace(/[\r\n\t]/g, '').trim();
    
    // Convertir notación científica a número normal si es necesario
    // Ejemplo: "7.790715001661E+12" → "7790715001661"
    if (cleanedValue.toLowerCase().includes('e+') || cleanedValue.toLowerCase().includes('e-')) {
      try {
        const num = parseFloat(cleanedValue);
        if (!isNaN(num)) {
          cleanedValue = num.toFixed(0); // Convertir a entero sin decimales
          console.log('Inv - Convertido de notación científica:', value, '→', cleanedValue);
        }
      } catch (e) {
        console.error('Inv - Error al convertir notación científica:', e);
      }
    }
    
    // Limpiar caracteres especiales finales
    cleanedValue = cleanedValue.replace(/[^\w-]/g, '').trim();
    
    setSku(cleanedValue);
    
    if (!cleanedValue) {
      setFoundProduct(null);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      return;
    }
    
    console.log('Inv - Código original:', JSON.stringify(value));
    console.log('Inv - Código procesado:', cleanedValue, 'Longitud:', cleanedValue.length);
    
    // Clear previous search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Buscar producto después de un breve delay (esperar a que termine de escribir/escanear)
    searchTimeoutRef.current = setTimeout(async () => {
      const product = await findProductByEan(cleanedValue);
      if (product) {
        console.log('Inv - ✓ Producto encontrado:', product);
        setFoundProduct(product);
        // Auto-focus en cantidad cuando se encuentra el producto
        setTimeout(() => {
          quantityInputRef.current?.focus();
          quantityInputRef.current?.select();
        }, 150);
      } else {
        console.log('Inv - ✗ Producto NO encontrado');
        setFoundProduct(null);
      }
    }, 300);
  };

  const handleQuantitySubmit = async () => {
    if (!sku.trim() || !quantity.trim()) return;
    
    if (!foundProduct) {
      alert('Producto no encontrado. Por favor, cargue el producto primero en la pestaña PRODUCTOS.');
      return;
    }
    
    const success = await addRecord({
      marbete_number: marbeteNumber,
      product_id: foundProduct.id,
      ean: sku,
      quantity: parseInt(quantity),
    });
    
    if (success) {
      setSku('');
      setQuantity('');
      setFoundProduct(null);
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

      {/* Número de Marbete */}
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
              <button
                onClick={handleSaveMarbete}
                className="bg-green-600 hover:bg-green-500 text-white p-2 rounded"
              >
                ✓
              </button>
              <button
                onClick={() => setEditingMarbete(false)}
                className="bg-red-600 hover:bg-red-500 text-white p-2 rounded"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="text-5xl md:text-7xl font-bold text-center text-purple-300 tracking-widest">
              {marbeteNumber}
            </div>
          )}
        </div>
      </div>

      {/* SKU / Código de Barra */}
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
              quantityInputRef.current?.select();
            }
          }}
          placeholder="Escanea o ingresa el código..."
          className="w-full bg-[#0a0e27] border-2 border-cyan-500/50 rounded-lg px-4 py-3 text-cyan-300 placeholder-cyan-700 focus:outline-none focus:border-cyan-400 transition-all text-lg"
        />
        {sku && !foundProduct && (
          <div className="mt-3 bg-red-900/40 border-2 border-red-500 rounded-lg p-4 text-center">
            <div className="text-red-300 font-bold text-lg mb-2">⚠ PRODUCTO NO ENCONTRADO</div>
            <div className="text-red-400 text-sm">
              Código escaneado: <span className="font-mono font-bold">"{sku}"</span>
            </div>
            <div className="text-red-400/70 text-xs mt-1">
              Por favor, verifique el código o cargue el producto en la pestaña PRODUCTOS
            </div>
          </div>
        )}
        {foundProduct && (
          <div className="mt-3 bg-green-900/40 border-2 border-green-500 rounded-lg p-3 text-center">
            <div className="text-green-300 font-bold">✓ PRODUCTO ENCONTRADO</div>
          </div>
        )}
      </div>

      {/* Descripción del Producto */}
      {foundProduct && (
        <div className="mb-6">
          <label className="text-purple-300 text-sm mb-2 block">DESCRIPCIÓN DEL PRODUCTO</label>
          <div className="bg-[#0a0e27] border-2 border-purple-500/50 rounded-lg px-4 py-3 text-purple-300 text-lg font-semibold">
            {foundProduct.description}
          </div>
        </div>
      )}

      {/* Cantidad */}
      <div className="mb-6">
        <label className="text-cyan-300 text-sm mb-2 block">CANTIDAD</label>
        <input
          ref={quantityInputRef}
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleQuantitySubmit();
            }
          }}
          placeholder="0"
          className="w-full bg-[#0a0e27] border-2 border-purple-500/50 rounded-lg px-4 py-3 text-purple-300 placeholder-purple-700 focus:outline-none focus:border-purple-400 transition-all text-center text-3xl md:text-4xl font-bold"
        />
      </div>

      {/* Botones de acción */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button
          onClick={handleQuantitySubmit}
          className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold py-4 px-6 rounded-lg transform transition-all hover:scale-105 shadow-lg"
        >
          INGRESAR DATOS
        </button>
        <button
          onClick={() => {
            setSku('');
            setFoundProduct(null);
          }}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white font-bold py-4 px-6 rounded-lg transform transition-all hover:scale-105 shadow-lg"
        >
          BORRAR CÓDIGO
        </button>
        <button
          onClick={() => setQuantity('')}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white font-bold py-4 px-6 rounded-lg transform transition-all hover:scale-105 shadow-lg"
        >
          BORRAR CANT.
        </button>
        <button
          onClick={handleChangeMarbete}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-lg transform transition-all hover:scale-105 shadow-lg"
        >
          CAMBIAR MARBETE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button
          onClick={clearAll}
          className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white font-bold py-4 px-6 rounded-lg transform transition-all hover:scale-105 shadow-lg"
        >
          LIMPIAR TODO
        </button>
        <button
          onClick={() => {
            const wb = XLSX.utils.book_new();
            const wsData = [
              ['NUMERO DE MARBETE', 'EAN', 'CODIGO', 'DESCRIPCION', 'CANTIDAD'],
              ...records.map(r => [r.marbete_number || marbeteNumber, r.ean, r.code, r.description, r.quantity])
            ];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
            XLSX.writeFile(wb, `inventario_marbete_${marbeteNumber}.xlsx`);
          }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 px-6 rounded-lg transform transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          EXPORTAR EXCEL
        </button>
      </div>

      {/* Detalle de registros */}
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
    let cleanedValue = value.replace(/[\r\n\t]/g, '').trim();
    
    // Convertir notación científica a número normal si es necesario
    // Ejemplo: "7.790715001661E+12" → "7790715001661"
    if (cleanedValue.toLowerCase().includes('e+') || cleanedValue.toLowerCase().includes('e-')) {
      try {
        const num = parseFloat(cleanedValue);
        if (!isNaN(num)) {
          cleanedValue = num.toFixed(0); // Convertir a entero sin decimales
          console.log('Tinto - Convertido de notación científica:', value, '→', cleanedValue);
        }
      } catch (e) {
        console.error('Tinto - Error al convertir notación científica:', e);
      }
    }
    
    // Limpiar caracteres especiales finales
    cleanedValue = cleanedValue.replace(/[^\w-]/g, '').trim();
    
    setSku(cleanedValue);
    
    if (!cleanedValue) {
      setFoundProduct(null);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      return;
    }
    
    console.log('Tinto - Código original:', JSON.stringify(value));
    console.log('Tinto - Código procesado:', cleanedValue, 'Longitud:', cleanedValue.length);
    
    // Clear previous search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Buscar producto después de un breve delay (esperar a que termine de escribir/escanear)
    searchTimeoutRef.current = setTimeout(async () => {
      const product = await findProductByEan(cleanedValue);
      if (product) {
        console.log('Tinto - ✓ Producto encontrado:', product);
        setFoundProduct(product);
        // Auto-focus en cantidad cuando se encuentra el producto
        setTimeout(() => {
          quantityInputRef.current?.focus();
          quantityInputRef.current?.select();
        }, 150);
      } else {
        console.log('Tinto - ✗ Producto NO encontrado');
        setFoundProduct(null);
      }
    }, 300);
  };

  const handleQuantitySubmit = async () => {
    if (!sku.trim() || !quantity.trim()) return;
    
    if (!foundProduct) {
      alert('Producto no encontrado. Por favor, cargue el producto primero en la pestaña PRODUCTOS.');
      return;
    }
    
    const success = await addRecord({
      sucursal: selectedSucursal,
      product_id: foundProduct.id,
      ean: sku,
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
      {/* Seleccionar Sucursal */}
      <div className="mb-8">
        <h3 className="text-purple-300 text-sm mb-4 text-center font-bold">SELECCIONAR SUCURSAL</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SUCURSALES.map((sucursal) => (
            <button
              key={sucursal}
              onClick={() => setSelectedSucursal(sucursal)}
              className={`py-4 px-3 rounded-lg font-bold text-sm transition-all transform hover:scale-105 ${
                selectedSucursal === sucursal
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                  : 'bg-purple-900/40 border-2 border-purple-500/30 text-purple-300 hover:border-purple-400'
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

      {/* SKU / Código de Barra */}
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
              quantityInputRef.current?.select();
            }
          }}
          placeholder="Escanea o ingresa el código..."
          className="w-full bg-[#0a0e27] border-2 border-cyan-500/50 rounded-lg px-4 py-3 text-cyan-300 placeholder-cyan-700 focus:outline-none focus:border-cyan-400 transition-all text-lg"
        />
        {sku && !foundProduct && (
          <div className="mt-3 bg-red-900/40 border-2 border-red-500 rounded-lg p-4 text-center">
            <div className="text-red-300 font-bold text-lg mb-2">⚠ PRODUCTO NO ENCONTRADO</div>
            <div className="text-red-400 text-sm">
              Código escaneado: <span className="font-mono font-bold">"{sku}"</span>
            </div>
            <div className="text-red-400/70 text-xs mt-1">
              Por favor, verifique el código o cargue el producto en la pestaña PRODUCTOS
            </div>
          </div>
        )}
        {foundProduct && (
          <div className="mt-3 bg-green-900/40 border-2 border-green-500 rounded-lg p-3 text-center">
            <div className="text-green-300 font-bold">✓ PRODUCTO ENCONTRADO</div>
          </div>
        )}
      </div>

      {/* Descripción del Producto */}
      {foundProduct && (
        <div className="mb-6">
          <label className="text-purple-300 text-sm mb-2 block">DESCRIPCIÓN DEL PRODUCTO</label>
          <div className="bg-[#0a0e27] border-2 border-purple-500/50 rounded-lg px-4 py-3 text-purple-300 text-lg font-semibold">
            {foundProduct.description}
          </div>
        </div>
      )}

      {/* Cantidad */}
      <div className="mb-6">
        <label className="text-cyan-300 text-sm mb-2 block">CANTIDAD O BASE B.H.A</label>
        <input
          ref={quantityInputRef}
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleQuantitySubmit();
            }
          }}
          placeholder="0"
          className="w-full bg-[#0a0e27] border-2 border-purple-500/50 rounded-lg px-4 py-3 text-purple-300 placeholder-purple-700 focus:outline-none focus:border-purple-400 transition-all text-center text-3xl md:text-4xl font-bold"
        />
      </div>

      {/* Botones de acción */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <button
          onClick={handleQuantitySubmit}
          className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold py-4 px-6 rounded-lg transform transition-all hover:scale-105 shadow-lg"
        >
          INGRESAR BAJA
        </button>
        <button
          onClick={() => {
            setSku('');
            setFoundProduct(null);
          }}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white font-bold py-4 px-6 rounded-lg transform transition-all hover:scale-105 shadow-lg"
        >
          BORRAR CÓDIGO
        </button>
        <button
          onClick={() => setQuantity('')}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white font-bold py-4 px-6 rounded-lg transform transition-all hover:scale-105 shadow-lg"
        >
          BORRAR CANT.
        </button>
      </div>

      <button
        onClick={clearAll}
        className="w-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white font-bold py-4 px-6 rounded-lg transform transition-all hover:scale-105 shadow-lg mb-6"
      >
        LIMPIAR TODO
      </button>

      {/* Registros de bajas */}
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
    if (success) {
      setNewProduct({ ean: '', code: '', description: '' });
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON (array of arrays)
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Skip header row and map data
      const productsData = data.slice(1)
        .filter(row => row && row.length >= 3)
        .map(row => {
          const code = String(row[0] || '').trim();
          const description = String(row[1] || '').trim();
          const ean = String(row[2] || '').trim();
          return { ean, code, description };
        })
        .filter(p => p.ean && p.code && p.description);

      if (productsData.length === 0) {
        alert('No se encontraron productos válidos en el archivo');
        return;
      }

      const success = await bulkImportProducts(productsData);
      if (success) {
        alert(`Se importaron ${productsData.length} productos exitosamente`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Error al leer el archivo. Asegúrese de que sea un archivo Excel válido con las columnas correctas');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1229] rounded-2xl border-2 border-cyan-500/30 p-6 md:p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-10 h-10 text-cyan-400" />
        <div>
          <h2 className="text-3xl font-bold text-cyan-400">PRODUCTOS</h2>
          <p className="text-cyan-300/60 text-sm">✦ GESTIÓN DE CATÁLOGO</p>
        </div>
      </div>

      {/* Agregar Producto */}
      <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-lg p-4 md:p-6 border-2 border-purple-500/30 mb-6">
        <h3 className="text-purple-300 text-sm mb-4 font-bold">AGREGAR PRODUCTO</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            type="text"
            placeholder="CÓDIGO DE ARTÍCULO"
            value={newProduct.code}
            onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
            className="bg-[#0a0e27] border border-purple-500/50 rounded px-4 py-3 text-purple-300 placeholder-purple-700 text-sm focus:outline-none focus:border-purple-400"
          />
          <input
            type="text"
            placeholder="DESCRIPCIÓN"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            className="bg-[#0a0e27] border border-purple-500/50 rounded px-4 py-3 text-purple-300 placeholder-purple-700 text-sm focus:outline-none focus:border-purple-400"
          />
          <input
            type="text"
            placeholder="CÓDIGO DE BARRA"
            value={newProduct.ean}
            onChange={(e) => setNewProduct({ ...newProduct, ean: e.target.value })}
            className="bg-[#0a0e27] border border-purple-500/50 rounded px-4 py-3 text-purple-300 placeholder-purple-700 text-sm focus:outline-none focus:border-purple-400"
          />
        </div>
        <button
          onClick={handleAddProduct}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold py-4 px-6 rounded-lg transform transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          AGREGAR PRODUCTO
        </button>
      </div>

      {/* Importación Masiva */}
      <div className="bg-gradient-to-br from-pink-900/40 to-red-900/40 rounded-lg p-4 md:p-6 border-2 border-pink-500/30 mb-6">
        <h3 className="text-pink-300 text-sm mb-4 font-bold">IMPORTACIÓN MASIVA</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={deleteAllProducts}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            ELIMINAR TODO
          </button>
          <label className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer">
            <Download className="w-4 h-4" />
            IMPORTAR EXCEL
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt,.xls,.xlsx"
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-pink-300/60 text-xs mt-3">
          * El archivo debe tener 3 columnas: CÓDIGO DE ARTÍCULO, DESCRIPCIÓN, CÓDIGO DE BARRA (separadas por comas o tabulaciones)
        </p>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 BUSCAR POR CUALQUIER CAMPO"
            className="w-full bg-[#0a0e27] border-2 border-cyan-500/50 rounded-lg pl-10 pr-4 py-4 text-cyan-300 placeholder-cyan-700 focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>
        <div className="text-right text-cyan-400 text-sm mt-2 font-semibold">
          {filteredProducts.length} PRODUCTOS
        </div>
      </div>

      {/* Lista de productos */}
      <div className="bg-[#0a0e27]/50 rounded-lg p-4 max-h-[500px] overflow-x-auto overflow-y-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[200px_1fr_200px_80px] gap-4 text-sm mb-3">
            <div className="text-cyan-400 font-bold">CÓDIGO DE ARTÍCULO</div>
            <div className="text-cyan-400 font-bold">DESCRIPCIÓN</div>
            <div className="text-cyan-400 font-bold">CÓDIGO DE BARRA</div>
            <div className="text-cyan-400 font-bold text-center">ACCIONES</div>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-cyan-400/60">
              No hay productos para mostrar
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="grid grid-cols-[200px_1fr_200px_80px] gap-4 text-sm py-3 border-t border-purple-500/20 hover:bg-purple-900/20 transition-all">
                <div className="text-cyan-300">{product.code}</div>
                <div className="text-cyan-300">{product.description}</div>
                <div className="text-cyan-300">{product.ean}</div>
                <div className="flex justify-center">
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="bg-red-600 hover:bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all transform hover:scale-110"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
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
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const items = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 5) continue;
        
        const ean = String(row[1] || '').trim();
        const code = String(row[2] || '').trim();
        const description = String(row[3] || '').trim();
        const quantity = parseInt(String(row[4] || '0'));
        
        if (ean && code && description) {
          const product = await findProductByEan(ean);
          items.push({
            product_id: product?.id || 0,
            ean,
            code,
            description,
            quantity
          });
        }
      }

      if (items.length === 0) {
        alert('No se encontraron items válidos en el archivo');
        return;
      }

      const success = await importInventory(items);
      if (success) {
        alert(`Se importaron ${items.length} items del inventario`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Error al leer el archivo');
    }
    
    if (fileInputRefInventory.current) {
      fileInputRefInventory.current.value = '';
    }
  };

  const handleImportStock = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const items = data.slice(1)
        .filter(row => row && row.length >= 3)
        .map(row => ({
          code: String(row[0] || '').trim(),
          description: String(row[1] || '').trim(),
          ean: String(row[2] || '').trim(),
          quantity: parseInt(String(row[3] || '0'))
        }))
        .filter(item => item.ean || item.code);

      if (items.length === 0) {
        alert('No se encontraron items válidos en el archivo');
        return;
      }

      const success = await importStock(items);
      if (success) {
        alert(`Se importaron ${items.length} items de stock`);
        await calculate();
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Error al leer el archivo');
    }
    
    if (fileInputRefStock.current) {
      fileInputRefStock.current.value = '';
    }
  };

  const filteredRecords = records.filter(r => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const stats = {
    total: records.length,
    cruces: records.filter(r => r.status === 'CRUCE').length,
    sobrantes: records.filter(r => r.status === 'SOBRANTE').length,
    faltantes: records.filter(r => r.status === 'FALTANTE').length,
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1229] rounded-2xl border-2 border-cyan-500/30 p-6 md:p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-10 h-10 text-cyan-400" />
        <div>
          <h2 className="text-3xl font-bold text-cyan-400">STOCK</h2>
          <p className="text-cyan-300/60 text-sm">✦ COMPARACIÓN DE INVENTARIO</p>
        </div>
      </div>

      {/* Importaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-lg p-6 border-2 border-purple-500/30">
          <h3 className="text-purple-300 text-sm mb-3 font-bold">CARGA DE INVENTARIO</h3>
          <p className="text-purple-300/60 text-xs mb-4">
            Archivo Excel con columnas: MARBETE, EAN, CÓDIGO, DESCRIPCIÓN, CANTIDAD
          </p>
          <label className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer">
            <Download className="w-4 h-4" />
            IMPORTAR INVENTARIO
            <input
              ref={fileInputRefInventory}
              type="file"
              accept=".csv,.tsv,.txt,.xls,.xlsx"
              onChange={handleImportInventory}
              className="hidden"
            />
          </label>
        </div>

        <div className="bg-gradient-to-br from-pink-900/40 to-red-900/40 rounded-lg p-6 border-2 border-pink-500/30">
          <h3 className="text-pink-300 text-sm mb-3 font-bold">CARGA DE STOCK</h3>
          <p className="text-pink-300/60 text-xs mb-4">
            Archivo Excel con columnas: CÓDIGO, DESCRIPCIÓN, EAN, CANTIDAD
          </p>
          <label className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer">
            <Download className="w-4 h-4" />
            IMPORTAR STOCK
            <input
              ref={fileInputRefStock}
              type="file"
              accept=".csv,.tsv,.txt,.xls,.xlsx"
              onChange={handleImportStock}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-cyan-900/40 border-2 border-cyan-500/30 rounded-lg p-4 text-center">
          <div className="text-cyan-300 text-sm mb-1">TOTAL</div>
          <div className="text-cyan-400 text-3xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-green-900/40 border-2 border-green-500/30 rounded-lg p-4 text-center">
          <div className="text-green-300 text-sm mb-1">CRUCES</div>
          <div className="text-green-400 text-3xl font-bold">{stats.cruces}</div>
        </div>
        <div className="bg-yellow-900/40 border-2 border-yellow-500/30 rounded-lg p-4 text-center">
          <div className="text-yellow-300 text-sm mb-1">SOBRANTES</div>
          <div className="text-yellow-400 text-3xl font-bold">{stats.sobrantes}</div>
        </div>
        <div className="bg-red-900/40 border-2 border-red-500/30 rounded-lg p-4 text-center">
          <div className="text-red-300 text-sm mb-1">FALTANTES</div>
          <div className="text-red-400 text-3xl font-bold">{stats.faltantes}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              filterStatus === 'ALL'
                ? 'bg-cyan-500 text-white'
                : 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            TODOS
          </button>
          <button
            onClick={() => setFilterStatus('CRUCE')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              filterStatus === 'CRUCE'
                ? 'bg-green-500 text-white'
                : 'bg-green-900/40 text-green-300 border border-green-500/30'
            }`}
          >
            CRUCES
          </button>
          <button
            onClick={() => setFilterStatus('SOBRANTE')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              filterStatus === 'SOBRANTE'
                ? 'bg-yellow-500 text-white'
                : 'bg-yellow-900/40 text-yellow-300 border border-yellow-500/30'
            }`}
          >
            SOBRANTES
          </button>
          <button
            onClick={() => setFilterStatus('FALTANTE')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              filterStatus === 'FALTANTE'
                ? 'bg-red-500 text-white'
                : 'bg-red-900/40 text-red-300 border border-red-500/30'
            }`}
          >
            FALTANTES
          </button>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button
          onClick={clearAll}
          className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white font-bold py-4 px-6 rounded-lg transform transition-all hover:scale-105 shadow-lg"
        >
          LIMPIAR TODO
        </button>
        <button
          onClick={() => {
            const wb = XLSX.utils.book_new();
            const wsData = [
              ['CODIGO', 'DESCRIPCION', 'EAN', 'CANTIDAD_CONTADA', 'CANTIDAD_SISTEMA', 'DIFERENCIA', 'ESTADO'],
              ...filteredRecords.map(r => [
                r.code,
                r.description,
                r.ean,
                r.counted_quantity || 0,
                r.system_quantity || 0,
                r.difference || 0,
                r.status || 'SIN_DATOS'
              ])
            ];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, 'Stock');
            XLSX.writeFile(wb, `comparacion_stock_${new Date().toISOString().split('T')[0]}.xlsx`);
          }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 px-6 rounded-lg transform transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          EXPORTAR EXCEL
        </button>
      </div>

      {/* Tabla de comparación */}
      <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-lg p-4 md:p-6 border-2 border-purple-500/30">
        <h3 className="text-purple-300 font-bold text-lg mb-4">COMPARACIÓN DE STOCK</h3>
        <div className="bg-[#0a0e27]/50 rounded-lg p-4 max-h-[500px] overflow-auto">
          {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-20 h-20 text-purple-500/30 mb-4" />
              <p className="text-purple-400/60 text-lg">NO HAY REGISTROS</p>
            </div>
          ) : (
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[120px_1fr_120px_100px_100px_100px_120px] gap-3 text-xs mb-3 pb-2 border-b border-purple-500/30">
                <div className="text-cyan-400 font-bold">CÓDIGO</div>
                <div className="text-cyan-400 font-bold">DESCRIPCIÓN</div>
                <div className="text-cyan-400 font-bold">EAN</div>
                <div className="text-cyan-400 font-bold text-center">CONTADO</div>
                <div className="text-cyan-400 font-bold text-center">SISTEMA</div>
                <div className="text-cyan-400 font-bold text-center">DIFERENCIA</div>
                <div className="text-cyan-400 font-bold text-center">ESTADO</div>
              </div>
              
              {filteredRecords.map((record) => (
                <div key={record.id} className="grid grid-cols-[120px_1fr_120px_100px_100px_100px_120px] gap-3 text-xs py-3 border-b border-purple-500/10 hover:bg-purple-900/20 transition-all">
                  <div className="text-cyan-300">{record.code}</div>
                  <div className="text-cyan-300">{record.description}</div>
                  <div className="text-cyan-300">{record.ean}</div>
                  <div className="text-center text-purple-300 font-bold">{record.counted_quantity || 0}</div>
                  <div className="text-center text-purple-300 font-bold">{record.system_quantity || 0}</div>
                  <div className={`text-center font-bold ${
                    (record.difference || 0) > 0 ? 'text-yellow-400' :
                    (record.difference || 0) < 0 ? 'text-red-400' :
                    'text-green-400'
                  }`}>
                    {record.difference || 0}
                  </div>
                  <div className="text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      record.status === 'CRUCE' ? 'bg-green-500/30 text-green-300' :
                      record.status === 'SOBRANTE' ? 'bg-yellow-500/30 text-yellow-300' :
                      record.status === 'FALTANTE' ? 'bg-red-500/30 text-red-300' :
                      'bg-gray-500/30 text-gray-300'
                    }`}>
                      {record.status || 'SIN_DATOS'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecordsTable({
  records,
  onUpdate,
  onDelete,
}: {
  records: any[];
  onUpdate: (id: number, quantity: number) => void;
  onDelete: (id: number) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState('');

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    setEditQuantity(record.quantity.toString());
  };

  const handleSave = (id: number) => {
    onUpdate(id, parseInt(editQuantity));
    setEditingId(null);
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-lg p-4 md:p-6 border-2 border-purple-500/30">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
        <h3 className="text-purple-300 font-bold text-lg">REGISTRO DE MERCADERÍA</h3>
      </div>
      <div className="bg-[#0a0e27]/50 rounded-lg p-4 max-h-[400px] overflow-auto">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="w-20 h-20 text-purple-500/30 mb-4" />
            <p className="text-purple-400/60 text-lg">NO HAY REGISTROS</p>
          </div>
        ) : (
          <div className="min-w-[700px]">
            <div className="grid grid-cols-[150px_1fr_120px_120px] gap-4 text-sm mb-3 pb-2 border-b border-purple-500/30">
              <div className="text-cyan-400 font-bold">CÓDIGO DE ARTÍCULO</div>
              <div className="text-cyan-400 font-bold">DESCRIPCIÓN</div>
              <div className="text-cyan-400 font-bold text-center">CANTIDAD</div>
              <div className="text-cyan-400 font-bold text-center">ACCIONES</div>
            </div>
            
            {records.map((record) => (
              <div key={record.id} className="grid grid-cols-[150px_1fr_120px_120px] gap-4 text-sm py-3 border-b border-purple-500/10 hover:bg-purple-900/20 transition-all">
                <div className="text-cyan-300">{record.code}</div>
                <div className="text-cyan-300">{record.description}</div>
                <div className="text-center">
                  {editingId === record.id ? (
                    <input
                      type="number"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      className="w-20 bg-[#0a0e27] border border-purple-500 rounded px-2 py-1 text-purple-300 text-center"
                      autoFocus
                    />
                  ) : (
                    <span className="text-purple-300 font-bold">{record.quantity}</span>
                  )}
                </div>
                <div className="flex justify-center gap-2">
                  {editingId === record.id ? (
                    <>
                      <button
                        onClick={() => handleSave(record.id)}
                        className="bg-green-600 hover:bg-green-500 text-white w-7 h-7 rounded flex items-center justify-center"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-600 hover:bg-gray-500 text-white w-7 h-7 rounded flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(record)}
                        className="bg-blue-600 hover:bg-blue-500 text-white w-7 h-7 rounded flex items-center justify-center"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDelete(record.id)}
                        className="bg-red-600 hover:bg-red-500 text-white w-7 h-7 rounded flex items-center justify-center"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
