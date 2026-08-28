import mongoose, { Schema, Document, Model } from "mongoose";

export interface IItemCategory extends Document {
  name: string;
  slug: string;
  image?: string;
  sortOrder: number;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemCategorySchema = new Schema<IItemCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String },
    sortOrder: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ItemCategory: Model<IItemCategory> =
  mongoose.models.ItemCategory ||
  mongoose.model<IItemCategory>("ItemCategory", ItemCategorySchema);

export default ItemCategory;
