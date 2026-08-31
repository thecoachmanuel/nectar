import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICoupon extends Document {
  name: string;
  code: string;
  discountType: "percentage" | "fixed" | "free_delivery";
  discount: number;
  minimumOrderAmount: number;
  maximumDiscount?: number;
  limitPerUser: number;
  oneTimePerUser?: boolean;
  onlyForNewCustomers?: boolean;
  usedBy?: string[];
  totalLimit: number;
  usedCount: number;
  startDate: Date;
  endDate: Date;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ["percentage", "fixed", "free_delivery"], default: "percentage" },
    discount: { type: Number, default: 0 },
    minimumOrderAmount: { type: Number, default: 0 },
    maximumDiscount: { type: Number, default: 0 },
    limitPerUser: { type: Number, default: 1 },
    oneTimePerUser: { type: Boolean, default: false },
    onlyForNewCustomers: { type: Boolean, default: false },
    usedBy: [{ type: String }],
    totalLimit: { type: Number, default: 1000 },
    usedCount: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);

export default Coupon;
