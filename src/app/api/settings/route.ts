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

    return NextResponse.json({ success: true, data: settings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Expects an array of settings: [{ key: 'company_name', group: 'Company', payload: 'FoodAppi' }]
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

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
