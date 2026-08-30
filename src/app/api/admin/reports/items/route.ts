import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import Item from "@/models/Item";
import Store from "@/models/Store";
import ItemCategory from "@/models/ItemCategory";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();

    // 1. Fetch all non-canceled orders
    const orders = await Order.find({
      orderStatus: { $nin: ["canceled", "rejected"] },
    });

    const itemSales: Record<string, { quantitySold: number; revenue: number; name: string }> = {};

    // Aggregate sold items from all valid orders
    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const key = String(item.itemId || item._id || item.name);
          if (!itemSales[key]) {
            itemSales[key] = {
              name: item.name,
              quantitySold: 0,
              revenue: 0,
            };
          }
          const qty = Number(item.quantity) || 1;
          const total = Number(item.itemTotal) || (Number(item.price) || 0) * qty;
          itemSales[key].quantitySold += qty;
          itemSales[key].revenue += total;
        });
      }
    });

    // 2. Fetch all catalog items with categories and stores
    const catalogItems = await Item.find()
      .populate("categoryId", "name")
      .populate("storeId", "name");

    const categories = await ItemCategory.find({ status: true }).select("name");

    const reportMap = new Map<string, any>();

    // Seed report with all catalog items
    catalogItems.forEach((catItem: any) => {
      const idStr = String(catItem._id);
      const sales = itemSales[idStr] || itemSales[catItem.name] || { quantitySold: 0, revenue: 0 };
      
      const categoryName = catItem.categoryId?.name || "Uncategorized";
      const storeName = catItem.storeId?.name || (String(catItem.storeId) === "0" ? "Main Store" : "Global");

      reportMap.set(idStr, {
        id: idStr,
        name: catItem.name,
        category: categoryName,
        store: storeName,
        price: Number(catItem.price) || 0,
        quantitySold: sales.quantitySold,
        revenue: sales.revenue,
      });
    });

    // Also include any items sold in orders that might not be in the catalog list
    for (const [key, sales] of Object.entries(itemSales)) {
      if (!reportMap.has(key)) {
        reportMap.set(key, {
          id: key,
          name: sales.name,
          category: "General",
          store: "Main Store",
          price: sales.quantitySold > 0 ? Math.round(sales.revenue / sales.quantitySold) : 0,
          quantitySold: sales.quantitySold,
          revenue: sales.revenue,
        });
      }
    }

    const reportData = Array.from(reportMap.values());

    // Sort by quantity sold descending, then by revenue descending
    reportData.sort((a, b) => b.quantitySold - a.quantitySold || b.revenue - a.revenue);

    return NextResponse.json({
      status: true,
      data: reportData,
      categories: categories.map((c) => c.name),
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
