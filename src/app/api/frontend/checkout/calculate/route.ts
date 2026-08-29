import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Store from "@/models/Store";
import Setting from "@/models/Setting";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { items, deliveryAddress, orderType } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ status: false, message: "Cart is empty" }, { status: 400 });
    }

    let subtotal = 0;
    const storeIds = new Set<string>();

    items.forEach((item: any) => {
      subtotal += item.itemTotal || (item.price * item.quantity);
      if (item.storeId && item.storeId !== "admin") {
        storeIds.add(item.storeId);
      }
    });

    let deliveryCharge = 0;

    if (orderType === "delivery" && deliveryAddress && deliveryAddress.latitude !== undefined && deliveryAddress.longitude !== undefined) {
      const userLat = parseFloat(deliveryAddress.latitude);
      const userLng = parseFloat(deliveryAddress.longitude);
      
      const settings = await Setting.find({ key: { $in: ["baseDeliveryFee", "feePerKm", "multiStoreExtraFee", "freeDeliveryThreshold"] } }).lean();
      
      let baseFee = 1500;
      let feePerKm = 100;
      let multiStoreExtraFee = 0;
      let freeThreshold: number | undefined;

      settings.forEach((s: any) => {
        if (s.key === "baseDeliveryFee") baseFee = s.payload;
        if (s.key === "feePerKm") feePerKm = s.payload;
        if (s.key === "multiStoreExtraFee") multiStoreExtraFee = s.payload;
        if (s.key === "freeDeliveryThreshold") freeThreshold = s.payload;
      });

      if (freeThreshold !== undefined && subtotal >= freeThreshold) {
        deliveryCharge = 0;
      } else {
        if (storeIds.size > 0) {
          const stores = await Store.find({ _id: { $in: Array.from(storeIds) } }).lean();
          
          let maxDistance = 0;
          let validStoresCount = 0;
          let outOfRangeStoreIds: string[] = [];
          let outOfRangeStoreNames: string[] = [];
          
          stores.forEach((store: any) => {
            if (store.latitude !== undefined && store.longitude !== undefined) {
              const dist = haversineDistance(userLat, userLng, store.latitude, store.longitude);
              if (dist > (store.deliveryRadius || 5)) {
                outOfRangeStoreIds.push(store._id.toString());
                outOfRangeStoreNames.push(store.name);
              } else {
                if (dist > maxDistance) maxDistance = dist;
                validStoresCount++;
              }
            }
          });

          if (outOfRangeStoreIds.length > 0) {
            return NextResponse.json({ 
              status: false, 
              message: "Your address is out of delivery range for one or more items.", 
              outOfRangeStoreIds,
              outOfRangeStoreNames
            }, { status: 400 });
          }

          deliveryCharge = baseFee + (maxDistance * feePerKm);
          
          if (validStoresCount > 1) {
            deliveryCharge += (validStoresCount - 1) * multiStoreExtraFee;
          }
        } else {
          deliveryCharge = baseFee; // Default if only admin items
        }
      }
    }

    return NextResponse.json({ 
      status: true, 
      data: {
        subtotal,
        deliveryCharge: Math.round(deliveryCharge * 100) / 100
      }
    });

  } catch (error: any) {
    console.error("Calculate API Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
