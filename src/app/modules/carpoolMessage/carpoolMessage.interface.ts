import { Model, Types } from "mongoose";

export type TCarpoolMessage = {
  carpoolId: Types.ObjectId;
  sender: Types.ObjectId;
  message?: string | null;
  image?: string | null;
  isRead?: boolean;
  readBy?: Types.ObjectId[]; // Array of user IDs who have read the message
  createAt: Date;
  updateAt: Date;
  senderId?: string;
  carpoolName?: string;
};

export namespace TCarpoolMessageReturn {
  export type Meta = {
    page: number;
    limit: number;
    totalPage: number;
    total: number;
  };
}

export interface CarpoolMessageModal extends Model<TCarpoolMessage> {
  isExistsCarpoolMessage(id: string): Promise<TCarpoolMessage | null>;
}
