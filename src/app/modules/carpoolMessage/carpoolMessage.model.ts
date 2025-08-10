import { model, Schema } from "mongoose";
import { TCarpoolMessage, CarpoolMessageModal } from "./carpoolMessage.interface";

const carpoolMessageSchema = new Schema<TCarpoolMessage>(
  {
    carpoolId: {
      type: Schema.Types.ObjectId,
      ref: "Carpool",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
    },
    image: {
      type: String,
    },
    readBy: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Static method to check if carpool message exists
carpoolMessageSchema.statics.isExistsCarpoolMessage = async function (
  id: string
): Promise<TCarpoolMessage | null> {
  return await CarpoolMessage.findById(id);
};

export const CarpoolMessage = model<TCarpoolMessage, CarpoolMessageModal>(
  "CarpoolMessage",
  carpoolMessageSchema
);
