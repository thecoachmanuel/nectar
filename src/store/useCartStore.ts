import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartExtra {
  name: string;
  price: number;
}

export interface CartAddon {
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // unique item + variation hash
  itemId: string;
  storeId?: string; // added to support multi-store cart items
  name: string;
  image?: string;
  price: number; // base price + variation price
  quantity: number;
  variationName?: string;
  extras: CartExtra[];
  addons: CartAddon[];
  itemTotal: number;
}

interface CartState {
  items: CartItem[];

  orderType: "delivery" | "takeaway";
  couponCode: string;
  couponDiscount: number;
  deliveryTimeSlot: string;
  selectedAddressId?: string;

  // Actions

  setOrderType: (orderType: "delivery" | "takeaway") => void;
  addItem: (item: Omit<CartItem, "id" | "itemTotal">) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  setDeliveryTimeSlot: (slot: string) => void;
  setSelectedAddressId: (addressId: string) => void;

  // Calculations
  getSubtotal: () => number;
  getTotalAmount: (taxRate?: number, deliveryCharge?: number) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      orderType: "delivery",
      couponCode: "",
      couponDiscount: 0,
      deliveryTimeSlot: "As soon as possible",
      selectedAddressId: undefined,



      setOrderType: (orderType) => set({ orderType }),

      addItem: (newItem) => {
        const extrasHash = newItem.extras.map((e) => e.name).sort().join(",");
        const addonsHash = newItem.addons.map((a) => a.name).sort().join(",");
        const id = `${newItem.itemId}_${newItem.storeId || "admin"}_${newItem.variationName || "default"}_${extrasHash}_${addonsHash}`;

        const existingIndex = get().items.findIndex((item) => item.id === id);

        const extraTotal = newItem.extras.reduce((acc, e) => acc + e.price, 0);
        const addonTotal = newItem.addons.reduce((acc, a) => acc + a.price, 0);
        const unitPrice = newItem.price + extraTotal + addonTotal;

        if (existingIndex > -1) {
          const updatedItems = [...get().items];
          const newQty = updatedItems[existingIndex].quantity + newItem.quantity;
          updatedItems[existingIndex].quantity = newQty;
          updatedItems[existingIndex].itemTotal = unitPrice * newQty;
          set({ items: updatedItems });
        } else {
          const cartItem: CartItem = {
            ...newItem,
            id,
            itemTotal: unitPrice * newItem.quantity,
          };
          set({ items: [...get().items, cartItem] });
        }
      },

      updateQuantity: (id, delta) => {
        const items = get().items
          .map((item) => {
            if (item.id === id) {
              const newQty = item.quantity + delta;
              if (newQty <= 0) return null;
              const unitPrice = item.itemTotal / item.quantity;
              return { ...item, quantity: newQty, itemTotal: unitPrice * newQty };
            }
            return item;
          })
          .filter(Boolean) as CartItem[];

        set({ items });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      clearCart: () => set({ items: [], couponCode: "", couponDiscount: 0 }),

      applyCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),

      removeCoupon: () => set({ couponCode: "", couponDiscount: 0 }),

      setDeliveryTimeSlot: (slot) => set({ deliveryTimeSlot: slot }),

      setSelectedAddressId: (addressId) => set({ selectedAddressId: addressId }),

      getSubtotal: () => {
        return get().items.reduce((acc, item) => acc + item.itemTotal, 0);
      },

      getTotalAmount: (taxRate = 0, deliveryCharge = 0) => {
        const subtotal = get().getSubtotal();
        const tax = (subtotal * taxRate) / 100;
        const discount = get().couponDiscount;
        const finalTotal = Math.max(0, subtotal + tax + (get().orderType === "delivery" ? deliveryCharge : 0) - discount);
        return parseFloat(finalTotal.toFixed(2));
      },
    }),
    {
      name: "foodappi_cart_storage",
    }
  )
);
