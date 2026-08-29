import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/foodappi";

let bucket: GridFSBucket | null = null;

export async function getGridFSBucket(): Promise<GridFSBucket> {
  if (bucket) return bucket;

  // Ensure mongoose is connected
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGODB_URI);
  }

  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection not established");

  bucket = new GridFSBucket(db, { bucketName: "uploads" });
  return bucket;
}
