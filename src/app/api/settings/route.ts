import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Setting from '@/models/Setting';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');

    const query = group ? { group } : {};
    const settings = await Setting.find(query).lean();

    return NextResponse.json({ success: true, data: settings }, { 
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60",
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Expects an array of settings: [{ key: 'company_name', group: 'Company', payload: 'Nectar' }]
    const { settings } = body;

    if (!Array.isArray(settings)) {
      return NextResponse.json({ success: false, message: 'Settings must be an array' }, { status: 400 });
    }

    const bulkOps = settings.map((setting) => ({
      updateOne: {
        filter: { key: setting.key },
        update: { 
          $set: { 
            group: setting.group, 
            payload: setting.payload 
          } 
        },
        upsert: true,
      },
    }));

    const result = await Setting.bulkWrite(bulkOps);

    // Sync to PaymentGateway collection if Paystack keys were updated
    const paystackPublic = settings.find((s: any) => s.key === "pay_paystack_public");
    const paystackSecret = settings.find((s: any) => s.key === "pay_paystack_secret");
    const paystackEnabled = settings.find((s: any) => s.key === "pay_paystack_enabled");

    if (paystackPublic || paystackSecret || paystackEnabled) {
      try {
        const PaymentGateway = (await import("@/models/PaymentGateway")).default;
        const gateway = await PaymentGateway.findOne({ slug: "paystack" });
        const existingOptions = Array.isArray(gateway?.options) ? [...gateway.options] : [];

        if (paystackPublic && paystackPublic.payload) {
          const idx = existingOptions.findIndex((o: any) => o.option === "paystack_public_key");
          if (idx >= 0) existingOptions[idx].value = paystackPublic.payload;
          else existingOptions.push({ option: "paystack_public_key", value: paystackPublic.payload });
        }
        if (paystackSecret && paystackSecret.payload) {
          const idx = existingOptions.findIndex((o: any) => o.option === "paystack_secret_key");
          if (idx >= 0) existingOptions[idx].value = paystackSecret.payload;
          else existingOptions.push({ option: "paystack_secret_key", value: paystackSecret.payload });
        }

        await PaymentGateway.findOneAndUpdate(
          { slug: "paystack" },
          {
            $set: {
              name: "Paystack",
              slug: "paystack",
              status: paystackEnabled ? (paystackEnabled.payload === "Yes" ? "active" : "inactive") : gateway?.status || "active",
              options: existingOptions,
            },
          },
          { upsert: true }
        );
      } catch (gwErr) {
        console.warn("PaymentGateway sync notice:", gwErr);
      }
    }

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
