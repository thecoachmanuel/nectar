import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISetting extends Document {
  group: string; // "site", "company", "theme", "pwa", "whatsapp"
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    group: { type: String, required: true, index: true },
    key: { type: String, required: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

SettingSchema.index({ group: 1, key: 1 }, { unique: true });

const Setting: Model<ISetting> =
  mongoose.models.Setting || mongoose.model<ISetting>("Setting", SettingSchema);

export default Setting;
