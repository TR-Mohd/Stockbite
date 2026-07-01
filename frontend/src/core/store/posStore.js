import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePosStore = create(
  persist(
    (set, get) => ({
      cartItems: [],

      addToCart: (item, modifierIds = [], priceAdjustment = 0) => {
        set((state) => {
          // Explicitly check for identical base item and identical modifiers
          const isSameModifiers = (arr1, arr2) => {
            if (!arr1 || !arr2 || arr1.length !== arr2.length) return false;
            const sorted1 = [...arr1].sort();
            const sorted2 = [...arr2].sort();
            return sorted1.every((val, index) => val === sorted2[index]);
          };
          
          const existingIndex = state.cartItems.findIndex(
            (cartItem) => cartItem.id === item.id && isSameModifiers(cartItem.modifier_ids, modifierIds)
          );
          
          if (existingIndex >= 0) {
            const newCartItems = [...state.cartItems];
            newCartItems[existingIndex] = {
              ...newCartItems[existingIndex],
              qty: newCartItems[existingIndex].qty + 1
            };
            return { cartItems: newCartItems };
          }

          const newItem = {
            ...item,
            cartItemId: crypto.randomUUID(),
            qty: 1,
            notes: '',
            modifier_ids: modifierIds,
            // Calculate actual unit price for display and subtotaling
            price: item.price + priceAdjustment,
            originalPrice: item.price
          };

          return { cartItems: [...state.cartItems, newItem] };
        });
      },

      updateQuantity: (cartItemId, newQty) => {
        if (newQty <= 0) {
          get().removeItem(cartItemId);
          return;
        }
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.cartItemId === cartItemId ? { ...item, qty: newQty } : item
          )
        }));
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.cartItemId !== cartItemId)
        }));
      },

      clearCart: () => {
        set({ cartItems: [] });
      }
    }),
    {
      name: 'pos-cart-storage',
    }
  )
);
