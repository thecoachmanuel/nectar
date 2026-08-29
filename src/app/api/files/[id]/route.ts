import { NextResponse } from "next/server";
import { getGridFSBucket } from "@/lib/gridfs";
import { ObjectId } from "mongodb";
import connectToDatabase from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    const bucket = await getGridFSBucket();
    const objectId = new ObjectId(id);

    // Find file metadata first
    const files = await bucket.find({ _id: objectId }).toArray();
    if (files.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = files[0];
    const contentType = file.contentType || "image/jpeg";

    // Stream file from GridFS
    const downloadStream = bucket.openDownloadStream(objectId);

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      downloadStream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      downloadStream.on("end", resolve);
      downloadStream.on("error", reject);
    });

    const fileBuffer = Buffer.concat(chunks);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("File serve error:", error);
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    const bucket = await getGridFSBucket();
    await bucket.delete(new ObjectId(id));

    return NextResponse.json({ status: true, message: "File deleted" });
  } catch (error: any) {
    console.error("File delete error:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
