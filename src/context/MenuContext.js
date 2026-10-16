import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../api/client';

export const MenuContext = createContext(null);

// Pure helper to ensure each item has consistent id / _id
const normalizeItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    ...item,
    id: item._id || item.id,
    _id: item._id || item.id,
  }));
};

// Field-by-field equality check across all displayed fields without JSON serialization
const areMenuItemsEqual = (listA, listB) => {
  if (listA === listB) return true;
  if (!Array.isArray(listA) || !Array.isArray(listB)) return false;
  if (listA.length !== listB.length) return false;

  for (let i = 0; i < listA.length; i++) {
    const a = listA[i];
    const b = listB[i];
    if (!a || !b) return false;
    if (
      (a.id || a._id) !== (b.id || b._id) ||
      a.name !== b.name ||
      a.description !== b.description ||
      Number(a.price) !== Number(b.price) ||
      a.category !== b.category ||
      a.image !== b.image ||
      Boolean(a.isAvailable) !== Boolean(b.isAvailable) ||
      Boolean(a.isSpecial) !== Boolean(b.isSpecial) ||
      a.prepTime !== b.prepTime ||
      Number(a.rating) !== Number(b.rating) ||
      a.tag !== b.tag
    ) {
      return false;
    }
  }
  return true;
};

export const MenuProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [isMenuLoaded, setIsMenuLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch full menu from server GET /api/menu
  const fetchMenu = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient('/api/menu');
      const normalized = normalizeItems(data);
      setMenuItems((prev) => {
        if (areMenuItemsEqual(prev, normalized)) {
          return prev;
        }
        return normalized;
      });
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

  // Stable sync callback with comprehensive field equality check
  const syncMenuItems = useCallback((items) => {
    if (!Array.isArray(items)) return;
    const normalized = normalizeItems(items);
    setMenuItems((prev) => {
      if (areMenuItemsEqual(prev, normalized)) {
        return prev;
      }
      return normalized;
    });
  }, []);

  // 1. Toggle Item Availability (Manager PUT /api/menu/:id)
  const toggleAvailability = useCallback(async (itemId) => {
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
  }, [menuItems, fetchMenu]);

  // 2. Edit Item Price (Manager PUT /api/menu/:id)
  const updatePrice = useCallback(async (itemId, newPrice) => {
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
  }, [menuItems, fetchMenu]);

  // 3. Add New Item (Manager POST /api/menu)
  const addMenuItem = useCallback(async (itemData) => {
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
  }, [fetchMenu]);

  // 4. Delete Item (Manager DELETE /api/menu/:id)
  const deleteMenuItem = useCallback(async (itemId) => {
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
  }, [menuItems, fetchMenu]);

  const value = useMemo(
    () => ({
      menuItems,
      setMenuItems,
      syncMenuItems,
      isMenuLoaded,
      isLoading,
      error,
      fetchMenu,
      toggleAvailability,
      updatePrice,
      addMenuItem,
      deleteMenuItem,
    }),
    [
      menuItems,
      syncMenuItems,
      isMenuLoaded,
      isLoading,
      error,
      fetchMenu,
      toggleAvailability,
      updatePrice,
      addMenuItem,
      deleteMenuItem,
    ]
  );

  return (
    <MenuContext.Provider value={value}>
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
