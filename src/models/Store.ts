import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITimeSlot {
  day: string;
  openingTime: string;
  closingTime: string;
  isClosed: boolean;
}

export interface IStore extends Document {
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
  profileImage?: string;
  bannerImage?: string;
  estimatedDeliveryTime?: string;
  walletBalance: number;
  commissionRate: number;
  deliveryRadius: number;
  deliveryFee?: number;
  password?: string;
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

const StoreSchema = new Schema<IStore>(
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
      type: { type: String, enum: ["Polygon"], default: "Polygon" },
      coordinates: { type: [[[Number]]], default: [] },
    },
    profileImage: { type: String },
    bannerImage: { type: String },
    estimatedDeliveryTime: { type: String, default: "20-30 mins" },
    walletBalance: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0 },
    deliveryRadius: { type: Number, default: 10 },
    deliveryFee: { type: Number, default: 0 },
    password: { type: String },
    timeSlots: [TimeSlotSchema],
  },
  { timestamps: true }
);

StoreSchema.index({ zone: "2dsphere" });

const Store: Model<IStore> =
  mongoose.models.Store || mongoose.model<IStore>("Store", StoreSchema);

export default Store;
