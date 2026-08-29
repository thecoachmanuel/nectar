import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Item from "@/models/Item";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ status: false, message: "Invalid items array." }, { status: 400 });
    }

    const updatedItems = await Promise.all(
      items.map(async (cartItem: any) => {
        const dbItem = await Item.findById(cartItem.itemId).lean();
        
        // If the item doesn't exist anymore, we could mark it as unavailable, 
        // but for now we'll just return it as is or handle it on the frontend.
        if (!dbItem) return cartItem;

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

        // Addons
        let newAddons = cartItem.addons;
        if (cartItem.addons && cartItem.addons.length > 0) {
          // If we want to strictly sync addon prices we need to query them. 
          // For now, we will trust the addons base price unless we fetch the ItemCategory addons. 
          // (Since addons are usually separate models or embedded). 
          // The main concern was the core product price changing.
        }

        const extraTotal = newExtras.reduce((acc: number, e: any) => acc + (e.price || 0), 0);
        const addonTotal = newAddons.reduce((acc: number, a: any) => acc + (a.price || 0), 0);
        
        const unitPrice = newBasePrice + extraTotal + addonTotal;

        return {
          ...cartItem,
          price: newBasePrice,
          extras: newExtras,
          addons: newAddons,
          itemTotal: unitPrice * cartItem.quantity
        };
      })
    );

    return NextResponse.json({
      status: true,
      data: updatedItems
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
