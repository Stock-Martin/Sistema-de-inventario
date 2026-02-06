import { useState, useEffect } from 'react';

export interface Product {
  id: number;
  ean: string;
  code: string;
  description: string;
}

export function useProducts() {
  // 1. Cargar productos desde el disco al iniciar
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('db_productos_fijos');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [loading, setLoading] = useState(false);

  // 2. Guardar automáticamente cada vez que la lista cambie
  useEffect(() => {
    localStorage.setItem('db_productos_fijos', JSON.stringify(products));
  }, [products]);

  // Agregar producto individual (se suma a la lista)
  const addProduct = async (product: Omit<Product, 'id'>) => {
    const newProduct = {
      ...product,
      id: Date.now()
    };
    setProducts(prev => [...prev, newProduct]);
    return true;
  };

  const deleteProduct = async (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const deleteAllProducts = async () => {
    if (confirm('¿Eliminar TODOS los productos cargados?')) {
      setProducts([]);
    }
  };

  // IMPORTACIÓN MASIVA: Aquí es donde se SUMAN los productos
  const bulkImportProducts = async (productsData: Array<{ ean: string; code: string; description: string }>) => {
    try {
      setLoading(true);
      
const newFormattedProducts = productsData.map((p, index) => ({
  ean: String(p.ean || "").trim().toUpperCase(),
  code: String(p.code || "").trim().toUpperCase(),
  description: String(p.description || "").trim(), // La descripción la dejamos normal
  id: Date.now() + index
}));

      // USAMOS EL OPERADOR SPREAD (...) PARA SUMAR:
      // [...anteriores, ...nuevos]
      setProducts(prevProducts => [...prevProducts, ...newFormattedProducts]);
      
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

const findProductByEan = async (searchValue: string): Promise<Product | null> => {
  // 1. Limpiamos el valor de búsqueda y lo pasamos a MAYÚSCULAS
  const term = searchValue.trim().toUpperCase();

  if (!term) return null;

  // 2. Buscamos en la lista local
  const found = products.find(p => {
    // Normalizamos los datos de la "base de datos" para comparar manzanas con manzanas
    const prodEan = (p.ean || "").trim().toUpperCase();
    const prodCode = (p.code || "").trim().toUpperCase();

    // Verificamos si coincide con el EAN O con el Código de Artículo
    return prodEan === term || prodCode === term;
  });

  return found || null;
};

  return {
    products,
    loading,
    addProduct,
    deleteProduct,
    deleteAllProducts,
    bulkImportProducts,
    findProductByEan,
    refetch: () => {}, // Ya no es necesario porque es local
  };
}