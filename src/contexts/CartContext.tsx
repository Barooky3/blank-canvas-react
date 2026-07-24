import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Product, CartItem } from '@/types/product';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; selectedMl?: number; selectedPrice?: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number; selectedMl?: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

interface CartContextType extends CartState {
  addItem: (product: Product, selectedMl?: number, selectedPrice?: number) => void;
  removeItem: (productId: string, selectedMl?: number) => void;
  updateQuantity: (productId: string, quantity: number, selectedMl?: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalPrice: number;
  subtotalBeforeDiscount: number;
  freeItemDiscount: number;
  freeItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'profparfums-cart';

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, selectedMl, selectedPrice } = action.payload;
      const cartKey = selectedMl ? `${product.id}-${selectedMl}` : product.id;
      const existingItem = state.items.find(item => {
        const itemKey = item.selectedMl ? `${item.product.id}-${item.selectedMl}` : item.product.id;
        return itemKey === cartKey;
      });
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item => {
            const itemKey = item.selectedMl ? `${item.product.id}-${item.selectedMl}` : item.product.id;
            return itemKey === cartKey
              ? { ...item, quantity: item.quantity + 1 }
              : item;
          }),
        };
      }
      return {
        ...state,
        items: [...state.items, { product, quantity: 1, selectedMl, selectedPrice }],
      };
    }
    case 'REMOVE_ITEM': {
      // action.payload can be "productId" or "productId-ml"
      return {
        ...state,
        items: state.items.filter(item => {
          const itemKey = item.selectedMl ? `${item.product.id}-${item.selectedMl}` : item.product.id;
          return itemKey !== action.payload;
        }),
      };
    }
    case 'UPDATE_QUANTITY': {
      const { productId, quantity, selectedMl } = action.payload;
      const cartKey = selectedMl ? `${productId}-${selectedMl}` : productId;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => {
            const itemKey = item.selectedMl ? `${item.product.id}-${item.selectedMl}` : item.product.id;
            return itemKey !== cartKey;
          }),
        };
      }
      return {
        ...state,
        items: state.items.map(item => {
          const itemKey = item.selectedMl ? `${item.product.id}-${item.selectedMl}` : item.product.id;
          return itemKey === cartKey
            ? { ...item, quantity }
            : item;
        }),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'OPEN_CART':
      return { ...state, isOpen: true };
    case 'CLOSE_CART':
      return { ...state, isOpen: false };
    case 'LOAD_CART':
      return { ...state, items: action.payload };
    default:
      return state;
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [state.items]);

  const addItem = (product: Product, selectedMl?: number, selectedPrice?: number) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, selectedMl, selectedPrice } });
    dispatch({ type: 'OPEN_CART' });
  };

  const removeItem = (productId: string, selectedMl?: number) => {
    const cartKey = selectedMl ? `${productId}-${selectedMl}` : productId;
    // Find and remove by the composite key
    const itemToRemove = state.items.find(item => {
      const itemKey = item.selectedMl ? `${item.product.id}-${item.selectedMl}` : item.product.id;
      return itemKey === cartKey;
    });
    if (itemToRemove) {
      dispatch({ type: 'REMOVE_ITEM', payload: itemToRemove.product.id + (itemToRemove.selectedMl ? `-${itemToRemove.selectedMl}` : '') });
    }
  };

  const updateQuantity = (productId: string, quantity: number, selectedMl?: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity, selectedMl } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const openCart = () => {
    dispatch({ type: 'OPEN_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate subtotal before any discount
  const subtotalBeforeDiscount = state.items.reduce(
    (sum, item) => sum + (item.selectedPrice || item.product.price) * item.quantity,
    0
  );

  // Calculate "Buy 3 Get Cheapest Free" discount (bundles + fragrances all count)
  const calculateFreeItemDiscount = () => {
    // Expand all items (bundles + fragrances) by quantity
    const allItems: number[] = [];
    state.items.forEach(item => {
      const price = item.selectedPrice || item.product.price;
      for (let i = 0; i < item.quantity; i++) {
        allItems.push(price);
      }
    });

    // Sort prices from lowest to highest
    allItems.sort((a, b) => a - b);

    // For every 3 items, the cheapest is free
    const freeItemsCount = Math.floor(allItems.length / 3);
    let discount = 0;
    
    // The cheapest items become free (first N items after sorting)
    for (let i = 0; i < freeItemsCount; i++) {
      discount += allItems[i];
    }

    return { discount, freeItemsCount };
  };

  const { discount: freeItemDiscount, freeItemsCount } = calculateFreeItemDiscount();
  const totalPrice = subtotalBeforeDiscount - freeItemDiscount;

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        totalItems,
        totalPrice,
        subtotalBeforeDiscount,
        freeItemDiscount,
        freeItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
