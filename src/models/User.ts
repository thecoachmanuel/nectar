import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAddress {
  _id?: string;
  label?: string; // Home, Work, Other
  address: string;
  apartment?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: "admin" | "customer" | "chef" | "waiter" | "delivery_boy" | "store_manager";
  storeId: number | string; // 0 for global/all stores
  status: boolean;
  addresses: IAddress[];
  permissions: string[];
  image?: string;
  deviceToken?: string;
  deliveryCommissionType?: "fixed" | "percentage";
  deliveryCommissionValue?: number;
  walletBalance?: number;
  processedReferences: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>({
  label: { type: String, default: "Home" },
  address: { type: String, required: true },
  apartment: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    phone: { type: String },
    role: {
      type: String,
      enum: ["admin", "customer", "chef", "waiter", "delivery_boy", "store_manager"],
      default: "customer",
    },
    storeId: { type: Schema.Types.Mixed, default: 0 },
    status: { type: Boolean, default: true },
    addresses: [AddressSchema],
    permissions: [{ type: String }],
    image: { type: String },
    deliveryCommissionType: { type: String, enum: ["fixed", "percentage"], default: "fixed" },
    deliveryCommissionValue: { type: Number, default: 0 },
    walletBalance: {
      type: Number,
      default: 0,
    },
    processedReferences: {
      type: [String],
      default: []
    },
    deviceToken: { type: String },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
