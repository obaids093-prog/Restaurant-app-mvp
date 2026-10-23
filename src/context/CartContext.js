import React, { createContext, useContext, useReducer, useEffect } from 'react';
import safeStorage from '../utils/safeStorage';
import apiClient from '../api/client';
import { cartReducer, initialCartState } from '../reducers/cartReducer';
import { useMenu } from './MenuContext';

export const CartContext = createContext(null);

const CART_STORAGE_KEY = '@aura_cart_state';

export const CartProvider = ({ children }) => {
  const [cartState, dispatch] = useReducer(cartReducer, initialCartState);
  const { menuItems } = useMenu();

  // Keep cart items and prices in sync with latest fetched menu
  useEffect(() => {
    if (menuItems && menuItems.length > 0) {
      dispatch({ type: 'SYNC_PRICES', payload: { menuItems } });
    }
  }, [menuItems]);

  // Restore cart on app launch
  useEffect(() => {
    const restoreCart = async () => {
      try {
        const saved = await safeStorage.getItem(CART_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.items)) {
            // Restore items
            parsed.items.forEach((item) => {
              dispatch({ type: 'ADD_ITEM', payload: { item } });
            });
            if (parsed.promoCode) {
              try {
                dispatch({
                  type: 'APPLY_PROMO',
                  payload: {
                    code: parsed.promoCode,
                    discountPercent: parsed.discountPercent,
                    discountAmount: parsed.discountAmount,
                    discountType: parsed.discountType,
                    voucherDetails: parsed.voucherDetails,
                  },
                });
              } catch (_) {}
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load cart from storage', e);
      }
    };

    restoreCart();
  }, []);

  // Save cart changes to storage
  useEffect(() => {
    (async () => {
      try {
        await safeStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
      } catch (e) {
        console.warn('Failed to persist cart', e);
      }
    })();
  }, [cartState]);

  // Derived live count of all items (e.g. 2 steaks + 1 drink = 3)
  const totalItemCount = cartState.items.reduce((sum, item) => sum + item.quantity, 0);

  const getSubtotal = () => {
    return cartState.items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  };

  // Helper action methods
  const addItem = (item) => dispatch({ type: 'ADD_ITEM', payload: { item } });
  const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  const increment = (id) => dispatch({ type: 'INCREMENT', payload: { id } });
  const decrement = (id) => dispatch({ type: 'DECREMENT', payload: { id } });
  const updateNote = (id, note) => dispatch({ type: 'UPDATE_NOTE', payload: { id, note } });

  const applyPromo = async (code, subtotal = null, branchId = 'all') => {
    const cleanCode = code ? code.trim().toUpperCase() : '';
    if (!cleanCode) {
      throw new Error('Please enter a voucher code.');
    }

    const currentSubtotal =
      subtotal !== null && subtotal !== undefined ? Number(subtotal) : getSubtotal();

    try {
      const response = await apiClient('/api/vouchers/validate', {
        method: 'POST',
        body: { code: cleanCode, subtotal: currentSubtotal, branchId },
      });

      if (response && response.success && response.data) {
        const data = response.data;
        dispatch({
          type: 'APPLY_PROMO',
          payload: {
            code: data.code,
            discountPercent: data.discountType === 'percentage' ? data.discountValue : 0,
            discountAmount: data.discountAmount,
            discountType: data.discountType,
            voucherDetails: data,
          },
        });
        return data;
      }
      throw new Error(response?.message || 'Failed to validate voucher');
    } catch (err) {
      // Fallback for legacy hardcoded promo codes if offline or not in DB
      const { PROMO_CODES } = require('../reducers/cartReducer');
      if (PROMO_CODES[cleanCode]) {
        const percent = PROMO_CODES[cleanCode];
        const discAmount = Math.round(currentSubtotal * (percent / 100));
        dispatch({
          type: 'APPLY_PROMO',
          payload: {
            code: cleanCode,
            discountPercent: percent,
            discountAmount: discAmount,
            discountType: 'percentage',
          },
        });
        return {
          valid: true,
          code: cleanCode,
          discountType: 'percentage',
          discountValue: percent,
          discountAmount: discAmount,
        };
      }
      throw err;
    }
  };

  const removePromo = () => dispatch({ type: 'REMOVE_PROMO' });
  const setPointsRedemption = (points, discountAmount) => {
    dispatch({ type: 'SET_POINTS_TO_REDEEM', payload: { points, discountAmount } });
  };
  const clearPointsRedemption = () => dispatch({ type: 'CLEAR_POINTS' });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  return (
    <CartContext.Provider
      value={{
        cartState,
        dispatch,
        totalItemCount,
        addItem,
        removeItem,
        increment,
        decrement,
        updateNote,
        applyPromo,
        removePromo,
        setPointsRedemption,
        clearPointsRedemption,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
