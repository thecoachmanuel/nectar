import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWishlistItem {
  name: string;
  brandOrSize?: string;
}

export interface IShoppingWishlist extends Document {
  customerPhone: string;
  customerName?: string;
  userId?: mongoose.Types.ObjectId;
  items: IWishlistItem[];
  rawInput?: string; // original comma-separated text the customer typed
  status: "new" | "reviewed" | "actioned";
  source: "whatsapp" | "web";
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>(
  {
    name: { type: String, required: true, trim: true },
    brandOrSize: { type: String, trim: true },
  },
  { _id: false }
);

const ShoppingWishlistSchema = new Schema<IShoppingWishlist>(
  {
    customerPhone: { type: String, required: true, trim: true },
    customerName: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    items: { type: [WishlistItemSchema], default: [] },
    rawInput: { type: String },
    status: {
      type: String,
      enum: ["new", "reviewed", "actioned"],
      default: "new",
    },
    source: {
      type: String,
      enum: ["whatsapp", "web"],
      default: "whatsapp",
    },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

// Index for fast lookup by phone & status
ShoppingWishlistSchema.index({ customerPhone: 1 });
ShoppingWishlistSchema.index({ status: 1 });
ShoppingWishlistSchema.index({ createdAt: -1 });

const ShoppingWishlist: Model<IShoppingWishlist> =
  mongoose.models.ShoppingWishlist ||
  mongoose.model<IShoppingWishlist>("ShoppingWishlist", ShoppingWishlistSchema);

export default ShoppingWishlist;
