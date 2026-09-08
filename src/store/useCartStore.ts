import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

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
  manageStock?: boolean;
  stockQuantity?: number;
  isOutOfStock?: boolean;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;

  orderType: "delivery" | "takeaway";
  couponCode: string;
  couponDiscount: number;
  deliveryTimeSlot: string;
  selectedAddressId?: string;

  // Actions
  openCart: () => void;
  closeCart: () => void;
  setCartOpen: (open: boolean) => void;
  setOrderType: (orderType: "delivery" | "takeaway") => void;
  addItem: (item: Omit<CartItem, "id" | "itemTotal">) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  setDeliveryTimeSlot: (slot: string) => void;
  setSelectedAddressId: (addressId: string) => void;
  setItems: (items: CartItem[]) => void;
  getItemTotalInCart: (itemId: string) => number;

  // Calculations
  getSubtotal: () => number;
  getTotalAmount: (taxRate?: number, deliveryCharge?: number) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      orderType: "delivery",
      couponCode: "",
      couponDiscount: 0,
      deliveryTimeSlot: "As soon as possible",
      selectedAddressId: undefined,

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      setCartOpen: (open) => set({ isCartOpen: open }),
      setOrderType: (orderType) => set({ orderType }),
      setItems: (items) => set({ items }),

      getItemTotalInCart: (itemId: string) => {
        return get().items
          .filter((item) => item.itemId === itemId)
          .reduce((sum, item) => sum + item.quantity, 0);
      },

      addItem: (newItem) => {
        // Check if item is marked out of stock
        if (newItem.isOutOfStock || (newItem.manageStock && (newItem.stockQuantity ?? 0) <= 0)) {
          toast.error(`"${newItem.name}" is currently out of stock.`);
          return;
        }

        const currentItems = get().items;
        const currentQtyForProduct = currentItems
          .filter((item) => item.itemId === newItem.itemId)
          .reduce((sum, item) => sum + item.quantity, 0);

        let allowedToAdd = newItem.quantity;

        if (newItem.manageStock) {
          const maxStock = Math.max(0, Number(newItem.stockQuantity ?? 0));
          const remainingStock = Math.max(0, maxStock - currentQtyForProduct);

          if (remainingStock <= 0) {
            toast.error(`Cannot add more. You already have the maximum available stock (${maxStock}) in your cart.`);
            return;
          }

          if (newItem.quantity > remainingStock) {
            allowedToAdd = remainingStock;
            toast.warning(`Only ${remainingStock} unit(s) left in stock. Added ${remainingStock} to cart.`);
          }
        }

        const extrasHash = newItem.extras.map((e) => e.name).sort().join(",");
        const addonsHash = newItem.addons.map((a) => a.name).sort().join(",");
        const id = `${newItem.itemId}_${newItem.storeId || "admin"}_${newItem.variationName || "default"}_${extrasHash}_${addonsHash}`;

        const existingIndex = currentItems.findIndex((item) => item.id === id);

        const extraTotal = newItem.extras.reduce((acc, e) => acc + (Number(e.price) || 0), 0);
        const addonTotal = newItem.addons.reduce((acc, a) => acc + (Number(a.price) || 0), 0);
        const unitPrice = (Number(newItem.price) || 0) + extraTotal + addonTotal;

        if (existingIndex > -1) {
          const updatedItems = [...currentItems];
          const newQty = updatedItems[existingIndex].quantity + allowedToAdd;
          updatedItems[existingIndex].quantity = newQty;
          updatedItems[existingIndex].itemTotal = unitPrice * newQty;
          if (newItem.manageStock !== undefined) updatedItems[existingIndex].manageStock = newItem.manageStock;
          if (newItem.stockQuantity !== undefined) updatedItems[existingIndex].stockQuantity = newItem.stockQuantity;
          if (newItem.isOutOfStock !== undefined) updatedItems[existingIndex].isOutOfStock = newItem.isOutOfStock;
          set({ items: updatedItems });
        } else {
          const cartItem: CartItem = {
            ...newItem,
            quantity: allowedToAdd,
            id,
            itemTotal: unitPrice * allowedToAdd,
          };
          set({ items: [...currentItems, cartItem] });
        }
      },

      updateQuantity: (id, delta) => {
        const currentItems = get().items;
        const target = currentItems.find((item) => item.id === id);
        if (!target) return;

        if (delta > 0 && target.manageStock) {
          const maxStock = Math.max(0, Number(target.stockQuantity ?? 0));
          const currentTotalForProduct = currentItems
            .filter((item) => item.itemId === target.itemId)
            .reduce((sum, item) => sum + item.quantity, 0);

          if (currentTotalForProduct + delta > maxStock) {
            toast.error(`Cannot add more. Only ${maxStock} available in stock.`);
            return;
          }
        }

        const newQty = target.quantity + delta;
        if (newQty <= 0) {
          set({ items: currentItems.filter((item) => item.id !== id) });
          return;
        }

        const extraTotal = target.extras?.reduce((acc, e) => acc + (Number(e.price) || 0), 0) || 0;
        const addonTotal = target.addons?.reduce((acc, a) => acc + (Number(a.price) || 0), 0) || 0;
        const unitPrice = (Number(target.price) || 0) + extraTotal + addonTotal;

        const items = currentItems.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              quantity: newQty,
              itemTotal: unitPrice * newQty,
            };
          }
          return item;
        });

        set({ items });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      clearCart: () => {
        set({ items: [], couponCode: "", couponDiscount: 0, selectedAddressId: undefined });
      },

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
      name: "errandshop_cart_storage",
    }
  )
);

// Backward-compatible local storage migration
if (typeof window !== "undefined") {
  try {
    const legacyCart = localStorage.getItem("nectar_cart_storage");
    if (legacyCart && !localStorage.getItem("errandshop_cart_storage")) {
      localStorage.setItem("errandshop_cart_storage", legacyCart);
    }
  } catch {}
}
