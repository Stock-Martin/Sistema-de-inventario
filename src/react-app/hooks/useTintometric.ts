import { useState, useEffect } from 'react';

export interface TintometricRecord {
  id: number;
  sucursal: string;
  product_id: number;
  ean: string;
  quantity: number;
  code: string;
  description: string;
  created_at: string;
}

export function useTintometric(sucursal: string) {
  const [records, setRecords] = useState<TintometricRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    if (!sucursal) {
      setRecords([]);
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/tintometric/sucursal/${encodeURIComponent(sucursal)}`);
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching tintometric records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [sucursal]);

  const addRecord = async (record: {
    sucursal: string;
    product_id: number;
    ean: string;
    quantity: number;
  }) => {
    try {
      await fetch('/api/tintometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      await fetchRecords();
      return true;
    } catch (error) {
      console.error('Error adding tintometric record:', error);
      return false;
    }
  };

  const updateRecord = async (id: number, quantity: number) => {
    try {
      await fetch(`/api/tintometric/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      await fetchRecords();
    } catch (error) {
      console.error('Error updating tintometric record:', error);
    }
  };

  const deleteRecord = async (id: number) => {
    try {
      await fetch(`/api/tintometric/${id}`, { method: 'DELETE' });
      await fetchRecords();
    } catch (error) {
      console.error('Error deleting tintometric record:', error);
    }
  };

  const clearAll = async () => {
    if (!confirm('¿Está seguro de limpiar todos los registros de esta sucursal?')) {
      return;
    }
    
    try {
      await fetch(`/api/tintometric/sucursal/${encodeURIComponent(sucursal)}`, {
        method: 'DELETE',
      });
      await fetchRecords();
    } catch (error) {
      console.error('Error clearing tintometric records:', error);
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
