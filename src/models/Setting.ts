import mongoose, { Document, Model } from 'mongoose';

export interface ISetting extends Document {
  group: string;
  key: string;
  payload?: any;
  iosAppUrl?: string;
  playStoreUrl?: string;
  baseDeliveryFee: number;
  feePerKm: number;
  multiStoreExtraFee?: number;
  freeDeliveryThreshold?: number;
  themeColor: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new mongoose.Schema<ISetting>(
  {
    group: {
      type: String,
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      unique: true, // e.g., 'site_name', 'primary_color'
    },
    payload: { type: mongoose.Schema.Types.Mixed },
    iosAppUrl: { type: String },
    playStoreUrl: { type: String },
    baseDeliveryFee: { type: Number, default: 500 },
    feePerKm: { type: Number, default: 100 },
    multiStoreExtraFee: { type: Number, default: 0 },
    freeDeliveryThreshold: { type: Number },
    themeColor: { type: String, default: "var(--primary-hex)" },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose from compiling the model multiple times in development
const Setting: Model<ISetting> =
  mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);

export default Setting;
