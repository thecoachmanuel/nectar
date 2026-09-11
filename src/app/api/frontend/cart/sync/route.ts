import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Item from "@/models/Item";
import Setting from "@/models/Setting";
import { MARKET_ORDER_MIN_DEFAULT } from "@/store/useSettingsStore";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ status: false, message: "Invalid items array." }, { status: 400 });
    }

    // Load the admin-configured minimum order amount (with ₦20,000 fallback)
    let minimumOrderAmount = MARKET_ORDER_MIN_DEFAULT;
    try {
      const minSetting = await Setting.findOne({ key: "market_order_min_amount" }).lean() as any;
      const val = Number(minSetting?.payload);
      if (val && val > 0) minimumOrderAmount = val;
    } catch {}

    // Track whether any item in this cart requires the minimum order rule
    let hasMinimumOrderRule = false;

    const updatedItems = await Promise.all(
      items.map(async (cartItem: any) => {
        const dbItem = await Item.findById(cartItem.itemId).lean() as any;

        // If the item doesn't exist anymore, return it as is
        if (!dbItem) return cartItem;

        // Check if this item triggers the minimum order rule (NEVER exposed to customer)
        if (dbItem.requiresMarketOrder === true) {
          hasMinimumOrderRule = true;
        }

        // Base price
        let newBasePrice = dbItem.price;

        // Variation price
        if (cartItem.variationName && dbItem.variations && Array.isArray(dbItem.variations)) {
          let matchedVar: any = undefined;
          for (const group of dbItem.variations) {
            if (group.options && Array.isArray(group.options)) {
              matchedVar = group.options.find((o: any) => o.name === cartItem.variationName);
              if (matchedVar) break;
            }
          }
          if (matchedVar) {
            newBasePrice = matchedVar.price;
          }
        }

        // Extras
        const newExtras = cartItem.extras.map((ex: any) => {
          if (dbItem.extras && Array.isArray(dbItem.extras)) {
            const matchedEx = dbItem.extras.find((e: any) => e.name === ex.name);
            if (matchedEx) return { ...ex, price: matchedEx.price };
          }
          return ex;
        });

        const newAddons = cartItem.addons;

        const extraTotal = newExtras.reduce((acc: number, e: any) => acc + (e.price || 0), 0);
        const addonTotal = newAddons.reduce((acc: number, a: any) => acc + (a.price || 0), 0);
        const unitPrice = newBasePrice + extraTotal + addonTotal;

        // PRIVACY: requiresMarketOrder is intentionally NOT included in the returned item object
        return {
          ...cartItem,
          price: newBasePrice,
          extras: newExtras,
          addons: newAddons,
          itemTotal: unitPrice * cartItem.quantity,
        };
      })
    );

    return NextResponse.json({
      status: true,
      data: updatedItems,
      // Top-level aggregate flags only — no per-item sourcing info exposed to customer
      hasMinimumOrderRule,
      minimumOrderAmount: hasMinimumOrderRule ? minimumOrderAmount : null,
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
