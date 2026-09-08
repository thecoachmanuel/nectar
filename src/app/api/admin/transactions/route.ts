import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "errandshop_secret_key_default_2026"
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const storeIdParam = searchParams.get("storeId");
    const paymentMethodParam = searchParams.get("paymentMethod");
    const paymentStatusParam = searchParams.get("paymentStatus");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const search = searchParams.get("search");

    const query: any = {};

    // Auth & Store scoping
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === "store_manager" && payload.storeId) {
          query.storeId = payload.storeId;
        }
      } catch (authErr) {
        console.warn("[Admin Transactions Auth]", authErr);
      }
    }

    if (storeIdParam && storeIdParam !== "all" && !query.storeId) {
      query.storeId = storeIdParam;
    }

    if (paymentStatusParam && paymentStatusParam !== "all") {
      query.paymentStatus = paymentStatusParam;
    }

    if (paymentMethodParam && paymentMethodParam !== "all") {
      query.$or = [
        { paymentMethod: paymentMethodParam },
        { posPaymentMethod: paymentMethodParam },
      ];
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(`${fromDate}T00:00:00.000Z`);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(`${toDate}T23:59:59.999Z`);
      }
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { orderSerialNo: regex },
        { paymentReference: regex },
        { customerName: regex },
        { customerPhone: regex },
        { customerEmail: regex },
      ];
    }

    const rawOrders = await Order.find(query).sort({ createdAt: -1 }).lean();

    let totalVolume = 0;
    let paidCount = 0;
    let pendingCount = 0;

    const formattedTransactions = rawOrders.map((order: any) => {
      // Calculate exact amount with fallback to subtotal/components/item sums
      let exactAmount = 0;
      if (typeof order.totalAmount === "number" && !isNaN(order.totalAmount) && order.totalAmount > 0) {
        exactAmount = order.totalAmount;
      } else if (order.totalAmount && !isNaN(Number(order.totalAmount)) && Number(order.totalAmount) > 0) {
        exactAmount = Number(order.totalAmount);
      } else if (typeof order.total === "number" && !isNaN(order.total) && order.total > 0) {
        exactAmount = order.total;
      } else if (order.posReceivedAmount && Number(order.posReceivedAmount) > 0) {
        exactAmount = Number(order.posReceivedAmount);
      } else {
        const subtotal = Number(order.subtotal) || 0;
        const delivery = Number(order.deliveryCharge) || 0;
        const tax = Number(order.taxAmount) || 0;
        const discount = Number(order.discountAmount || order.discount || order.couponDiscount) || 0;
        const computed = subtotal + delivery + tax - discount;
        if (computed > 0) {
          exactAmount = computed;
        } else if (Array.isArray(order.items) && order.items.length > 0) {
          const itemsSum = order.items.reduce((acc: number, it: any) => {
            const price = Number(it.price) || 0;
            const qty = Number(it.quantity) || 1;
            return acc + (Number(it.itemTotal) || (price * qty));
          }, 0);
          exactAmount = itemsSum + delivery + tax - discount;
        }
      }

      const isPaid = order.paymentStatus === "paid";
      if (isPaid) {
        totalVolume += exactAmount;
        paidCount++;
      } else {
        pendingCount++;
      }

      const rawReference = order.paymentReference;
      const displayTxnId = rawReference && rawReference.trim() !== ""
        ? rawReference
        : order.isPos
        ? `POS-${order.orderSerialNo || order._id.toString().slice(-6).toUpperCase()}`
        : `TXN-${order._id.toString().slice(-8).toUpperCase()}`;

      return {
        _id: order._id.toString(),
        orderId: order._id.toString(),
        orderSerialNo: order.orderSerialNo || `#${order._id.toString().slice(-6).toUpperCase()}`,
        transactionId: displayTxnId,
        paymentReference: rawReference || "",
        amount: exactAmount,
        totalAmount: exactAmount,
        total: exactAmount,
        subtotal: Number(order.subtotal) || 0,
        deliveryCharge: Number(order.deliveryCharge) || 0,
        taxAmount: Number(order.taxAmount) || 0,
        discountAmount: Number(order.discountAmount || order.discount || order.couponDiscount) || 0,
        paymentMethod: order.paymentMethod || order.posPaymentMethod || (order.isPos ? "pos" : "cash_on_delivery"),
        posPaymentMethod: order.posPaymentMethod || "",
        paymentStatus: order.paymentStatus || "unpaid",
        orderStatus: order.orderStatus || "pending",
        customerName: order.customerName || "Customer",
        customerPhone: order.customerPhone || "N/A",
        customerEmail: order.customerEmail || "",
        isPos: !!order.isPos,
        createdAt: order.createdAt,
      };
    });

    return NextResponse.json({
      status: true,
      data: formattedTransactions,
      summary: {
        totalVolume,
        totalTransactions: formattedTransactions.length,
        paidCount,
        pendingCount,
      },
    });
  } catch (error: any) {
    console.error("Admin Transactions API Error:", error);
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
