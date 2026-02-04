import { useState, useEffect } from 'react';

export interface StockRecord {
  id: number;
  product_id: number;
  ean: string;
  code: string;
  description: string;
  counted_quantity: number | null;
  system_quantity: number | null;
  difference: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export function useStock() {
  const [records, setRecords] = useState<StockRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/stock');
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching stock records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const importInventory = async (items: any[]) => {
    try {
      const response = await fetch('/api/stock/import-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      if (response.ok) {
        await fetchRecords();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing inventory:', error);
      return false;
    }
  };

  const importStock = async (items: any[]) => {
    try {
      const response = await fetch('/api/stock/import-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      if (response.ok) {
        await fetchRecords();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing stock:', error);
      return false;
    }
  };

  const calculate = async () => {
    try {
      const response = await fetch('/api/stock/calculate', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchRecords();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error calculating differences:', error);
      return false;
    }
  };

  const clearAll = async () => {
    if (!confirm('¿Está seguro de limpiar todos los registros de stock?')) {
      return;
    }
    
    try {
      await fetch('/api/stock', { method: 'DELETE' });
      await fetchRecords();
    } catch (error) {
      console.error('Error clearing stock:', error);
    }
  };

  return {
    records,
    loading,
    importInventory,
    importStock,
    calculate,
    clearAll,
    refetch: fetchRecords,
  };
}
