/**
 * Pure Cart Reducer
 * Handles state transitions for culinary orders, promos, notes, and item steppers.
 * Guarantees zero mutations by returning new immutable state copies.
 */

export const PROMO_CODES = {
  WELCOME10: 10,  // 10% Off
  FEAST20: 20,    // 20% Off
  AURA10: 10,     // 10% Off
  AURA20: 20,     // 20% Off
  AURA30: 30,     // 30% Off
  AURA50: 50,     // 50% Off
  SAVE10: 10,     // 10% Off
  TASTY20: 20,    // 20% Off
  CHEF15: 15,     // 15% Chef Special
  GOURMET30: 30,  // 30% Off VIP
};

export const initialCartState = {
  items: [],
  promoCode: null,
  discountPercent: 0,
  discountAmount: 0,
  discountType: null,
  voucherDetails: null,
  pointsToRedeem: 0,
  pointsDiscountAmount: 0,
  orderType: 'dine-in',
};

export function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item } = action.payload;
      const existingIndex = state.items.findIndex((i) => i.id === item.id);

      if (existingIndex > -1) {
        // Increment quantity of existing item immutably
        const updatedItems = state.items.map((cartItem, index) => {
          if (index === existingIndex) {
            return { ...cartItem, quantity: cartItem.quantity + 1 };
          }
          return cartItem;
        });
        return { ...state, items: updatedItems };
      }

      // Add fresh item with quantity 1 and empty special note
      const newItem = {
        ...item,
        quantity: 1,
        note: '',
      };
      return { ...state, items: [...state.items, newItem] };
    }

    case 'REMOVE_ITEM': {
      const { id } = action.payload;
      return {
        ...state,
        items: state.items.filter((item) => item.id !== id),
      };
    }

    case 'INCREMENT':
    case 'INCREMENT_QUANTITY': {
      const { id } = action.payload;
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id === id) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        }),
      };
    }

    case 'DECREMENT':
    case 'DECREMENT_QUANTITY': {
      const { id } = action.payload;
      const target = state.items.find((item) => item.id === id);

      if (!target) return state;

      // Specification: If quantity reaches 0, remove item from items
      if (target.quantity <= 1) {
        return {
          ...state,
          items: state.items.filter((item) => item.id !== id),
        };
      }

      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id === id) {
            return { ...item, quantity: item.quantity - 1 };
          }
          return item;
        }),
      };
    }

    case 'SET_ORDER_TYPE': {
      return {
        ...state,
        orderType: action.payload?.orderType || action.payload || 'dine-in',
      };
    }

    case 'UPDATE_NOTE': {
      const { id, note } = action.payload;
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id === id) {
            return { ...item, note };
          }
          return item;
        }),
      };
    }

    case 'APPLY_PROMO': {
      const { code, discountPercent, discountAmount, discountType, voucherDetails } = action.payload || {};
      const cleanCode = code ? code.trim().toUpperCase() : '';

      // Server-validated voucher payload
      if (discountPercent !== undefined || discountAmount !== undefined || voucherDetails) {
        return {
          ...state,
          promoCode: cleanCode,
          discountPercent: typeof discountPercent === 'number' ? discountPercent : 0,
          discountAmount: typeof discountAmount === 'number' ? discountAmount : 0,
          discountType: discountType || (discountPercent > 0 ? 'percentage' : 'fixed'),
          voucherDetails: voucherDetails || null,
        };
      }

      // Pure reducer: if invalid, return state unchanged without side effects
      if (!PROMO_CODES[cleanCode]) {
        return state;
      }

      return {
        ...state,
        promoCode: cleanCode,
        discountPercent: PROMO_CODES[cleanCode] || 0,
        discountAmount: 0,
        discountType: 'percentage',
        voucherDetails: null,
      };
    }

    case 'REMOVE_PROMO': {
      return {
        ...state,
        promoCode: null,
        discountPercent: 0,
        discountAmount: 0,
        discountType: null,
        voucherDetails: null,
      };
    }

    case 'SET_POINTS_TO_REDEEM': {
      const { points, discountAmount } = action.payload || {};
      return {
        ...state,
        pointsToRedeem: typeof points === 'number' ? Math.max(0, points) : 0,
        pointsDiscountAmount: typeof discountAmount === 'number' ? Math.max(0, discountAmount) : 0,
      };
    }

    case 'CLEAR_POINTS': {
      return {
        ...state,
        pointsToRedeem: 0,
        pointsDiscountAmount: 0,
      };
    }

    case 'CLEAR_CART': {
      return {
        items: [],
        promoCode: null,
        discountPercent: 0,
        discountAmount: 0,
        discountType: null,
        voucherDetails: null,
        pointsToRedeem: 0,
        pointsDiscountAmount: 0,
      };
    }

    case 'SYNC_PRICES': {
      const { menuItems } = action.payload || {};
      if (!Array.isArray(menuItems) || menuItems.length === 0 || !Array.isArray(state.items) || state.items.length === 0) {
        return state;
      }

      const menuMap = new Map();
      menuItems.forEach((m) => {
        if (m.id) menuMap.set(String(m.id), m);
        if (m._id) menuMap.set(String(m._id), m);
        if (m.name) menuMap.set(m.name.toLowerCase().trim(), m);
      });

      let changed = false;
      const updatedItems = state.items.map((cartItem) => {
        const latest =
          menuMap.get(String(cartItem.id)) ||
          menuMap.get(String(cartItem._id)) ||
          menuMap.get(cartItem.name?.toLowerCase().trim());

        if (latest && latest.price !== undefined && Number(latest.price) !== Number(cartItem.price)) {
          changed = true;
          return {
            ...cartItem,
            price: Number(latest.price),
            isAvailable: latest.isAvailable !== undefined ? latest.isAvailable : cartItem.isAvailable,
          };
        }
        return cartItem;
      });

      if (!changed) return state;
      return { ...state, items: updatedItems };
    }

    default:
      return state;
  }
}
