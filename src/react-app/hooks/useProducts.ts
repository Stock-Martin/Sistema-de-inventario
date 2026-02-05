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
        ...p,
        id: Date.now() + index // ID único para evitar conflictos
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

  const findProductByEan = async (ean: string): Promise<Product | null> => {
    // Busca en la lista local que ya tenemos cargada
    const found = products.find(p => p.ean === ean);
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