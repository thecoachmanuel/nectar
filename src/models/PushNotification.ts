import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPushNotification extends Document {
  title: string;
  description: string;
  targetRole: "all" | "customer" | "store_manager" | "delivery_boy";
  image?: string;
  url?: string;
  recipientsCount: number;
  tokensCount: number;
  status: "sent" | "failed";
  sentBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PushNotificationSchema = new Schema<IPushNotification>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    targetRole: {
      type: String,
      enum: ["all", "customer", "store_manager", "delivery_boy"],
      default: "all",
      required: true,
    },
    image: { type: String },
    url: { type: String, default: "/" },
    recipientsCount: { type: Number, default: 0 },
    tokensCount: { type: Number, default: 0 },
    status: { type: String, enum: ["sent", "failed"], default: "sent" },
    sentBy: { type: String, default: "Admin" },
  },
  { timestamps: true }
);

const PushNotification: Model<IPushNotification> =
  mongoose.models.PushNotification ||
  mongoose.model<IPushNotification>("PushNotification", PushNotificationSchema);

export default PushNotification;
