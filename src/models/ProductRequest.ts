import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductRequest extends Document {
  productName: string;
  categoryOrBrand?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  image?: string;
  status: "pending" | "reviewed" | "stocked" | "rejected";
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductRequestSchema = new Schema<IProductRequest>(
  {
    productName: { type: String, required: true, trim: true },
    categoryOrBrand: { type: String, trim: true },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    customerEmail: { type: String, trim: true },
    notes: { type: String, trim: true },
    image: { type: String },
    status: {
      type: String,
      enum: ["pending", "reviewed", "stocked", "rejected"],
      default: "pending",
    },
    adminNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

const ProductRequest: Model<IProductRequest> =
  mongoose.models.ProductRequest ||
  mongoose.model<IProductRequest>("ProductRequest", ProductRequestSchema);

export default ProductRequest;
