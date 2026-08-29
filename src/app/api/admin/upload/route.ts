import { NextResponse } from "next/server";
import { getGridFSBucket } from "@/lib/gridfs";
import { Readable } from "stream";
import connectToDatabase from "@/lib/db";

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not supported. Use JPG, PNG, WebP or GIF." }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }

    const bucket = await getGridFSBucket();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

    const fileId: string = await new Promise((resolve, reject) => {
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);

      const uploadStream = bucket.openUploadStream(safeName, {
        metadata: {
          contentType: file.type,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      readable.pipe(uploadStream);

      uploadStream.on("finish", () => {
        resolve(uploadStream.id.toString());
      });
      uploadStream.on("error", reject);
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (() => {
        const reqUrl = new URL(req.url);
        return `${reqUrl.protocol}//${reqUrl.host}`;
      })();
    const url = `${baseUrl}/api/files/${fileId}`;

    return NextResponse.json({ url, fileId });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
  }
}
