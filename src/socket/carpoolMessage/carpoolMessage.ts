import { Types } from "mongoose";
import { io, users } from "../socket";
import { CarpoolMessageServices } from "../../app/modules/carpoolMessage/carpoolMessage.service";
import NotificationScheduler from "../../app/modules/notification/notification.scheduler";

export const handleSendCarpoolMessage = async (data: {
  carpoolId: Types.ObjectId;
  senderId: Types.ObjectId;
  message?: string;
  image?: string;
}) => {
  try {
    console.log("Carpool message data:", data);

    // Validate required fields
    if (!data.carpoolId || !data.senderId || (!data.message && !data.image)) {
      console.error("Invalid carpool message data", data);
      return;
    }

    // Create message in database first
    const savedMessage = await CarpoolMessageServices.createCarpoolMessage({
      carpoolId: new Types.ObjectId(data.carpoolId),
      sender: new Types.ObjectId(data.senderId),
      message: data.message,
      image: data.image,
    });

    console.log(`
      s
      s
      s
      s
      s
      s
      s
      s
      s
      s
      s
      s

      `,savedMessage);

    // Get carpool members
    const { members } = await CarpoolMessageServices.getCarpoolMembers(
      data.carpoolId.toString()
    );

    // Find sender info
    const senderInfo = members.find(
      (member: any) => member._id.toString() === data.senderId.toString()
    );

    // Send message to all carpool members except the sender
    members.forEach((member: any) => {
      if (member._id.toString() !== data.senderId.toString()) {
        let memberSocketId;
        users.forEach((socketIds, userId) => {
          console.log(`
            d
            d
            d
            d`);
          console.log(socketIds, userId);
           console.log(`
            d
            d
            d
            d`);
          if (userId.toString() === member._id.toString()) {
            if (socketIds && socketIds.length > 0) {
              memberSocketId = socketIds[0];
            }
          }
        });

        if (memberSocketId) {
          io.to(memberSocketId).emit(`carpool-message-${data.carpoolId}`, {
            _id: savedMessage._id,
            carpoolId: data.carpoolId,
            senderId: data.senderId,
            message: data.message,
            image: data.image,
            createAt: savedMessage.createAt,
            sender: senderInfo
              ? {
                  _id: senderInfo._id,
                  firstName: (senderInfo as any).firstName,
                  lastName: (senderInfo as any).lastName,
                  image: (senderInfo as any).image,
                }
              : { _id: data.senderId },
          });
        }
      }
    });

    // Send confirmation back to sender
    let senderSocketId;
    users.forEach((socketIds, userId) => {
      if (userId.toString() === data.senderId.toString()) {
        if (socketIds && socketIds.length > 0) {
          senderSocketId = socketIds[0];
        }
      }
    });

    if (senderSocketId) {
      io.to(senderSocketId).emit(`carpool-message-sent`, {
        _id: savedMessage._id,
        carpoolId: data.carpoolId,
        senderId: data.senderId,
        message: data.message,
        image: data.image,
        createAt: savedMessage.createAt,
        status: "sent",
      });
    }

    // Send push notifications to carpool members
    try {
      await NotificationScheduler.scheduleMessageNotification(
        data.carpoolId,
        data.senderId,
        data.message || 'Image',
        data.senderId
      );
    } catch (notificationError) {
      console.error("Error sending message notification:", notificationError);
    }

  } catch (error) {
    console.error("Error handling carpool message:", error);

    // Send error to sender if possible
    let senderSocketId;
    users.forEach((socketIds, userId) => {
      if (userId.toString() === data.senderId?.toString()) {
        if (socketIds && socketIds.length > 0) {
          senderSocketId = socketIds[0];
        }
      }
    });

    if (senderSocketId) {
      io.to(senderSocketId).emit("carpool-message-error", {
        message: "Failed to send carpool message",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
};

export const handleJoinCarpoolRoom = async (data: {
  userId: Types.ObjectId;
  carpoolId: Types.ObjectId;
}) => {
  try {
    // Verify user is member of carpool
    const { members } = await CarpoolMessageServices.getCarpoolMembers(
      data.carpoolId.toString()
    );
    const isMember = members.some(
      (member: any) => member._id.toString() === data.userId.toString()
    );

    if (!isMember) {
      console.error("User is not a member of this carpool");
      return;
    }

    // Find user's socket and join carpool room
    let userSocketId;
    users.forEach((socketIds, userId) => {
      if (userId.toString() === data.userId.toString()) {
        if (socketIds && socketIds.length > 0) {
          userSocketId = socketIds[0];
        }
      }
    });

    if (userSocketId) {
      // Join the carpool room
      const socket = io.sockets.sockets.get(userSocketId);
      if (socket) {
        socket.join(`carpool-${data.carpoolId}`);
        console.log(
          `User ${data.userId} joined carpool room: carpool-${data.carpoolId}`
        );

        // Send confirmation
        socket.emit("carpool-room-joined", {
          carpoolId: data.carpoolId,
          status: "joined",
        });
      }
    }
  } catch (error) {
    console.error("Error joining carpool room:", error);
  }
};

export const handleLeaveCarpoolRoom = (data: {
  userId: Types.ObjectId;
  carpoolId: Types.ObjectId;
}) => {
  try {
    // Find user's socket and leave carpool room
    let userSocketId;
    users.forEach((socketIds, userId) => {
      if (userId.toString() === data.userId.toString()) {
        if (socketIds && socketIds.length > 0) {
          userSocketId = socketIds[0];
        }
      }
    });

    if (userSocketId) {
      const socket = io.sockets.sockets.get(userSocketId);
      if (socket) {
        socket.leave(`carpool-${data.carpoolId}`);
        console.log(
          `User ${data.userId} left carpool room: carpool-${data.carpoolId}`
        );

        // Send confirmation
        socket.emit("carpool-room-left", {
          carpoolId: data.carpoolId,
          status: "left",
        });
      }
    }
  } catch (error) {
    console.error("Error leaving carpool room:", error);
  }
};
