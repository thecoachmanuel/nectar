import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Item from "@/models/Item";
import Store from "@/models/Store";
import ItemCategory from "@/models/ItemCategory";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "errandshop_secret_key_default_2026"
);

async function getAuthUser(req: Request) {
  const cookieStore = await cookies();
  let token = cookieStore.get("token")?.value;
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect();

    const user: any = await getAuthUser(req);
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const storeParam = searchParams.get("storeId") || "all";
    const statusParam = searchParams.get("status") || "all";
    const categoryParam = searchParams.get("categoryId") || "all";

    let storeFilter: any = {};

    // Scoping by role
    if (user?.role === "store_manager" && user?.storeId) {
      storeFilter = { storeId: user.storeId };
    } else if (storeParam !== "all") {
      if (storeParam === "unassigned") {
        storeFilter = {
          $or: [
            { storeId: "0" },
            { storeId: 0 },
            { storeId: "admin" },
            { storeId: null },
            { storeId: { $exists: false } }
          ]
        };
      } else {
        storeFilter = { storeId: storeParam };
      }
    }

    // Query items
    const rawItems = await Item.find(storeFilter)
      .populate("categoryId", "name slug")
      .sort({ updatedAt: -1 })
      .lean();

    // Map store names
    const allStores = await Store.find({}).select("_id name").lean();
    const storeMap = new Map(allStores.map((s: any) => [s._id.toString(), s.name]));

    let totalProducts = rawItems.length;
    let trackedProducts = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const mappedItems = rawItems.map((item: any) => {
      const rawStoreId = item.storeId ? item.storeId.toString() : "0";
      const isUnassigned = !rawStoreId || rawStoreId === "0" || rawStoreId === "admin" || rawStoreId === "null";
      const storeName = isUnassigned ? "Unassigned (All Stores)" : (storeMap.get(rawStoreId) || "Store");

      const manageStock = Boolean(item.manageStock);
      const stockQuantity = Number(item.stockQuantity) || 0;
      const threshold = Number(item.lowStockThreshold) || 5;
      const isOutOfStock = Boolean(item.isOutOfStock) || (manageStock && stockQuantity <= 0);

      if (manageStock) {
        trackedProducts++;
        if (isOutOfStock) {
          outOfStockCount++;
        } else if (stockQuantity <= threshold) {
          lowStockCount++;
        } else {
          inStockCount++;
        }
      }

      let stockStatus: "in_stock" | "low_stock" | "out_of_stock" | "untracked" = "untracked";
      if (manageStock) {
        if (isOutOfStock) stockStatus = "out_of_stock";
        else if (stockQuantity <= threshold) stockStatus = "low_stock";
        else stockStatus = "in_stock";
      }

      return {
        ...item,
        storeName,
        isUnassignedStore: isUnassigned,
        storeIdStr: isUnassigned ? "0" : rawStoreId,
        stockStatus,
        effectiveOutOfStock: isOutOfStock,
        stockQuantity,
        lowStockThreshold: threshold,
        manageStock
      };
    });

    // Filter by search, category, and status in memory
    const filtered = mappedItems.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const nameMatch = (item.name || "").toLowerCase().includes(q);
        const catMatch = (item.categoryId?.name || "").toLowerCase().includes(q);
        const storeMatch = (item.storeName || "").toLowerCase().includes(q);
        if (!nameMatch && !catMatch && !storeMatch) return false;
      }

      if (categoryParam !== "all") {
        const catId = (item.categoryId?._id || item.categoryId)?.toString();
        if (catId !== categoryParam) return false;
      }

      if (statusParam !== "all") {
        if (statusParam === "in_stock" && item.stockStatus !== "in_stock") return false;
        if (statusParam === "low_stock" && item.stockStatus !== "low_stock") return false;
        if (statusParam === "out_of_stock" && item.stockStatus !== "out_of_stock") return false;
        if (statusParam === "untracked" && item.stockStatus !== "untracked") return false;
      }

      return true;
    });

    return NextResponse.json({
      status: true,
      data: filtered,
      metrics: {
        totalProducts,
        trackedProducts,
        inStockCount,
        lowStockCount,
        outOfStockCount
      }
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await dbConnect();
    const user: any = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, stockQuantity, manageStock, lowStockThreshold, isOutOfStock } = body;

    if (!itemId) {
      return NextResponse.json({ status: false, message: "itemId is required" }, { status: 400 });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return NextResponse.json({ status: false, message: "Product not found" }, { status: 404 });
    }

    // Role verification for store manager
    if (user.role === "store_manager" && user.storeId && item.storeId) {
      if (item.storeId.toString() !== user.storeId.toString()) {
        return NextResponse.json({ status: false, message: "Access denied to this store's inventory" }, { status: 403 });
      }
    }

    if (manageStock !== undefined) {
      item.manageStock = Boolean(manageStock);
    }
    if (stockQuantity !== undefined) {
      const qty = Math.max(0, parseInt(stockQuantity) || 0);
      item.stockQuantity = qty;
      if (item.manageStock && qty === 0) {
        item.isOutOfStock = true;
      } else if (item.manageStock && qty > 0 && isOutOfStock === undefined) {
        item.isOutOfStock = false;
      }
    }
    if (lowStockThreshold !== undefined) {
      item.lowStockThreshold = Math.max(1, parseInt(lowStockThreshold) || 5);
    }
    if (isOutOfStock !== undefined) {
      item.isOutOfStock = Boolean(isOutOfStock);
    }

    await item.save();

    return NextResponse.json({
      status: true,
      message: `Inventory for "${item.name}" updated successfully`,
      data: item
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
