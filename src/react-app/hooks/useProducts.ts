import { useState, useEffect } from 'react';

export interface Product {
  id: number;
  ean: string;
  code: string;
  description: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al agregar producto');
      }
      
      await fetchProducts();
      return true;
    } catch (error: any) {
      alert(error.message);
      return false;
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const deleteAllProducts = async () => {
    if (!confirm('¿Está seguro de eliminar TODOS los productos?')) {
      return;
    }
    
    try {
      await fetch('/api/products', { method: 'DELETE' });
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting all products:', error);
    }
  };

  const bulkImportProducts = async (productsData: Array<{ ean: string; code: string; description: string }>) => {
    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productsData),
      });
      
      if (!response.ok) {
        throw new Error('Error al importar productos');
      }
      
      await fetchProducts();
      return true;
    } catch (error: any) {
      alert(error.message);
      return false;
    }
  };

  const findProductByEan = async (ean: string): Promise<Product | null> => {
    try {
      const response = await fetch(`/api/products/by-ean/${encodeURIComponent(ean)}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      return null;
    }
  };

  return {
    products,
    loading,
    addProduct,
    deleteProduct,
    deleteAllProducts,
    bulkImportProducts,
    findProductByEan,
    refetch: fetchProducts,
  };
}
