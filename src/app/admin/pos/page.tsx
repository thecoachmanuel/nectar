"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  ChevronDown
} from "lucide-react";

export default function POSPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [cartOpen, setCartOpen] = useState(false); // For mobile
  
  const categories = ["All", "Main Course", "Fast Food", "Beverages", "Dessert", "Appetizers"];
  
  const products = [
    { id: 1, name: "Chicken Biryani", price: 3500, category: "Main Course", image: "/images/default/item.png" },
    { id: 2, name: "Beef Burger", price: 2000, category: "Fast Food", image: "/images/default/item.png" },
    { id: 3, name: "Coca Cola", price: 500, category: "Beverages", image: "/images/default/item.png" },
    { id: 4, name: "Vanilla Ice Cream", price: 1500, category: "Dessert", image: "/images/default/item.png" },
    { id: 5, name: "Fried Rice", price: 3000, category: "Main Course", image: "/images/default/item.png" },
    { id: 6, name: "French Fries", price: 1000, category: "Fast Food", image: "/images/default/item.png" },
    { id: 7, name: "Orange Juice", price: 800, category: "Beverages", image: "/images/default/item.png" },
    { id: 8, name: "Chocolate Cake", price: 2500, category: "Dessert", image: "/images/default/item.png" },
  ];

  const [cart, setCart] = useState([
    { id: 1, name: "Chicken Biryani", price: 3500, qty: 2 },
    { id: 2, name: "Beef Burger", price: 2000, qty: 1 },
  ]);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const discount = 0;
  const deliveryCharge = 500;
  const total = subtotal - discount + deliveryCharge;

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
              placeholder="Search items..." 
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-[#ff006b] transition-colors"
            />
            <Search className="w-4 h-4 text-[#A0A3BD] absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <button 
          onClick={() => setCartOpen(!cartOpen)}
          className="lg:hidden w-11 h-11 rounded-xl bg-[#ff006b] text-white flex items-center justify-center relative shadow-md shadow-[#ff006b]/20"
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
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat 
                      ? "bg-[#ff006b] text-white shadow-md shadow-[#ff006b]/20" 
                      : "bg-[#FAFAFC] text-[#6E7191] hover:bg-[#EFF0F6]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-2xl border border-[#EFF0F6] overflow-hidden shadow-sm hover:shadow-md hover:border-[#ff006b]/30 transition-all cursor-pointer group">
                  <div className="aspect-square bg-[#F7F7FC] relative overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="font-semibold text-sm text-[#14142B] mb-1 truncate">{product.name}</h3>
                    <p className="font-bold text-[#ff006b] text-sm">₦{product.price.toLocaleString()}</p>
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
                <select className="w-full h-11 pl-3 pr-8 rounded-xl border border-[#EFF0F6] bg-[#FAFAFC] text-sm focus:outline-none focus:border-[#ff006b] appearance-none font-medium text-[#14142B]">
                  <option>Select Customer</option>
                  <option>Walk-in Customer</option>
                  <option>John Doe</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#A0A3BD] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button className="w-11 h-11 shrink-0 rounded-xl bg-[#ff006b] text-white flex items-center justify-center hover:bg-[#e60060] transition-colors">
                <UserPlus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex bg-[#F7F7FC] rounded-xl p-1 mb-3">
              <button className="flex-1 h-9 rounded-lg bg-white text-[#14142B] font-semibold text-sm shadow-sm transition-colors">
                Takeaway
              </button>
              <button className="flex-1 h-9 rounded-lg text-[#6E7191] font-semibold text-sm hover:text-[#14142B] transition-colors">
                Delivery
              </button>
            </div>
            
            <input 
              type="text" 
              placeholder="Token No. (Optional)" 
              className="w-full h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]"
            />
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <ul className="space-y-4">
              {cart.map(item => (
                <li key={item.id} className="flex gap-3 border-b border-dashed border-[#EFF0F6] pb-4 last:border-none last:pb-0">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-[#14142B] mb-1">{item.name}</h4>
                    <p className="font-bold text-sm text-[#14142B]">₦{(item.price * item.qty).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button className="text-[#FB4E4E] hover:text-red-700 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 bg-[#F7F7FC] rounded-lg p-1 border border-[#EFF0F6]">
                      <button className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center text-[#ff006b] hover:bg-[#fff5f9]">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                      <button className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center text-[#ff006b] hover:bg-[#fff5f9]">
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
              <input type="text" placeholder="Add Discount" className="flex-1 h-10 px-3 rounded-xl border border-[#EFF0F6] bg-white text-sm focus:outline-none focus:border-[#ff006b]" />
              <button className="px-4 h-10 rounded-xl bg-[#008BBA] text-white text-sm font-semibold hover:bg-[#00749b] transition-colors">Apply</button>
            </div>
            
            <ul className="space-y-2 mb-4">
              <li className="flex justify-between text-sm">
                <span className="text-[#6E7191]">Sub Total</span>
                <span className="font-semibold text-[#14142B]">₦{subtotal.toLocaleString()}</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-[#6E7191]">Discount</span>
                <span className="font-semibold text-[#14142B]">₦{discount.toLocaleString()}</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-[#6E7191]">Delivery Charge</span>
                <span className="font-semibold text-[#1AB759]">₦{deliveryCharge.toLocaleString()}</span>
              </li>
              <li className="flex justify-between text-base pt-2 border-t border-dashed border-[#EFF0F6] mt-2">
                <span className="font-bold text-[#14142B]">Total</span>
                <span className="font-bold text-[#ff006b]">₦{total.toLocaleString()}</span>
              </li>
            </ul>

            <div className="grid grid-cols-2 gap-3">
              <button className="h-11 rounded-xl bg-[#FB4E4E] text-white font-semibold text-sm hover:bg-[#e03c3c] transition-colors">
                Cancel
              </button>
              <button className="h-11 rounded-xl bg-[#1AB759] text-white font-semibold text-sm hover:bg-[#159a4a] transition-colors shadow-md shadow-[#1AB759]/20">
                Order
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
