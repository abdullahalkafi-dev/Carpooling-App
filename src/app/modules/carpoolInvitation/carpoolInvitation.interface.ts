import { Model, Types } from "mongoose";

export type TCarpoolInvitation = {
  carpool: Types.ObjectId;
  inviter: Types.ObjectId; // User who sent the invitation (carpool creator)
  invitee: Types.ObjectId; // User who received the invitation
  status: "pending" | "accepted" | "declined";
  message?: string;
  invitationType: "member" | "driver"; // Whether inviting as member or driver
  createdAt: Date;
  updatedAt: Date;
};

export type CarpoolInvitationModal = {
  isInvitationExists(carpoolId: string, inviteeId: string): Promise<TCarpoolInvitation | null>;
  getPendingInvitationsForUser(userId: string): Promise<TCarpoolInvitation[]>;
  getAcceptedInvitationsForCarpool(carpoolId: string): Promise<TCarpoolInvitation[]>;
} & Model<TCarpoolInvitation>;

export namespace TReturnCarpoolInvitation {
  export type Meta = {
    page: number;
    limit: number;
    totalPage: number;
    total: number;
  };

  export type getAllInvitations = {
    result: TCarpoolInvitation[];
    meta?: Meta;
  };

  export type getSingleInvitation = TCarpoolInvitation;
  export type createInvitation = TCarpoolInvitation;
  export type updateInvitation = TCarpoolInvitation;
}
