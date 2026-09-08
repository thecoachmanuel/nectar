import connectToDatabase from "@/lib/db";
import Item from "@/models/Item";
import Order, { IOrder } from "@/models/Order";

/**
 * Deduct inventory for an order strictly when payment is confirmed (paymentStatus === "paid").
 * Uses an idempotent flag `inventoryDeducted` to prevent double-deduction.
 */
export async function deductOrderInventory(orderInput: string | IOrder | any) {
  try {
    await connectToDatabase();
    let order: any = orderInput;

    if (typeof orderInput === "string") {
      order = await Order.findById(orderInput);
    } else if (!order.items || !order.save) {
      order = await Order.findById(order._id);
    }

    if (!order) {
      console.warn("deductOrderInventory: Order not found");
      return { success: false, message: "Order not found" };
    }

    if (order.inventoryDeducted) {
      return { success: true, alreadyDeducted: true };
    }

    if (!Array.isArray(order.items) || order.items.length === 0) {
      order.inventoryDeducted = true;
      await order.save();
      return { success: true, deducted: false };
    }

    for (const orderItem of order.items) {
      if (!orderItem.itemId) continue;

      const itemDoc = await Item.findById(orderItem.itemId);
      if (itemDoc && itemDoc.manageStock) {
        const qtyToDeduct = Number(orderItem.quantity) || 1;
        const currentQty = Number(itemDoc.stockQuantity) || 0;
        const newQty = Math.max(0, currentQty - qtyToDeduct);

        itemDoc.stockQuantity = newQty;
        if (newQty === 0) {
          itemDoc.isOutOfStock = true;
        }

        await itemDoc.save();
        console.log(`📉 Stock auto-deducted for "${itemDoc.name}": ${currentQty} -> ${newQty} (Order #${order.orderSerialNo})`);
      }
    }

    order.inventoryDeducted = true;
    await order.save();
    return { success: true, deducted: true };
  } catch (error: any) {
    console.error("deductOrderInventory error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Restore inventory if an order was previously paid and is now canceled or marked unpaid.
 */
export async function restoreOrderInventory(orderInput: string | IOrder | any) {
  try {
    await connectToDatabase();
    let order: any = orderInput;

    if (typeof orderInput === "string") {
      order = await Order.findById(orderInput);
    } else if (!order.items || !order.save) {
      order = await Order.findById(order._id);
    }

    if (!order) return { success: false, message: "Order not found" };

    if (!order.inventoryDeducted) {
      return { success: true, notDeducted: true };
    }

    if (Array.isArray(order.items)) {
      for (const orderItem of order.items) {
        if (!orderItem.itemId) continue;

        const itemDoc = await Item.findById(orderItem.itemId);
        if (itemDoc && itemDoc.manageStock) {
          const qtyToRestore = Number(orderItem.quantity) || 1;
          const currentQty = Number(itemDoc.stockQuantity) || 0;
          const newQty = currentQty + qtyToRestore;

          itemDoc.stockQuantity = newQty;
          if (newQty > 0) {
            itemDoc.isOutOfStock = false;
          }

          await itemDoc.save();
          console.log(`📈 Stock restored for "${itemDoc.name}": ${currentQty} -> ${newQty} (Order #${order.orderSerialNo})`);
        }
      }
    }

    order.inventoryDeducted = false;
    await order.save();
    return { success: true, restored: true };
  } catch (error: any) {
    console.error("restoreOrderInventory error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Check whether all items in a cart/order have sufficient stock.
 */
export async function checkStockAvailability(items: { itemId: string; quantity: number; name?: string }[]) {
  try {
    await connectToDatabase();
    if (!Array.isArray(items) || items.length === 0) {
      return { available: true };
    }

    // Aggregate requested quantity by itemId across cart lines (e.g. multiple variations)
    const aggregatedQuantities: Record<string, { totalQty: number; name?: string }> = {};
    for (const itm of items) {
      if (!itm.itemId) continue;
      const idStr = String(itm.itemId);
      const qty = Math.max(1, Number(itm.quantity) || 1);
      if (!aggregatedQuantities[idStr]) {
        aggregatedQuantities[idStr] = { totalQty: qty, name: itm.name };
      } else {
        aggregatedQuantities[idStr].totalQty += qty;
        if (!aggregatedQuantities[idStr].name && itm.name) {
          aggregatedQuantities[idStr].name = itm.name;
        }
      }
    }

    for (const [itemId, info] of Object.entries(aggregatedQuantities)) {
      const itemDoc = await Item.findById(itemId).lean();
      if (itemDoc && itemDoc.manageStock) {
        const availableStock = Math.max(0, Number(itemDoc.stockQuantity) || 0);
        const itemName = itemDoc.name || info.name || "Product";

        if (itemDoc.isOutOfStock || availableStock <= 0) {
          return {
            available: false,
            message: `"${itemName}" is currently out of stock.`,
            itemName,
            availableStock: 0,
            requested: info.totalQty,
          };
        }

        if (availableStock < info.totalQty) {
          return {
            available: false,
            message: `Only ${availableStock} unit(s) of "${itemName}" available in stock (you requested ${info.totalQty}).`,
            itemName,
            availableStock,
            requested: info.totalQty,
          };
        }
      }
    }
    return { available: true };
  } catch (err: any) {
    console.error("checkStockAvailability error:", err);
    return { available: true }; // non-blocking fallback
  }
}
