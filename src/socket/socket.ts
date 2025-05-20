import { Server } from "socket.io";
import { handleSendMessage } from "./userMessage/message";
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
    console.log("new user connected");
    socket.on("register", (userId) => {
      const existingSockets = users.get(userId) || [];
      users.set(userId, [...existingSockets, socket.id]);
      console.log("onlineUsers", Array.from(users.keys()));
      io.emit("onlineUsers", Array.from(users.keys()));
    });

    socket.on("activeChat", (data) => {
      console.log("activeChat", data);
      if (data.senderId) {
        activeChatUsers.set(data.receiverId, data.senderId);
      } else {
        activeChatUsers.delete(data.receiverId);
      }
    });
    socket.on("sendMessage", (data) => {
      handleSendMessage(data); // Call the function to handle sending messages
    });
    socket.on("markAsRead", async (data) => {
      console.log("markAsRead", data);
      const { senderId, receiverId } = data;

      if (senderId && receiverId) {
        await Message.updateMany(
          { sender: senderId, receiver: receiverId, isRead: false },
          { $set: { isRead: true } }
        );
      }
      io.emit(`receiver-${senderId}`, {
        senderId,
        receiverId,
        isRead: true,
      });
    });

    socket.on("disconnect", () => {
      users.forEach((socketIds, userId) => {
        const updated = socketIds.filter((id:any) => id !== socket.id);
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
