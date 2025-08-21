import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { CarpoolMessageServices } from "./carpoolMessage.service";
import { io } from "../../../socket/socket";
import AppError from "../../errors/AppError";

const createCarpoolMessage = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await CarpoolMessageServices.createCarpoolMessage(payload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Carpool message created successfully",
    data: result,
  });
});

const createCarpoolMessageWithImage = catchAsync(
  async (req: Request, res: Response) => {
    const messageData = JSON.parse(req.body.data);
    let image = null;
    if (req.files && "image" in req.files && req.files.image[0]) {
      image = `/images/${req.files.image[0].filename}`;
    }
    
    const message = {
      carpoolId: messageData.carpoolId,
      sender: messageData.senderId,
      message: messageData.message,
      image: image,
    };

    const result = await CarpoolMessageServices.createCarpoolMessage(message);
    
    // Get carpool members to send notifications
    const { members } = await CarpoolMessageServices.getCarpoolMembers(messageData.carpoolId);
    
    // Import users map from socket
    const { users } = require("../../../socket/socket");
    
    // Notify all carpool members except the sender
    members.forEach((member: any) => {
      if (member._id.toString() !== messageData.senderId) {
        let memberSocketId;
        users.forEach((socketIds: string[], userId: string) => {
          if (userId.toString() === member._id.toString()) {
            if (socketIds && socketIds.length > 0) {
              memberSocketId = socketIds[0];
            }
          }
        });

        if (memberSocketId) {
          io.to(memberSocketId).emit(`carpool-message-${messageData.carpoolId}`, {
            _id: result._id,
            carpoolId: messageData.carpoolId,
            senderId: messageData.senderId,
            message: messageData.message,
            image: image,
            createAt: result.createAt,
            sender: {
              _id: messageData.senderId,
              // Add sender info if available
            }
          });
        }
      }
    });

    // Send confirmation to sender
    let senderSocketId;
    users.forEach((socketIds: string[], userId: string) => {
      if (userId.toString() === messageData.senderId) {
        if (socketIds && socketIds.length > 0) {
          senderSocketId = socketIds[0];
        }
      }
    });

    if (senderSocketId) {
      io.to(senderSocketId).emit(`carpool-message-sent`, {
        _id: result._id,
        carpoolId: messageData.carpoolId,
        senderId: messageData.senderId,
        message: messageData.message,
        image: image,
        createAt: result.createAt,
        status: 'sent'
      });
    }

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Carpool message with image created successfully",
      data: result,
    });
  }
);

const getCarpoolMessages = catchAsync(async (req: Request, res: Response) => {
  const query = req.params;
  const { carpoolId } = query;
  
  if (!carpoolId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "carpoolId is required"
    );
  }

  const { result, meta, carpoolInfo } = await CarpoolMessageServices.getCarpoolMessages(query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Carpool messages retrieved successfully",
    meta,
    data: {
      messages: result,
      carpoolInfo: {
        _id: carpoolInfo._id,
        eventName: carpoolInfo.eventName,
      }
    },
  });
});

const getCarpoolMembers = catchAsync(async (req: Request, res: Response) => {
  const { carpoolId } = req.params;
  
  if (!carpoolId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "carpoolId is required"
    );
  }

  const { members, carpoolInfo } = await CarpoolMessageServices.getCarpoolMembers(carpoolId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Carpool members retrieved successfully",
    data: {
      members,
      carpoolInfo: {
        _id: carpoolInfo._id,
        eventName: carpoolInfo.eventName,
      }
    },
  });
});

export const CarpoolMessageControllers = {
  createCarpoolMessage,
  createCarpoolMessageWithImage,
  getCarpoolMessages,
  getCarpoolMembers,
};
