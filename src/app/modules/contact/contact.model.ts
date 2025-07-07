import { model, Schema } from "mongoose";
import { TContact, ContactModal } from "./contact.interface";

const contactSchema = new Schema<TContact, ContactModal>(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index to prevent duplicate requests
contactSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Index for better query performance
contactSchema.index({ status: 1 });
contactSchema.index({ requester: 1, status: 1 });
contactSchema.index({ recipient: 1, status: 1 });

// Static methods
contactSchema.statics.isContactExists = async function(
  requesterId: string,
  recipientId: string
): Promise<TContact | null> {
  return await this.findOne({
    $or: [
      { requester: requesterId, recipient: recipientId },
      { requester: recipientId, recipient: requesterId }
    ]
  });
};

contactSchema.statics.isAlreadyFriends = async function(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const contact = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2, status: "accepted" },
      { requester: userId2, recipient: userId1, status: "accepted" }
    ]
  });
  return !!contact;
};

export const Contact = model<TContact, ContactModal>("Contact", contactSchema);
