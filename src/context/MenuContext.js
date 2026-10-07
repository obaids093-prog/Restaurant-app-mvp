import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

export const MenuContext = createContext(null);

export const MenuProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [isMenuLoaded, setIsMenuLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to ensure each item has consistent id / _id
  const normalizeItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({
      ...item,
      id: item._id || item.id,
      _id: item._id || item.id,
    }));
  };

  // Fetch full menu from server GET /api/menu
  const fetchMenu = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient('/api/menu');
      const normalized = normalizeItems(data);
      setMenuItems(normalized);
      setIsMenuLoaded(true);
      return normalized;
    } catch (err) {
      console.warn('Failed to fetch menu from server:', err.message);
      setError(err.message || 'Failed to fetch menu items');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load on startup
  useEffect(() => {
    fetchMenu().catch(() => {});
  }, [fetchMenu]);

  // 1. Toggle Item Availability (Manager PUT /api/menu/:id)
  const toggleAvailability = async (itemId) => {
    const item = menuItems.find((m) => m.id === itemId || m._id === itemId);
    if (!item) return;

    const newStatus = !item.isAvailable;
    try {
      await apiClient(`/api/menu/${item._id || item.id}`, {
        method: 'PUT',
        body: { isAvailable: newStatus },
      });
      // Reload updated menu list from server (Question 6 requirement)
      await fetchMenu();
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      throw err;
    }
  };

  // 2. Edit Item Price (Manager PUT /api/menu/:id)
  const updatePrice = async (itemId, newPrice) => {
    const item = menuItems.find((m) => m.id === itemId || m._id === itemId);
    if (!item) return;

    try {
      await apiClient(`/api/menu/${item._id || item.id}`, {
        method: 'PUT',
        body: { price: Number(newPrice) },
      });
      // Reload updated menu list from server (Question 6 requirement)
      await fetchMenu();
    } catch (err) {
      console.error('Failed to update price:', err);
      throw err;
    }
  };

  // 3. Add New Item (Manager POST /api/menu)
  const addMenuItem = async (itemData) => {
    try {
      const newItem = await apiClient('/api/menu', {
        method: 'POST',
        body: {
          name: itemData.name,
          description: itemData.description,
          price: Number(itemData.price),
          category: itemData.category || 'Mains',
          image:
            itemData.image ||
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop',
          isSpecial: Boolean(itemData.isSpecial),
          isAvailable: true,
          prepTime: itemData.prepTime || '15 min',
          rating: 4.9,
          tag: itemData.tag || 'Chef Special',
        },
      });

      // Reload updated menu list from server
      await fetchMenu();
      return newItem;
    } catch (err) {
      console.error('Failed to add menu item:', err);
      throw err;
    }
  };

  // 4. Delete Item (Manager DELETE /api/menu/:id)
  const deleteMenuItem = async (itemId) => {
    const item = menuItems.find((m) => m.id === itemId || m._id === itemId);
    if (!item) return;

    try {
      await apiClient(`/api/menu/${item._id || item.id}`, {
        method: 'DELETE',
      });
      await fetchMenu();
    } catch (err) {
      console.error('Failed to delete menu item:', err);
      throw err;
    }
  };

  return (
    <MenuContext.Provider
      value={{
        menuItems,
        isMenuLoaded,
        isLoading,
        error,
        fetchMenu,
        toggleAvailability,
        updatePrice,
        addMenuItem,
        deleteMenuItem,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};
