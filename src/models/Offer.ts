import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOffer extends Document {
  title: string;
  slug: string;
  image?: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Offer: Model<IOffer> =
  mongoose.models.Offer || mongoose.model<IOffer>("Offer", OfferSchema);

export default Offer;
