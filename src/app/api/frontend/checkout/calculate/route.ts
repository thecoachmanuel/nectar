import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Store from "@/models/Store";
import Setting from "@/models/Setting";
import Coupon from "@/models/Coupon";

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
    const { items, deliveryAddress, orderType, couponCode } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ status: false, message: "Cart is empty" }, { status: 400 });
    }

    let subtotal = 0;
    const storeIds = new Set<string>();

    items.forEach((item: any) => {
      subtotal += item.itemTotal || (item.price * item.quantity);
      if (item.storeId && item.storeId !== "admin" && item.storeId !== "0") {
        storeIds.add(item.storeId);
      }
    });

    let deliveryCharge = 0;

    if (orderType === "delivery" && deliveryAddress && deliveryAddress.latitude !== undefined && deliveryAddress.longitude !== undefined) {
      const userLat = parseFloat(deliveryAddress.latitude);
      const userLng = parseFloat(deliveryAddress.longitude);
      
      const settings = await Setting.find({ key: { $in: ["baseDeliveryFee", "feePerKm", "multiStoreExtraFee", "freeDeliveryThreshold", "company_latitude", "company_longitude"] } }).lean();
      
      let baseFee = 1500;
      let feePerKm = 100;
      let multiStoreExtraFee = 0;
      let freeThreshold: number | undefined;
      let adminLat: number | undefined;
      let adminLng: number | undefined;

      settings.forEach((s: any) => {
        if (s.key === "baseDeliveryFee") baseFee = parseFloat(s.payload) || 1500;
        if (s.key === "feePerKm") feePerKm = parseFloat(s.payload) || 100;
        if (s.key === "multiStoreExtraFee") multiStoreExtraFee = parseFloat(s.payload) || 0;
        if (s.key === "freeDeliveryThreshold") freeThreshold = parseFloat(s.payload) || undefined;
        if (s.key === "company_latitude" && s.payload) adminLat = parseFloat(s.payload);
        if (s.key === "company_longitude" && s.payload) adminLng = parseFloat(s.payload);
      });

      if (freeThreshold !== undefined && subtotal >= freeThreshold) {
        deliveryCharge = 0;
      } else {
        let maxDistance = 0;
        let validStoresCount = 0;
        let outOfRangeStoreIds: string[] = [];
        let outOfRangeStoreNames: string[] = [];
        
        let hasAdminItems = false;
        items.forEach((item: any) => {
          if (!item.storeId || item.storeId === "admin" || item.storeId === "0") {
            hasAdminItems = true;
          }
        });

        if (storeIds.size > 0) {
          const stores = await Store.find({ _id: { $in: Array.from(storeIds) } }).lean();
          
          stores.forEach((store: any) => {
            if (store.latitude !== undefined && store.longitude !== undefined) {
              const dist = haversineDistance(userLat, userLng, store.latitude, store.longitude);
              if (!isNaN(dist)) {
                if (dist > (store.deliveryRadius || 5)) {
                  outOfRangeStoreIds.push(store._id.toString());
                  outOfRangeStoreNames.push(store.name);
                } else {
                  if (dist > maxDistance) maxDistance = dist;
                  validStoresCount++;
                }
              }
            }
          });
        }

        if (hasAdminItems) {
          if (adminLat !== undefined && adminLng !== undefined && !isNaN(adminLat) && !isNaN(adminLng)) {
            const dist = haversineDistance(userLat, userLng, adminLat, adminLng);
            if (!isNaN(dist)) {
              if (dist > maxDistance) maxDistance = dist;
              validStoresCount++;
            }
          } else {
            // Admin doesn't have coordinates set, assume 0 extra distance but it counts as a store location
            validStoresCount++;
          }
        }

        if (outOfRangeStoreIds.length > 0) {
          return NextResponse.json({ 
            status: false, 
            message: "Your address is out of delivery range for one or more items.", 
            outOfRangeStoreIds,
            outOfRangeStoreNames
          }, { status: 400 });
        }

        if (validStoresCount > 0) {
          deliveryCharge = baseFee + (maxDistance * feePerKm);
          if (validStoresCount > 1) {
            deliveryCharge += (validStoresCount - 1) * multiStoreExtraFee;
          }
        } else {
          deliveryCharge = baseFee; // Fallback
        }
      }
    }

    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), status: true });
      
      if (!coupon) {
        return NextResponse.json({ status: false, message: "Invalid or inactive coupon code" }, { status: 400 });
      }

      const now = new Date();
      if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
        return NextResponse.json({ status: false, message: "Coupon has expired or is not yet active" }, { status: 400 });
      }

      if (coupon.usedCount >= coupon.totalLimit) {
        return NextResponse.json({ status: false, message: "Coupon usage limit reached" }, { status: 400 });
      }

      if (subtotal < coupon.minimumOrderAmount) {
        return NextResponse.json({ status: false, message: `Minimum order amount for this coupon is ₦${coupon.minimumOrderAmount}` }, { status: 400 });
      }

      if (coupon.discountType === "percentage") {
        discountAmount = (subtotal * coupon.discount) / 100;
        if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
          discountAmount = coupon.maximumDiscount;
        }
      } else {
        discountAmount = coupon.discount;
      }
      
      appliedCoupon = couponCode.toUpperCase();
    }

    return NextResponse.json({ 
      status: true, 
      data: {
        subtotal,
        deliveryCharge: Math.round(deliveryCharge * 100) / 100,
        discountAmount,
        couponCode: appliedCoupon
      }
    });

  } catch (error: any) {
    console.error("Calculate API Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
