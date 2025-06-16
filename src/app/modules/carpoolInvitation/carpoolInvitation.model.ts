import { model, Schema } from "mongoose";
import { TCarpoolInvitation, CarpoolInvitationModal } from "./carpoolInvitation.interface";

const carpoolInvitationSchema = new Schema<TCarpoolInvitation, CarpoolInvitationModal>(
  {
    carpool: {
      type: Schema.Types.ObjectId,
      ref: "Carpool",
      required: true,
    },
    inviter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    message: {
      type: String,
      maxlength: 500,
    },
    invitationType: {
      type: String,
      enum: ["member", "driver"],
      default: "member",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index to prevent duplicate invitations
carpoolInvitationSchema.index({ carpool: 1, invitee: 1 }, { unique: true });

// Index for better query performance
carpoolInvitationSchema.index({ status: 1 });
carpoolInvitationSchema.index({ inviter: 1, status: 1 });
carpoolInvitationSchema.index({ invitee: 1, status: 1 });
carpoolInvitationSchema.index({ carpool: 1, status: 1 });
carpoolInvitationSchema.index({ invitationType: 1 });

// Static methods
carpoolInvitationSchema.statics.isInvitationExists = async function(
  carpoolId: string,
  inviteeId: string
): Promise<TCarpoolInvitation | null> {
  return await this.findOne({
    carpool: carpoolId,
    invitee: inviteeId
  });
};

carpoolInvitationSchema.statics.getPendingInvitationsForUser = async function(
  userId: string
): Promise<TCarpoolInvitation[]> {
  return await this.find({
    invitee: userId,
    status: "pending"
  }).populate([
    {
      path: "carpool",
      populate: {
        path: "createdBy",
        select: "firstName lastName email image"
      }
    },
    {
      path: "inviter",
      select: "firstName lastName email image"
    }
  ]);
};

carpoolInvitationSchema.statics.getAcceptedInvitationsForCarpool = async function(
  carpoolId: string
): Promise<TCarpoolInvitation[]> {
  return await this.find({
    carpool: carpoolId,
    status: "accepted"
  }).populate([
    {
      path: "invitee",
      select: "firstName lastName email image"
    }
  ]);
};

export const CarpoolInvitation = model<TCarpoolInvitation, CarpoolInvitationModal>(
  "CarpoolInvitation",
  carpoolInvitationSchema
);
