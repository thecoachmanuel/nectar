import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayoutRequest extends Document {
  userId: mongoose.Types.ObjectId | string; // Can be Store Manager or Delivery Boy
  userRole: "store_manager" | "delivery_boy";
  amount: number;
  status: "pending" | "approved" | "rejected";
  paymentMethod?: string;
  paymentDetails?: string; // e.g. Bank account info
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutRequestSchema = new Schema<IPayoutRequest>(
  {
    userId: { type: Schema.Types.Mixed, required: true },
    userRole: { type: String, enum: ["store_manager", "delivery_boy"], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    paymentMethod: { type: String },
    paymentDetails: { type: String },
    adminNote: { type: String },
  },
  { timestamps: true }
);

const PayoutRequest: Model<IPayoutRequest> =
  mongoose.models.PayoutRequest || mongoose.model<IPayoutRequest>("PayoutRequest", PayoutRequestSchema);

export default PayoutRequest;
