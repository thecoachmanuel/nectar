import mongoose, { Schema, Document, Model } from "mongoose";
import "./ItemCategory";
import "./Addon";

export interface IVariationOption {
  name: string; // Small, Medium, Large
  price: number;
}

export interface IVariationGroup {
  name: string; // Size, Crust
  options: IVariationOption[];
}

export interface IExtraOption {
  name: string; // Extra Cheese
  price: number;
}

export interface IItem extends Document {
  name: string;
  slug: string;
  storeId: mongoose.Types.ObjectId | string;
  categoryId: mongoose.Types.ObjectId;
  description?: string;
  price: number;

  status: boolean;
  isFeatured: boolean;
  image?: string;
  variations: IVariationGroup[];
  extras: IExtraOption[];
  addonIds: mongoose.Types.ObjectId[];
  taxRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const VariationOptionSchema = new Schema<IVariationOption>({
  name: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
});

const VariationGroupSchema = new Schema<IVariationGroup>({
  name: { type: String, required: true },
  options: [VariationOptionSchema],
});

const ExtraOptionSchema = new Schema<IExtraOption>({
  name: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
});

const ItemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    storeId: { type: Schema.Types.Mixed, required: true, default: 0 },
    categoryId: { type: Schema.Types.ObjectId, ref: "ItemCategory", required: true },
    description: { type: String },
    price: { type: Number, required: true },
    status: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    image: { type: String },
    variations: [VariationGroupSchema],
    extras: [ExtraOptionSchema],
    addonIds: [{ type: Schema.Types.ObjectId, ref: "Addon" }],
    taxRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Item: Model<IItem> =
  mongoose.models.Item || mongoose.model<IItem>("Item", ItemSchema);

export default Item;
