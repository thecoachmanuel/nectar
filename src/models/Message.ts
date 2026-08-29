import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId | string;
  senderRole: "customer" | "admin" | "store_manager";
  storeId: mongoose.Types.ObjectId | string;
  message: string;
  isRead: boolean;
  threadId: string;
  status: "open" | "resolved" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.Mixed, required: true },
    senderRole: { type: String, enum: ["customer", "admin", "store_manager"], required: true },
    storeId: { type: Schema.Types.Mixed, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    threadId: { type: String, required: true },
    status: { type: String, enum: ["open", "resolved", "deleted"], default: "open" },
  },
  { timestamps: true }
);

MessageSchema.index({ storeId: 1, senderId: 1, createdAt: 1 });

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
