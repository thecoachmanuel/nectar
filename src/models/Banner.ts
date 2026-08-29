import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBanner extends Document {
  title?: string;
  subtitle?: string;
  image: string;
  link?: string;
  order: number;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: false },
    subtitle: { type: String },
    image: { type: String, required: true },
    link: { type: String },
    order: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Banner: Model<IBanner> =
  mongoose.models.Banner || mongoose.model<IBanner>("Banner", BannerSchema);

export default Banner;
