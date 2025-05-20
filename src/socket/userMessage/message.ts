import { Types } from "mongoose";
import { io, users } from "../socket";
import { MessageServices } from "../../app/modules/message/message.service";

export const handleSendMessage = (data: {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  message?: string;
  image?: string;
}) => {
  console.log(data);
  console.log(data.receiverId);

  // Find the receiverSocketId by checking the users map structure
  let receiverSocketId;
  console.log("users", users);
  users.forEach((socketIds, userId) => {
    console.log({ userId }, socketIds);
    if (userId.toString() === data.receiverId.toString()) {
      // Take the first socket ID from the array if it exists
      if (socketIds && socketIds.length > 0) {
        receiverSocketId = socketIds[0];
      }
    }
  });
  console.log("receiverSocketId", receiverSocketId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit(`receiver-${data.receiverId}`, {
      senderId: data.senderId,
      receiverId: data.receiverId,
      message: data.message,
      image: data.image,
      isRead: false,
    });
  }

  if (data.message && data.receiverId && data.senderId) {
    MessageServices.createMessage({
      sender: new Types.ObjectId(data.senderId),
      receiver: new Types.ObjectId(data.receiverId),
      message: data.message,
      isRead: false,
    });
  }
};
