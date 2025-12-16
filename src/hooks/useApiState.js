import { useState, useCallback } from 'react';

/**
 * Custom hook for managing state with API synchronization
 * Automatically calls API methods when state changes
 */
export function useApiState(api) {
  const [data, setData] = useState([]);

  const add = useCallback(async (item) => {
    try {
      await api.create(item);
      setData(prev => [...prev, item]);
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    }
  }, [api]);

  const update = useCallback(async (id, updates) => {
    try {
      await api.update(id, updates);
      setData(prev => prev.map(item => item.id === id ? updates : item));
    } catch (error) {
      console.error('Failed to update item:', error);
      throw error;
    }
  }, [api]);

  const remove = useCallback(async (id) => {
    try {
      await api.delete(id);
      setData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete item:', error);
      throw error;
    }
  }, [api]);

  const updateMany = useCallback(async (updateFn) => {
    const newData = updateFn(data);
    setData(newData);
    // Batch update - find changed items and update them
    for (let i = 0; i < newData.length; i++) {
      if (JSON.stringify(newData[i]) !== JSON.stringify(data[i])) {
        try {
          await api.update(newData[i].id, newData[i]);
        } catch (error) {
          console.error('Failed to update item:', error);
        }
      }
    }
  }, [api, data]);

  return {
    data,
    setData,
    add,
    update,
    remove,
    updateMany
  };
}
