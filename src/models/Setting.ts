import mongoose, { Document, Model } from 'mongoose';

export interface ISetting extends Document {
  group: string;
  key: string;
  payload: any;
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
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose from compiling the model multiple times in development
export const Setting: Model<ISetting> =
  mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
