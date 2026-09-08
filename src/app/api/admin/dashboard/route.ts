import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import Item from "@/models/Item";
import Setting from "@/models/Setting";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "errandshop_secret_key_default_2026"
);

export async function GET() {
  try {
    await connectToDatabase();
    
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    let storeIdFilter: any = {};
    let isStoreManager = false;

    if (token) {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role === "store_manager" && payload.storeId) {
        storeIdFilter = { storeId: payload.storeId };
        isStoreManager = true;
      }
    }

    const ItemCategory = (await import("@/models/ItemCategory")).default;

    const [
      totalOrders,
      totalCustomers,
      totalItems,
      orders,
      topCustomersData,
      adminPhoneSetting,
      rawFeaturedItems,
      rawPopularItems,
      rawCategories
    ] = await Promise.all([
      Order.countDocuments(storeIdFilter),
      User.countDocuments({ role: "customer" }),
      Item.countDocuments(storeIdFilter),
      Order.find(storeIdFilter),
      Order.aggregate([
        { $match: storeIdFilter },
        { $group: { _id: "$customerEmail", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Setting.findOne({
        key: { $in: ["admin_notification_whatsapp_number", "wa_admin_notification_phone", "company_phone"] }
      }).lean(),
      Item.find({ ...storeIdFilter, isFeatured: true, status: true })
        .populate("categoryId", "name slug")
        .limit(6)
        .lean(),
      Item.find({ ...storeIdFilter, status: true })
        .populate("categoryId", "name slug")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      ItemCategory.find({ status: true })
        .sort({ sortOrder: 1, createdAt: -1 })
        .limit(8)
        .lean()
    ]);

    const { normalizeImageUrl } = await import("@/lib/imageUtils");

    const featuredItems = (rawFeaturedItems || []).map((item: any) => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      discountPrice: item.discountPrice,
      image: normalizeImageUrl(item.image, "/images/item/thumb.png"),
      categoryName: item.categoryId?.name || "Groceries",
      manageStock: item.manageStock,
      stockQuantity: item.stockQuantity,
      isOutOfStock: item.isOutOfStock,
    }));

    const popularItems = (rawPopularItems || []).map((item: any) => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      discountPrice: item.discountPrice,
      image: normalizeImageUrl(item.image, "/images/item/thumb.png"),
      categoryName: item.categoryId?.name || "Groceries",
      manageStock: item.manageStock,
      stockQuantity: item.stockQuantity,
      isOutOfStock: item.isOutOfStock,
    }));

    const topCategories = (rawCategories || []).map((cat: any) => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      image: normalizeImageUrl(cat.image, "/images/category/thumb.png"),
    }));

    const totalSales = orders.reduce((sum, order: any) => sum + (order.totalAmount || 0), 0);
    const totalCommission = orders.reduce((sum, order: any) => sum + (order.commissionAmount || 0), 0);
    const totalDeliveryCharges = orders.reduce((sum, order: any) => sum + (order.deliveryCharge || 0), 0);
    const storeManagerEarnings = totalSales - totalCommission - totalDeliveryCharges;

    const orderStats = {
      pending: orders.filter(o => (o as any).orderStatus === "pending").length,
      accept: orders.filter(o => (o as any).orderStatus === "accepted").length,
      preparing: orders.filter(o => (o as any).orderStatus === "preparing").length,
      ready: orders.filter(o => (o as any).orderStatus === "ready").length,
      out_for_delivery: orders.filter(o => (o as any).orderStatus === "out_for_delivery").length,
      delivered: orders.filter(o => (o as any).orderStatus === "delivered").length,
      canceled: orders.filter(o => (o as any).orderStatus === "canceled").length,
      returned: orders.filter(o => (o as any).orderStatus === "returned").length,
      rejected: orders.filter(o => (o as any).orderStatus === "rejected").length,
    };

    return NextResponse.json({
      status: true,
      data: {
        totalOrders,
        totalSales,
        totalCommission,
        totalDeliveryCharges,
        storeManagerEarnings,
        totalCustomers,
        totalItems,
        orderStats,
        topCustomersData,
        featuredItems,
        popularItems,
        topCategories,
        adminNotificationWhatsApp: adminPhoneSetting?.payload ? String(adminPhoneSetting.payload).trim() : null
      }
    });

  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
