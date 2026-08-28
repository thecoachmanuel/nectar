import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Parse query params for filtering by role
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    
    const query: any = role ? { role } : {};
    
    // In a real app we'd paginate here
    const users = await User.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ status: true, data: users });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { status: false, message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password if provided
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    }

    const user = await User.create(body);

    return NextResponse.json(
      { status: true, message: "User created successfully", data: user },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
