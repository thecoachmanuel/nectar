import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  variationName?: string;
  extras?: { name: string; price: number }[];
  addons?: { name: string; price: number }[];
  itemTotal: number;
}

export interface IStatusTimeline {
  status: string;
  timestamp: Date;
  note?: string;
}

export interface IOrder extends Document {
  orderSerialNo: string;
  userId?: mongoose.Types.ObjectId | string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  orderType: "delivery" | "pickup" | "dine_in";
  storeId: mongoose.Types.ObjectId | string;
  deliveryBoyId?: mongoose.Types.ObjectId | string;
  items: IOrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  deliveryCharge: number;
  deliveryPin?: string;
  deliveryBoyEarned?: number;
  commissionAmount?: number;
  discount: number;
  totalAmount: number;
  couponCode?: string;
  couponDiscount?: number;
  deliveryAddress?: {
    address: string;
    apartment?: string;
    latitude?: number;
    longitude?: number;
  };
  deliveryTimeSlot?: string;
  paymentMethod: string; // paystack, stripe, cod, etc.
  paymentStatus: "paid" | "unpaid" | "failed";
  paymentReference?: string;
  orderStatus: "pending" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "canceled";
  statusTimeline: IStatusTimeline[];
  tableNumber?: string;
  notes?: string;
  isPos?: boolean;
  posReceivedAmount?: number;
  posChangeAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  variationName: { type: String },
  extras: [{ name: String, price: Number }],
  addons: [{ name: String, price: Number }],
  itemTotal: { type: Number, required: true },
});

const StatusTimelineSchema = new Schema<IStatusTimeline>({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderSerialNo: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.Mixed },
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    customerPhone: { type: String, required: true },
    orderType: { type: String, enum: ["delivery", "pickup", "dine_in"], required: true },
    storeId: { type: Schema.Types.Mixed, required: true },
    deliveryBoyId: { type: Schema.Types.Mixed },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    deliveryPin: { type: String },
    deliveryBoyEarned: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    deliveryAddress: {
      address: String,
      apartment: String,
      latitude: Number,
      longitude: Number,
    },
    deliveryTimeSlot: { type: String },
    paymentMethod: { type: String, default: "cash_on_delivery" },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid", "failed"],
      default: "unpaid",
    },
    paymentReference: { type: String },
    orderStatus: {
      type: String,
      enum: ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "canceled"],
      default: "pending",
    },
    statusTimeline: [StatusTimelineSchema],
    tableNumber: { type: String },
    notes: { type: String },
    isPos: { type: Boolean, default: false },
    posReceivedAmount: { type: Number },
    posChangeAmount: { type: Number },
  },
  { timestamps: true }
);

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
