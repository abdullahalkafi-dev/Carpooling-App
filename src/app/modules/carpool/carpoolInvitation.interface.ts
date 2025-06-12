import { Model, Types } from "mongoose";

export type TCarpoolInvitation = {
  carpool: Types.ObjectId;
  inviter: Types.ObjectId;
  invitee: Types.ObjectId;
  status: "pending" | "accepted" | "declined";
  message?: string;
  createdAt: Date;
  updatedAt: Date;  
};

export type CarpoolInvitationModal = {
  isInvitationExists(carpoolId: string, inviteeId: string): Promise<TCarpoolInvitation | null>;
  getPendingInvitationsForUser(userId: string): Promise<TCarpoolInvitation[]>;
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
