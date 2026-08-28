import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId | string;
  senderRole: "customer" | "admin" | "branch_manager";
  branchId: mongoose.Types.ObjectId | string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.Mixed, required: true },
    senderRole: { type: String, enum: ["customer", "admin", "branch_manager"], required: true },
    branchId: { type: Schema.Types.Mixed, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ branchId: 1, senderId: 1, createdAt: 1 });

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
