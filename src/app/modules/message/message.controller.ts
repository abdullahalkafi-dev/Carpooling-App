import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { MessageServices } from "./message.service";
import { io } from "../../../socket/socket";
import AppError from "../../errors/AppError";

const createMessage = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await MessageServices.createMessage(payload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Message created successfully",
    data: result,
  });
});

const createMessageWithImage = catchAsync(
  async (req: Request, res: Response) => {
    const messageData = JSON.parse(req.body.data);
    let image = null;
    if (req.files && "image" in req.files && req.files.image[0]) {
      image = `/images/${req.files.image[0].filename}`;
    }
    const message = {
      sender: messageData.senderId,
      receiver: messageData.receiverId,
      message: messageData.message,
      image: image,
    };

    const result = await MessageServices.createMessageWithImage(message);
    io.emit(`receiver-${message.receiver}`, {
      senderId: message.sender,
      receiverId: message.receiver,
      message: message.message,
      image: message.image,
      isRead: false,
    });
    io.emit(`receiver-${message.sender}`, {
      senderId: message.sender,
      receiverId: message.receiver,
      message: message.message,
      image: message.image,
      isRead: false,
    });
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Message created successfully",
      data: result,
    });
  }
);

const getAllMessage = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  if (!query.senderId || !query.receiverId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "senderId and receiverId are required "
    );
  }
  query.sender = query.senderId.toString();
  query.receiver = query.receiverId.toString();
  delete query.senderId;
  delete query.receiverId;
  console.log(query, "query after delete");
  const { result, meta } = await MessageServices.getAllMessage(query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Messages retrieved successfully",
    meta,
    data: result,
  });
});

export const MessageControllers = {
  createMessage,
  createMessageWithImage,
  getAllMessage,
};
