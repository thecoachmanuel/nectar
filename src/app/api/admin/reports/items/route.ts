import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import Item from "@/models/Item";
import Store from "@/models/Store";
import ItemCategory from "@/models/ItemCategory";

export async function GET() {
  try {
    await dbConnect();

    // Find all completed/delivered orders
    const orders = await Order.find({ orderStatus: "delivered" });

    const itemStats: Record<string, any> = {};

    // Aggregate sold items
    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (!itemStats[item.itemId]) {
            itemStats[item.itemId] = {
              id: item.itemId,
              name: item.name,
              quantitySold: 0,
              revenue: 0,
            };
          }
          itemStats[item.itemId].quantitySold += item.quantity || 1;
          itemStats[item.itemId].revenue += item.itemTotal || (item.price * (item.quantity || 1));
        });
      }
    });

    const reportData = [];

    // For each aggregated item, fetch its category and store from the Item collection
    for (const itemId of Object.keys(itemStats)) {
      const stat = itemStats[itemId];
      let categoryName = "-";
      let storeName = "-";

      try {
        const itemRecord = await Item.findById(itemId).populate("categoryId").populate("storeId");
        if (itemRecord) {
          if (itemRecord.categoryId && typeof itemRecord.categoryId === 'object') {
             // populate doesn't always guarantee an object if ref is broken, so we check
             categoryName = (itemRecord.categoryId as any).name || "-";
          } else if (itemRecord.categoryId) {
             const cat = await ItemCategory.findById(itemRecord.categoryId);
             if (cat) categoryName = cat.name;
          }

          if (itemRecord.storeId && typeof itemRecord.storeId === 'object' && String(itemRecord.storeId) !== "0") {
             storeName = (itemRecord.storeId as any).name || "-";
          } else if (String(itemRecord.storeId) === "0") {
             storeName = "Global";
          } else if (itemRecord.storeId) {
             const store = await Store.findById(itemRecord.storeId);
             if (store) storeName = store.name;
          }
        }
      } catch (e) {
        console.error("Error populating item", itemId, e);
      }

      reportData.push({
        ...stat,
        category: categoryName,
        store: storeName,
      });
    }

    // Sort by quantity sold descending
    reportData.sort((a, b) => b.quantitySold - a.quantitySold);

    return NextResponse.json({
      status: true,
      data: reportData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
