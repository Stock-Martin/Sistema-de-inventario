import { useState, useEffect } from 'react';

export interface InventoryRecord {
  id: number;
  marbete_number: string;
  product_id: number;
  ean: string;
  quantity: number;
  code: string;
  description: string;
  created_at: string;
}

export function useInventory(marbeteNumber: string) {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    if (!marbeteNumber) {
      setRecords([]);
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/inventory/marbete/${encodeURIComponent(marbeteNumber)}`);
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching inventory records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [marbeteNumber]);

  const addRecord = async (record: {
    marbete_number: string;
    product_id: number;
    ean: string;
    quantity: number;
  }) => {
    try {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      await fetchRecords();
      return true;
    } catch (error) {
      console.error('Error adding inventory record:', error);
      return false;
    }
  };

  const updateRecord = async (id: number, quantity: number) => {
    try {
      await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      await fetchRecords();
    } catch (error) {
      console.error('Error updating inventory record:', error);
    }
  };

  const deleteRecord = async (id: number) => {
    try {
      await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      await fetchRecords();
    } catch (error) {
      console.error('Error deleting inventory record:', error);
    }
  };

  const clearAll = async () => {
    if (!confirm('¿Está seguro de limpiar todos los registros de este marbete?')) {
      return;
    }
    
    try {
      await fetch(`/api/inventory/marbete/${encodeURIComponent(marbeteNumber)}`, {
        method: 'DELETE',
      });
      await fetchRecords();
    } catch (error) {
      console.error('Error clearing inventory:', error);
    }
  };

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    clearAll,
    refetch: fetchRecords,
  };
}
