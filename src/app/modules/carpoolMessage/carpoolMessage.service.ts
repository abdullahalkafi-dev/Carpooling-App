import { QueryBuilder } from "../../builder/QueryBuilder";
import { TCarpoolMessage } from "./carpoolMessage.interface";
import { CarpoolMessage } from "./carpoolMessage.model";
import { Carpool } from "../carpool/carpool.model";

const createCarpoolMessage = async (payload: Partial<TCarpoolMessage>) => {
  if (!payload.sender || !payload.carpoolId) {
    throw new Error("sender and carpoolId are required");
  }
  
  // Verify that the carpool exists
  const carpool = await Carpool.findById(payload.carpoolId);
  if (!carpool) {
    throw new Error("Carpool not found");
  }

  // Verify that the sender is a member of the carpool
  const senderId = payload.sender!.toString();
  const isDriverOrCreator = carpool.driver?.toString() === senderId || 
                           carpool.createdBy.toString() === senderId;
  const isMember = carpool.members?.some(member => member.toString() === senderId);
  
  if (!isDriverOrCreator && !isMember) {
    throw new Error("User is not a member of this carpool");
  }

  const result = await CarpoolMessage.create(payload);
  return result;
};

const getCarpoolMessages = async (query: Record<string, any>) => {
  const { carpoolId } = query;

  if (!carpoolId) {
    throw new Error("carpoolId is required");
  }

  // Verify carpool exists
  const carpool = await Carpool.findById(carpoolId);
  if (!carpool) {
    throw new Error("Carpool not found");
  }

  const messageQuery = new QueryBuilder(
    CarpoolMessage.find({ carpoolId })
      .populate("sender", "firstName lastName image")
      .populate("carpoolId", "eventName")
      .sort({ createdAt: 1 }), // Sort by creation time ascending
    query
  )
    .search(["message"])
    .filter()
    .paginate()
    .fields();

  const result = await messageQuery.modelQuery;
  const meta = await messageQuery.countTotal();

  return { result, meta, carpoolInfo: carpool };
};

const markCarpoolMessageAsRead = async (messageId: string, userId: string) => {
  const message = await CarpoolMessage.findById(messageId);
  if (!message) {
    throw new Error("Message not found");
  }

  // Add user to readBy array if not already present
  if (!message.readBy?.includes(userId as any)) {
    await CarpoolMessage.findByIdAndUpdate(
      messageId,
      { $addToSet: { readBy: userId } },
      { new: true }
    );
  }

  return message;
};

const getCarpoolMembers = async (carpoolId: string) => {
  const carpool = await Carpool.findById(carpoolId)
    .populate("createdBy", "firstName lastName image")
    .populate("driver", "firstName lastName image")
    .populate("members", "firstName lastName image");
  
  if (!carpool) {
    throw new Error("Carpool not found");
  }

  // Combine all members (creator, driver, and members)
  const allMembers = [];
  
  if (carpool.createdBy) allMembers.push(carpool.createdBy);
  if (carpool.driver && carpool.driver._id.toString() !== carpool.createdBy._id.toString()) {
    allMembers.push(carpool.driver);
  }
  if (carpool.members) {
    carpool.members.forEach(member => {
      const memberId = member._id.toString();
      if (memberId !== carpool.createdBy._id.toString() && 
          (!carpool.driver || memberId !== carpool.driver._id.toString())) {
        allMembers.push(member);
      }
    });
  }

  return { members: allMembers, carpoolInfo: carpool };
};

export const CarpoolMessageServices = {
  createCarpoolMessage,
  getCarpoolMessages,
  markCarpoolMessageAsRead,
  getCarpoolMembers,
};
