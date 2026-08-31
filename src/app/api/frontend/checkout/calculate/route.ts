import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Store from "@/models/Store";
import Setting from "@/models/Setting";
import Coupon from "@/models/Coupon";
import Order from "@/models/Order";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

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
    const { items, deliveryAddress, orderType, couponCode, customerPhone, customerEmail, userId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ status: false, message: "Cart is empty" }, { status: 400 });
    }

    // Resolve User Identity for coupon qualification
    let resolvedUserId = userId || null;
    let resolvedEmail = customerEmail || null;
    let resolvedPhone = customerPhone || null;

    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("token")?.value;
      if (token) {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.id) resolvedUserId = payload.id;
        if (payload.email) resolvedEmail = payload.email;
        if (payload.phone) resolvedPhone = payload.phone;
      }
    } catch {}

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
      
      const settings = await Setting.find({ key: { $in: [
        "baseDeliveryFee", 
        "feePerKm", 
        "multiStoreExtraFee", 
        "freeDeliveryThreshold", 
        "company_latitude", 
        "company_longitude",
        "orderValueFeePercent",
        "largeOrderThreshold",
        "largeOrderFeePercent"
      ] } }).lean();
      
      let baseFee = 1500;
      let feePerKm = 100;
      let multiStoreExtraFee = 0;
      let freeThreshold: number | undefined;
      let adminLat: number | undefined;
      let adminLng: number | undefined;
      let orderValueFeePercent = 2; // Default 2% handling based on order magnitude
      let largeOrderThreshold = 20000; // Default ₦20,000 threshold
      let largeOrderFeePercent = 3; // Default 3% extra for large bulk orders

      settings.forEach((s: any) => {
        if (s.key === "baseDeliveryFee") baseFee = parseFloat(s.payload) || 1500;
        if (s.key === "feePerKm") feePerKm = parseFloat(s.payload) || 100;
        if (s.key === "multiStoreExtraFee") multiStoreExtraFee = parseFloat(s.payload) || 0;
        if (s.key === "freeDeliveryThreshold") freeThreshold = parseFloat(s.payload) || undefined;
        if (s.key === "company_latitude" && s.payload) adminLat = parseFloat(s.payload);
        if (s.key === "company_longitude" && s.payload) adminLng = parseFloat(s.payload);
        if (s.key === "orderValueFeePercent") orderValueFeePercent = parseFloat(s.payload) ?? 2;
        if (s.key === "largeOrderThreshold") largeOrderThreshold = parseFloat(s.payload) ?? 20000;
        if (s.key === "largeOrderFeePercent") largeOrderFeePercent = parseFloat(s.payload) ?? 3;
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

        let rawDeliveryFee = baseFee;
        if (validStoresCount > 0) {
          rawDeliveryFee = baseFee + (maxDistance * feePerKm);
          if (validStoresCount > 1) {
            rawDeliveryFee += (validStoresCount - 1) * multiStoreExtraFee;
          }
        }

        // Auto-scale delivery fee based on order magnitude:
        // 1. Order Value Handling Fee (% of order subtotal)
        const orderValueFee = (subtotal * orderValueFeePercent) / 100;

        // 2. Large Order Surcharge (Applied when subtotal exceeds largeOrderThreshold)
        let largeOrderSurcharge = 0;
        if (largeOrderThreshold > 0 && subtotal >= largeOrderThreshold) {
          largeOrderSurcharge = (subtotal * largeOrderFeePercent) / 100;
        }

        deliveryCharge = rawDeliveryFee + orderValueFee + largeOrderSurcharge;
      }
    }

    let discountAmount = 0;
    let appliedCoupon = null;
    let isFreeDeliveryCoupon = false;

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
        return NextResponse.json({ status: false, message: `Minimum order subtotal for this coupon is ₦${coupon.minimumOrderAmount.toLocaleString()}` }, { status: 400 });
      }

      // ── Rule A: New Customers Only Check ──
      if (coupon.onlyForNewCustomers) {
        const userCriteria: any[] = [];
        if (resolvedUserId) userCriteria.push({ userId: resolvedUserId });
        if (resolvedEmail) userCriteria.push({ customerEmail: resolvedEmail });
        if (resolvedPhone) {
          const cleanPhone = String(resolvedPhone).replace(/\D/g, "");
          if (cleanPhone.length >= 7) {
            userCriteria.push({ customerPhone: new RegExp(cleanPhone.slice(-10)) });
          }
        }

        if (userCriteria.length > 0) {
          const priorOrders = await Order.countDocuments({ $or: userCriteria });
          if (priorOrders > 0) {
            return NextResponse.json({
              status: false,
              message: "This coupon is exclusively available to new customers on their first order."
            }, { status: 400 });
          }
        }
      }

      // ── Rule B: One-Time Use Per User / Usage Limit Per User Check ──
      const maxAllowedPerUser = coupon.oneTimePerUser ? 1 : (coupon.limitPerUser || 1);
      if (maxAllowedPerUser > 0) {
        const userIdentifiers: string[] = [];
        if (resolvedUserId) userIdentifiers.push(String(resolvedUserId));
        if (resolvedEmail) userIdentifiers.push(String(resolvedEmail).toLowerCase().trim());
        if (resolvedPhone) {
          const cleanPhone = String(resolvedPhone).replace(/\D/g, "");
          if (cleanPhone.length >= 7) userIdentifiers.push(cleanPhone.slice(-10));
        }

        // Check in coupon.usedBy array
        if (Array.isArray(coupon.usedBy) && coupon.usedBy.length > 0 && userIdentifiers.length > 0) {
          const usedCountByUser = coupon.usedBy.filter((u: string) =>
            userIdentifiers.some(id => u === id || u.includes(id) || id.includes(u))
          ).length;

          if (usedCountByUser >= maxAllowedPerUser) {
            return NextResponse.json({
              status: false,
              message: coupon.oneTimePerUser
                ? "You have already redeemed this one-time coupon."
                : `You have reached the maximum usage limit (${maxAllowedPerUser} times) for this coupon.`
            }, { status: 400 });
          }
        }

        // Also cross-verify in Order collection history
        if (userIdentifiers.length > 0) {
          const userCriteria: any[] = [];
          if (resolvedUserId) userCriteria.push({ userId: resolvedUserId });
          if (resolvedEmail) userCriteria.push({ customerEmail: resolvedEmail });
          if (resolvedPhone) {
            const cleanPhone = String(resolvedPhone).replace(/\D/g, "");
            if (cleanPhone.length >= 7) {
              userCriteria.push({ customerPhone: new RegExp(cleanPhone.slice(-10)) });
            }
          }

          if (userCriteria.length > 0) {
            const pastOrdersWithCoupon = await Order.countDocuments({
              couponCode: coupon.code,
              $or: userCriteria,
            });

            if (pastOrdersWithCoupon >= maxAllowedPerUser) {
              return NextResponse.json({
                status: false,
                message: coupon.oneTimePerUser
                  ? "You have already redeemed this one-time coupon."
                  : `You have reached the maximum usage limit (${maxAllowedPerUser} times) for this coupon.`
              }, { status: 400 });
            }
          }
        }
      }

      // ── Rule C: Discount Calculation ──
      if (coupon.discountType === "free_delivery") {
        isFreeDeliveryCoupon = true;
        discountAmount = 0;
        deliveryCharge = 0; // 100% Free delivery applied
      } else if (coupon.discountType === "percentage") {
        discountAmount = (subtotal * coupon.discount) / 100;
        if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
          discountAmount = coupon.maximumDiscount;
        }
      } else {
        discountAmount = coupon.discount;
        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }
      }
      
      appliedCoupon = coupon.code;
    }

    return NextResponse.json({ 
      status: true, 
      data: {
        subtotal,
        deliveryCharge: Math.round(deliveryCharge * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        couponCode: appliedCoupon,
        isFreeDelivery: isFreeDeliveryCoupon
      }
    });

  } catch (error: any) {
    console.error("Calculate API Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
