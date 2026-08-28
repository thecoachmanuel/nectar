import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPaymentGatewayOption {
  option: string; // paystack_public_key, paystack_secret_key, etc.
  value: string;
}

export interface IPaymentGateway extends Document {
  name: string; // Paystack, Stripe, PayPal, etc.
  slug: string; // paystack, stripe, paypal, razorpay, flutterwave, etc.
  status: boolean;
  options: IPaymentGatewayOption[];
  createdAt: Date;
  updatedAt: Date;
}

const PaymentGatewayOptionSchema = new Schema<IPaymentGatewayOption>({
  option: { type: String, required: true },
  value: { type: String, default: "" },
});

const PaymentGatewaySchema = new Schema<IPaymentGateway>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    status: { type: Boolean, default: false },
    options: [PaymentGatewayOptionSchema],
  },
  { timestamps: true }
);

const PaymentGateway: Model<IPaymentGateway> =
  mongoose.models.PaymentGateway ||
  mongoose.model<IPaymentGateway>("PaymentGateway", PaymentGatewaySchema);

export default PaymentGateway;
