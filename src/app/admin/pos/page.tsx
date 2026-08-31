"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { 
  ArrowLeft,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  ChevronDown,
  Loader2,
  Store
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { formatPrice } from "@/lib/formatters";

export default function POSPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { activeAdminStoreId } = useAuthStore();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  const [selectedBranch, setSelectedBranch] = useState(activeAdminStoreId || "0");
  const [orderType, setOrderType] = useState("takeaway");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, itemRes, branchRes] = await Promise.all([
          fetch("/api/frontend/categories").catch(() => null),
          fetch(`/api/frontend/items?storeId=${activeAdminStoreId || "0"}`).catch(() => null),
          fetch("/api/frontend/stores").catch(() => null)
        ]);

        if (catRes && catRes.ok) {
          const catData = await catRes.json();
          if (catData.status) setCategories(catData.data || []);
        }

        if (itemRes && itemRes.ok) {
          const itemData = await itemRes.json();
          if (itemData.status) setProducts(itemData.data || []);
        }

        if (branchRes && branchRes.ok) {
          const branchData = await branchRes.json();
          if (branchData.status && Array.isArray(branchData.data)) {
            setBranches(branchData.data);
          }
        }
      } catch (err) {
        toast.error("Failed to load POS data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setSelectedBranch(activeAdminStoreId || "0");
  }, [activeAdminStoreId]);
  
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.itemId === product._id);
      if (existing) {
        return prev.map(item => item.itemId === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        itemId: product._id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        image: product.image 
      }];
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.itemId === itemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.itemId !== itemId));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = 0;
  const deliveryCharge = orderType === "delivery" ? 500 : 0;
  const total = subtotal - discount + deliveryCharge;

  const handleOrder = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!selectedBranch || selectedBranch === "0") return toast.error("Please select a specific store context in the Navbar to place an order.");
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/frontend/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          orderType,
          branchId: selectedBranch,
          items: cart,
          subtotal,
          discountAmount: discount,
          deliveryCharge,
          totalAmount: total,
          paymentMethod: "cash_on_delivery",
          orderStatus: "accepted", // POS orders can be immediately accepted
          deliveryAddress: orderType === "delivery" ? "POS Manual Delivery" : undefined,
          isPos: true
        })
      });
      const data = await res.json();
      if (data.status) {
        toast.success(`Order placed: ${data.orderSerialNo}`);
        setCart([]);
        setCartOpen(false);
      } else {
        toast.error(data.message || "Checkout failed");
      }
    } catch (err) {
      toast.error("Checkout failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === "All" || p.categoryId?._id === activeCategory || p.categoryId?.name === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F7F7FC] flex flex-col">
      {/* Header for POS */}
      <header className="h-[70px] bg-white border-b border-[#EFF0F6] flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="w-10 h-10 rounded-xl bg-[#F7F7FC] text-[#6E7191] flex items-center justify-center hover:bg-[#EFF0F6] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="font-semibold text-xl text-[#14142B] hidden sm:block">Point of Sale</h2>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items..." 
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-primary transition-colors"
              />
            <Search className="w-4 h-4 text-[#A0A3BD] absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <button 
          onClick={() => setCartOpen(!cartOpen)}
          className="lg:hidden w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center relative shadow-md shadow-primary/20"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#14142B] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {cart.length}
          </span>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Products Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Categories Slider */}
          <div className="bg-white border-b border-[#EFF0F6] p-4 shrink-0 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveCategory("All")}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  activeCategory === "All" 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "bg-[#FAFAFC] text-[#6E7191] hover:bg-[#EFF0F6]"
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button 
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat._id 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "bg-[#FAFAFC] text-[#6E7191] hover:bg-[#EFF0F6]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {loading ? (
                <div className="col-span-full py-12 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
              ) : filteredProducts.map(product => (
                <div key={product._id} onClick={() => addToCart(product)} className="bg-white rounded-2xl border border-[#EFF0F6] overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                  <div className="aspect-square bg-[#F7F7FC] relative overflow-hidden">
                    <img src={product.image || "/images/default/item.png"} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="font-semibold text-sm text-[#14142B] mb-1 truncate">{product.name}</h3>
                    <p className="font-bold text-primary text-sm">{formatPrice(product.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Sidebar */}
        {cartOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setCartOpen(false)}></div>
        )}
        
        <div className={`fixed lg:static inset-y-0 right-0 z-50 w-[360px] bg-white border-l border-[#EFF0F6] shadow-xl lg:shadow-none flex flex-col transition-transform duration-300 ${cartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
          
          <div className="p-4 border-b border-[#EFF0F6] shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 relative">
                <select 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-11 pl-3 pr-8 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-primary appearance-none font-medium text-[#14142B]"
                >
                  <option value="Walk-in Customer">Walk-in Customer</option>
                  <option value="Phone Order">Phone Order</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#A0A3BD] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div className="flex-1 relative bg-[#FAFAFC] border border-[#EFF0F6] rounded-xl h-11 flex items-center px-3">
                <Store className="w-4 h-4 text-[#A0A3BD] mr-2" />
                <span className="text-sm font-medium text-[#14142B] truncate">
                  {selectedBranch === "0" ? "All Stores (Select in Nav)" : (branches.find(b => b._id === selectedBranch)?.name || "Store Context")}
                </span>
              </div>
            </div>

            <div className="flex bg-[#F7F7FC] rounded-xl p-1 mb-3">
              <button 
                onClick={() => setOrderType('takeaway')}
                className={`flex-1 h-9 rounded-lg font-semibold text-sm transition-colors ${orderType === 'takeaway' ? 'bg-white text-[#14142B] shadow-sm' : 'text-[#6E7191] hover:text-[#14142B]'}`}
              >
                Takeaway
              </button>
              <button 
                onClick={() => setOrderType('delivery')}
                className={`flex-1 h-9 rounded-lg font-semibold text-sm transition-colors ${orderType === 'delivery' ? 'bg-white text-[#14142B] shadow-sm' : 'text-[#6E7191] hover:text-[#14142B]'}`}
              >
                Delivery
              </button>
            </div>
            
            <input 
              type="text" 
              placeholder="Token No. (Optional)" 
              className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <ul className="space-y-4">
              {cart.length === 0 && <div className="text-center text-[#6E7191] py-8">Cart is empty</div>}
              {cart.map(item => (
                <li key={item.itemId} className="flex gap-3 border-b border-dashed border-[#EFF0F6] pb-4 last:border-none last:pb-0">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-[#14142B] mb-1">{item.name}</h4>
                    <p className="font-bold text-sm text-[#14142B]">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => removeFromCart(item.itemId)} className="text-[#FB4E4E] hover:text-red-700 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 bg-[#F7F7FC] rounded-lg p-1 border border-[#EFF0F6]">
                      <button onClick={() => updateQty(item.itemId, -1)} className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center text-primary hover:bg-[#fff5f9]">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.itemId, 1)} className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center text-primary hover:bg-[#fff5f9]">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Cart Summary & Checkout */}
          <div className="p-4 border-t border-[#EFF0F6] bg-[#FAFAFC] shrink-0">
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Add Discount" className="flex-1 h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-primary" />
              <button className="px-4 h-10 rounded-xl bg-[#008BBA] text-white text-sm font-semibold hover:bg-[#00749b] transition-colors">Apply</button>
            </div>
            
            <ul className="space-y-2 mb-4">
              <li className="flex justify-between text-sm">
                <span className="text-[#6E7191]">Sub Total</span>
                <span className="font-semibold text-[#14142B]">{formatPrice(subtotal)}</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-[#6E7191]">Discount</span>
                <span className="font-semibold text-[#14142B]">{formatPrice(discount)}</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-[#6E7191]">Delivery Charge</span>
                <span className="font-semibold text-[#1AB759]">{formatPrice(deliveryCharge)}</span>
              </li>
              <li className="flex justify-between text-base pt-2 border-t border-dashed border-[#EFF0F6] mt-2">
                <span className="font-bold text-[#14142B]">Total</span>
                <span className="font-bold text-primary">{formatPrice(total)}</span>
              </li>
            </ul>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCart([])} className="h-11 rounded-xl bg-[#FB4E4E] text-white font-semibold text-sm hover:bg-[#e03c3c] transition-colors">
                Clear
              </button>
              <button 
                onClick={handleOrder} 
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-[#1AB759] text-white font-semibold text-sm hover:bg-[#159a4a] transition-colors shadow-md shadow-[#1AB759]/20 flex justify-center items-center gap-2 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Place Order"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
