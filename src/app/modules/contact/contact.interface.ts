import { Model, Types } from "mongoose";

export type TContact = {
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: "pending" | "accepted" | "blocked";
  createdAt: Date;
  updatedAt: Date;
};

export type ContactModal = {
  isContactExists(
    requesterId: string,
    recipientId: string
  ): Promise<TContact | null>;
  isAlreadyFriends(userId1: string, userId2: string): Promise<boolean>;
} & Model<TContact>;

export namespace TReturnContact {
  export type Meta = {
    page: number;
    limit: number;
    totalPage: number;
    total: number;
  };

  export type getAllContacts = {
    result: TContact[];
    meta?: Meta;
  };

  export type getSingleContact = TContact;
  export type updateContact = TContact;
  export type createContact = TContact;
}
