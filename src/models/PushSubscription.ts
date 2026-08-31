import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPushSubscription extends Document {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: Schema.Types.ObjectId | string;
  role: "admin" | "customer" | "store_manager" | "delivery_boy" | "guest" | "all";
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    endpoint: { type: String, required: true, unique: true, index: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    role: {
      type: String,
      enum: ["admin", "customer", "store_manager", "delivery_boy", "guest", "all"],
      default: "customer",
      index: true,
    },
    userAgent: { type: String },
  },
  { timestamps: true }
);

const PushSubscription: Model<IPushSubscription> =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);

export default PushSubscription;
