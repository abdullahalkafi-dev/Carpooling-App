import { QueryBuilder } from "../../builder/QueryBuilder";
import { TMessage } from "./message.interface";
import { Message } from "./message.model";

const createMessage = async (payload: Partial<TMessage>) => {
  if (!payload.sender || !payload.receiver) {
    throw new Error("sender and receiver are required");
  }
  const result = await Message.create(payload);
  return result;
};

const createMessageWithImage = async (payload: Partial<TMessage>) => {
  const result = await Message.create(payload);
  return result;
};

const getAllMessage = async (query: Record<string, any>) => {
  const { sender, receiver, page = 1, limit = 10, ...otherQuery } = query;

  const skip = (page - 1) * limit;

  const messageQuery = Message.find({
    $or: [
      { sender: sender, receiver: receiver },
      { sender: receiver, receiver: sender }
    ]
  })
    .populate("sender", "firstName lastName image")
    .populate("receiver", "firstName lastName image")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const result = await messageQuery;

  const total = await Message.countDocuments({
    $or: [
      { sender: sender, receiver: receiver },
      { sender: receiver, receiver: sender }
    ]
  });

  const meta = {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPage: Math.ceil(total / limit)
  };

  return { result, meta };
};

export const MessageServices = {
  createMessage,
  createMessageWithImage,
  getAllMessage,
};
