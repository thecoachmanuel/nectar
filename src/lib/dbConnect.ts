import mongoose from 'mongoose';
import "@/models/User";
import "@/models/ItemCategory";
import "@/models/Addon";
import "@/models/Item";
import "@/models/Order";
import "@/models/Store";
import "@/models/Setting";
import "@/models/Coupon";
import "@/models/PaymentGateway";
import "@/models/PayoutRequest";
import "@/models/Message";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/foodappi";

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 15, // Maintain up to 15 socket connections for fast parallel queries
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
