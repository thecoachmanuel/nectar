import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITimeSlot {
  day: string; // Monday, Tuesday...
  openingTime: string; // 09:00 AM
  closingTime: string; // 10:00 PM
  isClosed: boolean;
}

export interface IBranch extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  zipCode?: string;
  status: boolean;
  zone?: {
    type: string; // "Polygon"
    coordinates: number[][][]; // GeoJSON format: [[[lng, lat], [lng, lat]...]]
  };
  timeSlots: ITimeSlot[];
  createdAt: Date;
  updatedAt: Date;
}

const TimeSlotSchema = new Schema<ITimeSlot>({
  day: { type: String, required: true },
  openingTime: { type: String, default: "08:00 AM" },
  closingTime: { type: String, default: "10:00 PM" },
  isClosed: { type: Boolean, default: false },
});

const BranchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    status: { type: Boolean, default: true },
    zone: {
      type: { type: String, default: "Polygon" },
      coordinates: { type: [[[Number]]], default: [] },
    },
    timeSlots: [TimeSlotSchema],
  },
  { timestamps: true }
);

BranchSchema.index({ zone: "2dsphere" });

const Branch: Model<IBranch> =
  mongoose.models.Branch || mongoose.model<IBranch>("Branch", BranchSchema);

export default Branch;
