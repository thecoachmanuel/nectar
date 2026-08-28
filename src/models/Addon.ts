import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAddon extends Document {
  name: string;
  price: number;
  status: boolean;
  storeId?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const AddonSchema = new Schema<IAddon>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    status: { type: Boolean, default: true },
    storeId: { type: Schema.Types.Mixed, default: 0 },
  },
  { timestamps: true }
);

const Addon: Model<IAddon> =
  mongoose.models.Addon || mongoose.model<IAddon>("Addon", AddonSchema);

export default Addon;
