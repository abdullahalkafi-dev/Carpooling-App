import { Server } from "socket.io";
import { handleSendMessage } from "./userMessage/message";
import { handleSendCarpoolMessage, handleJoinCarpoolRoom, handleLeaveCarpoolRoom } from "./carpoolMessage/carpoolMessage";
import { 
  handleDriverLocationStart, 
  handleDriverLocationUpdate, 
  handleDriverLocationStop,
  handleDriverDisconnect,
  joinCarpoolLocationRoom,
  leaveCarpoolLocationRoom
} from "./driverLocation/driverLocation";
import { Message } from "../app/modules/message/message.model";

export const users = new Map();

export const activeChatUsers = new Map(); // Map to track active chat sessions

let io: Server; // Store io instance globally
const setupSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: ["*", "http://localhost:3000", "http://localhost:5173"],
      methods: ["GET", "POST"],
    },
  });
  io.on("connection", (socket) => {
    console.log(`
      
      
      
      
      new user connected
      
      
      
      `);
    socket.on("register", (userId) => {
      const existingSockets = users.get(userId) || [];
      users.set(userId, [...existingSockets, socket.id]);
      console.log("onlineUsers", Array.from(users.keys()));
      io.emit("onlineUsers", Array.from(users.keys()));
    });

    socket.on("updateFcmToken", async (data) => {
      const { userId, fcmToken } = data;
      try {
        if (userId && fcmToken) {
          const { User } = await import("../app/modules/user/user.model");
          await User.findByIdAndUpdate(userId, { fcmToken });
          console.log(`FCM token updated for user ${userId} via socket: ${fcmToken}`);
          socket.emit("fcmTokenUpdated", { success: true });
        }
      } catch (error) {
        console.error("Error updating FCM token via socket:", error);
        socket.emit("fcmTokenUpdated", { success: false, error: "Failed to update FCM token" });
      }
    });

    socket.on("activeChat", (data) => {
      console.log("activeChat", data);
      if (data.senderId) {
        activeChatUsers.set(data.receiverId, data.senderId);
      } else {
        activeChatUsers.delete(data.receiverId);
      }
    });

    socket.on("sendMessage", async (data) => {
      try {
        console.log("sendMessage", !data.senderId ||
          !data.receiverId ||
          (!data.message && !data.image));
        // Add basic validation
        if (
          !data.senderId ||
          !data.receiverId ||
          (!data.message && !data.image)
        ) {
          socket.emit("error", { message: "Invalid message data" });
          return;
        }

        await handleSendMessage(data); // Call the function to handle sending messages
      } catch (error) {
        console.error("Error in sendMessage:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Carpool messaging events
    socket.on("sendCarpoolMessage", async (data) => {
      try {
        console.log("sendCarpoolMessage", data);
        // Add basic validation
        if (
          !data.carpoolId ||
          !data.senderId ||
          (!data.message && !data.image)
        ) {
          socket.emit("error", { message: "Invalid carpool message data" });
          return;
        }

        await handleSendCarpoolMessage(data);
      } catch (error) {
        console.error("Error in sendCarpoolMessage:", error);
        socket.emit("error", { message: "Failed to send carpool message" });
      }
    });

    socket.on("joinCarpoolRoom", async (data) => {
      try {
        console.log("joinCarpoolRoom", data);
        if (!data.userId || !data.carpoolId) {
          socket.emit("error", { message: "Invalid carpool room data" });
          return;
        }

        await handleJoinCarpoolRoom(data);
      } catch (error) {
        console.error("Error in joinCarpoolRoom:", error);
        socket.emit("error", { message: "Failed to join carpool room" });
      }
    });

    socket.on("leaveCarpoolRoom", (data) => {
      try {
        console.log("leaveCarpoolRoom", data);
        if (!data.userId || !data.carpoolId) {
          socket.emit("error", { message: "Invalid carpool room data" });
          return;
        }

        handleLeaveCarpoolRoom(data);
      } catch (error) {
        console.error("Error in leaveCarpoolRoom:", error);
        socket.emit("error", { message: "Failed to leave carpool room" });
      }
    });
    socket.on("markAsRead", async (data) => {
      try {
        console.log("markAsRead", data);
        const { senderId, receiverId } = data;

        if (senderId && receiverId) {
          await Message.updateMany(
            { sender: senderId, receiver: receiverId, isRead: false },
            { $set: { isRead: true } }
          );

          // Notify the sender that messages have been read
          let senderSocketId;
          users.forEach((socketIds, userId) => {
            if (userId.toString() === senderId.toString()) {
              if (socketIds && socketIds.length > 0) {
                senderSocketId = socketIds[0];
              }
            }
          });

          if (senderSocketId) {
            io.to(senderSocketId).emit(`messages-read`, {
              senderId,
              receiverId,
              isRead: true,
            });
          }
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });

    // Driver location events
    socket.on("startDriverLocation", (data) => {
      handleDriverLocationStart(socket, data);
    });

    socket.on("updateDriverLocation", (data) => {
      handleDriverLocationUpdate(socket, data);
    });

    socket.on("stopDriverLocation", () => {
      handleDriverLocationStop(socket);
    });

    // Join/leave carpool location room for receiving location updates
    socket.on("joinCarpoolLocation", (data) => {
      joinCarpoolLocationRoom(socket, data);
    });

    socket.on("leaveCarpoolLocation", (data) => {
      leaveCarpoolLocationRoom(socket, data);
    });

    socket.on("disconnect", () => {
      // Handle driver location sharing disconnect
      handleDriverDisconnect(socket.id);
      
      users.forEach((socketIds, userId) => {
        const updated = socketIds.filter((id: any) => id !== socket.id);
        if (updated.length > 0) {
          users.set(userId, updated);
        } else {
          users.delete(userId);
          activeChatUsers.delete(userId);
        }
      });
      io.emit("onlineUsers", Array.from(users.keys()));
    });
  });

  return io;
};

export { setupSocket, io };
