"use client";

import React, { useState, useEffect } from "react";
import { Navigation, ShieldCheck, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function DeliveryDashboard() {
  const [user, setUser] = useState<any>(null);
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [verifyingOrder, setVerifyingOrder] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => toast.error("Please enable location to see nearby orders")
      );
    }
  }, []);

  const fetchOrders = async () => {
    try {
      if (location) {
        // Fetch open pool
        const poolRes = await fetch(`/api/admin/delivery-pool?lat=${location.lat}&lng=${location.lng}`);
        const poolData = await poolRes.json();
        if (poolData.status) setOpenOrders(poolData.data);
      }

      // Fetch my claimed orders
      const myRes = await fetch(`/api/admin/orders`);
      const myData = await myRes.json();
      if (myData.status) {
        // filter orders where I am the delivery boy
        const mine = myData.data.filter((o: any) => o.deliveryBoyId === user?._id && o.orderStatus !== "delivered");
        setMyOrders(mine);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [location, user]);

  const claimOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/claim`, { method: "POST" });
      const data = await res.json();
      if (data.status) {
        toast.success("Order claimed!");
        fetchOrders();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to claim order");
    }
  };

  const verifyPinAndDeliver = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput })
      });
      const data = await res.json();
      if (data.status) {
        toast.success("PIN Verified! Order Delivered. Earnings added to wallet.");
        setVerifyingOrder(null);
        setPinInput("");
        fetchOrders();
      } else {
        toast.error(data.message || "Invalid PIN");
      }
    } catch (err) {
      toast.error("Failed to verify PIN");
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-primary text-white p-6 rounded-2xl flex items-center justify-between shadow-lg">
        <div>
          <h1 className="text-2xl font-bold">Delivery Dashboard</h1>
          <p className="opacity-90 mt-1">Hello, {user?.name}</p>
        </div>
        <div className="bg-white/20 p-4 rounded-xl text-right">
          <p className="text-xs uppercase tracking-wider font-semibold opacity-80 mb-1">Wallet Balance</p>
          <p className="text-2xl font-bold">₦{user?.walletBalance?.toLocaleString() || "0"}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Deliveries */}
        <div className="bg-white border border-[#EFF0F6] rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#14142B] mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" /> My Active Deliveries
          </h2>
          <div className="space-y-4">
            {myOrders.length === 0 && <p className="text-sm text-[#6E7191]">No active deliveries. Claim an order below!</p>}
            {myOrders.map(order => (
              <div key={order._id} className="border border-[#EFF0F6] rounded-xl p-4 bg-[#F7F7FC]">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-[#14142B]">{order.orderSerialNo}</span>
                  <span className="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">Out for Delivery</span>
                </div>
                <p className="text-sm text-[#6E7191] mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> {order.deliveryAddress}</p>
                <p className="text-sm text-[#6E7191] mb-3">Customer: {order.customerPhone}</p>
                
                {verifyingOrder === order._id ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter 4-digit PIN from customer" 
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-center tracking-[0.5em] font-mono font-bold"
                    />
                    <button 
                      onClick={() => verifyPinAndDeliver(order._id)}
                      className="bg-green-500 text-white px-4 rounded-lg font-bold hover:bg-green-600"
                    >
                      Verify
                    </button>
                    <button 
                      onClick={() => { setVerifyingOrder(null); setPinInput(""); }}
                      className="bg-gray-200 text-gray-700 px-3 rounded-lg"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setVerifyingOrder(order._id)}
                    className="w-full py-2 bg-primary text-white rounded-lg font-semibold flex items-center justify-center gap-2 text-sm hover:bg-[#e60060]"
                  >
                    <ShieldCheck className="w-4 h-4" /> Enter Completion PIN
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Open Pool */}
        <div className="bg-white border border-[#EFF0F6] rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#14142B] mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-500" /> Nearby Open Pool
          </h2>
          {!location && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">Waiting for GPS location...</p>}
          <div className="space-y-4">
            {location && openOrders.length === 0 && <p className="text-sm text-[#6E7191]">No nearby orders ready for delivery.</p>}
            {openOrders.map(order => (
              <div key={order._id} className="border border-[#EFF0F6] rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-[#14142B]">{order.orderSerialNo}</span>
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">Ready</span>
                </div>
                <p className="text-sm text-[#6E7191] mb-1">To: {order.deliveryAddress}</p>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-[11px] font-semibold text-[#A0A3BD] uppercase tracking-wider">Earn: ~₦{order.deliveryCharge}</p>
                  <button 
                    onClick={() => claimOrder(order._id)}
                    className="px-4 py-1.5 bg-[#14142B] text-white text-xs font-bold rounded-lg hover:bg-black"
                  >
                    Claim Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
