import { Types } from "mongoose";
import { QueryBuilder } from "../../builder/QueryBuilder";
import { TCarpool, TReturnCarpool } from "./carpool.interface";
import { Carpool } from "./carpool.model";
import { carpoolValidator } from "./carpool.utils";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import CarpoolCacheManage from "./carpool.cacheManage";
import { Dependents } from "../dependents/dependents.model";
import { CarpoolInvitation } from "../carpoolInvitation/carpoolInvitation.model";




 
const createCarpool = async (payload: Partial<TCarpool>) => {
  // Validate the payload using the carpoolValidator function
  carpoolValidator(payload);
  if (!payload.createdBy) {
    throw new AppError(StatusCodes.BAD_REQUEST, "createdBy is required");
  }
  payload.members = [payload.createdBy];
  if(!payload.startLocation || !payload.startLocation.coordinates){
    throw new AppError(StatusCodes.BAD_REQUEST, "startLocation is required");
  }
  //default driverLocation will carpoolStartLocation
  payload.driverLocation = [payload.startLocation.coordinates[0], payload.startLocation.coordinates[1]];

  const result = await Carpool.create(payload);
  result && CarpoolCacheManage.updateCarpoolCache(result._id.toString());
  return result;
};

const getAllCarpools = async (
  query: Record<string, unknown>
): Promise<TReturnCarpool.getAllCarpool> => {
  const cached = await CarpoolCacheManage.getCacheListWithQuery(query);
  if (cached) return cached;

  const carpoolQuery = new QueryBuilder(Carpool.find(), query)
    .search(["eventName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await carpoolQuery.modelQuery;
  const meta = await carpoolQuery.countTotal();

  await CarpoolCacheManage.setCacheListWithQuery(query, { result, meta });

  return { meta, result };
};

const getCarpoolById = async (id: string): Promise<TCarpool | null> => {
  const cachedCarpool = await CarpoolCacheManage.getCacheSingleCarpool(id);
  if (cachedCarpool) return cachedCarpool;

  // Validate if the id is a valid ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid ID format");
  }
  const result = await Carpool.findById(id).populate([
    {
      path: "members",
      select: "firstName email lastName image",
    },
    {
      path: "childrens",
      select: "firstName  lastName image tag parentId",
    },
    {
      path: "driver",
      select: "firstName lastName email image",
    },
    {
      path: "createdBy",
      select: "firstName lastName email image",
    },
  ]);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Carpool not found");
  }
  // Cache the carpool data
  await CarpoolCacheManage.setCacheSingleCarpool(id, result);
  return result;
};

const getCarpoolsByUser = async (
  userId: string,
  query: Record<string, unknown> = {}
) => {
  // Validate if the userId is a valid ObjectId
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid user ID format");
  }

  // Convert userId to ObjectId for proper comparison
  const userObjectId = new Types.ObjectId(userId);

  // Create filter to find carpools where user is creator, member, or driver
  const userFilter = {
    $or: [
      { createdBy: userObjectId }, // User is the creator
      { members: { $in: [userObjectId] } }, // User is in members array
      { driver: userObjectId }, // User is the driver
    ],
  };

  const { createdBy, members, driver, ...cleanQuery } = query;

  // Bypass QueryBuilder and use direct MongoDB query to avoid filter conflicts
  let mongoQuery = Carpool.find(userFilter).populate([
    {
      path: "members",
      select: "firstName email lastName image",
    },
    {
      path: "childrens",
      select: "firstName lastName image tag parentId",
    },
    {
      path: "driver",
      select: "firstName lastName email image",
    },
    {
      path: "createdBy",
      select: "firstName lastName email image",
    },
  ]);

  // Apply additional filters from cleanQuery manually
  if (cleanQuery.eventName) {
    mongoQuery = mongoQuery
      .where("eventName")
      .regex(new RegExp(cleanQuery.eventName as string, "i"));
  }

  // Apply sorting
  mongoQuery = mongoQuery.sort({ createdAt: -1 });

  // Apply pagination
  const page = Number(cleanQuery.page) || 1;
  const limit = Number(cleanQuery.limit) || 10;
  const skip = (page - 1) * limit;

  mongoQuery = mongoQuery.skip(skip).limit(limit);

  const result = await mongoQuery;

  // Count total documents for meta
  const total = await Carpool.countDocuments(userFilter);
  const meta = {
    page,
    limit,
    total,
    totalPage: Math.ceil(total / limit),
  };
  return {
    meta,
    result,
  };
};

const updateCarpool = async (
  id: string,
  payload: Partial<TCarpool>
): Promise<TCarpool | null> => {
  // Validate if the id is a valid ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid ID format");
  }
  // Check if the carpool exists
  const existingCarpool = await Carpool.findById(id);
  if (!existingCarpool) {
    throw new AppError(StatusCodes.NOT_FOUND, "Carpool not found");
  }
  const result = await Carpool.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  );
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Carpool not found");
  }
  // Update the cache for the carpool
  await CarpoolCacheManage.updateCarpoolCache(id);
  return result;
};

const deleteCarpool = async (id: string): Promise<TCarpool | null> => {
  // Validate if the id is a valid ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid ID format");
  }
  // Check if the carpool exists
  const existingCarpool = await Carpool.findById(id);
  if (!existingCarpool) {
    throw new AppError(StatusCodes.NOT_FOUND, "Carpool not found");
  }
  const result = await Carpool.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Carpool not found");
  }
  // Update the cache for the carpool
  await CarpoolCacheManage.updateCarpoolCache(id);
  return result;
};

const addChildrenToCarpool = async (
  carpoolId: string,
  userId: string,
  childrenIds: string[]
): Promise<TCarpool> => {
  // Validate ObjectId early to avoid unnecessary DB queries
  if (!Types.ObjectId.isValid(carpoolId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid carpool ID format");
  }

  console.time("Initial Queries");
  // Run initial queries in parallel
  const [carpool, userDependents] = await Promise.all([
    Carpool.findById(carpoolId),
    Dependents.find({
      _id: { $in: childrenIds },
      parentId: userId,
    }),
  ]);
  console.timeEnd("Initial Queries");

  // Error checks
  if (!carpool) {
    throw new AppError(StatusCodes.NOT_FOUND, "Carpool not found");
  }
  if (!carpool.members || carpool.members.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Carpool has no members");
  }

  // Check if user is a member or creator of the carpool
  const userObjectId = new Types.ObjectId(userId);
  const isMember =
    carpool.members.some((member) => member.equals(userObjectId)) ||
    carpool.createdBy.equals(userObjectId);

  if (!isMember) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not a member of this carpool"
    );
  }

  // Check if any dependents are not children
  if (userDependents.some((dep) => dep.tag !== "children")) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Only children can be added to carpool"
    );
  }

  // Validate all requested children belong to the user
  if (userDependents.length !== childrenIds.length) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Some children do not belong to you"
    );
  }

  // Add children to carpool (avoid duplicates)
  const existingChildren = carpool.childrens || [];
  const newChildren = childrenIds.filter(
    (childId) =>
      !existingChildren.some((existing) => existing.toString() === childId)
  );

  // Skip update if no new children to add
  if (newChildren.length === 0) {
    console.log("No new children to add, skipping update");
    // Manually populate the existing carpool instead of doing another DB call
    console.time("Manual Population");
    await carpool.populate([
      { path: "createdBy", select: "firstName lastName email" },
      { path: "members", select: "firstName lastName email" },
      { path: "driver", select: "firstName lastName email" },
      { path: "childrens", select: "firstName lastName age parentId" },
    ]);
    console.timeEnd("Manual Population");

    // Update cache in non-blocking way
    CarpoolCacheManage.updateCarpoolCache(carpoolId).catch((err) =>
      console.error("Cache update failed:", err)
    );

    return carpool as TCarpool;
  }

  console.time("Update and Population");
  // Use lean() to speed up query by returning plain JavaScript objects instead of Mongoose documents
  const updatedCarpool = await Carpool.findByIdAndUpdate(
    carpoolId,
    {
      $addToSet: { childrens: { $each: newChildren } },
    },
    { new: true }
  )
    .populate([
      { path: "createdBy", select: "firstName lastName email" },
      { path: "members", select: "firstName lastName email" },
      { path: "driver", select: "firstName lastName email" },
      { path: "childrens", select: "firstName lastName age parentId" },
    ])
    .lean(); // This can significantly improve performance
  console.timeEnd("Update and Population");

  // Update cache in non-blocking way
  console.time("Cache Update");
  CarpoolCacheManage.updateCarpoolCache(carpoolId).catch((err) =>
    console.error("Cache update failed:", err)
  );
  console.timeEnd("Cache Update");

  return updatedCarpool as TCarpool;
};
const removeChildrenFromCarpool = async (
  carpoolId: string,
  userId: string,
  childrenIds: string[]
): Promise<TCarpool> => {
  // Check if carpool exists
  const carpool = await Carpool.findById(carpoolId); //! 1st operation
  if (!carpool) {
    throw new AppError(StatusCodes.NOT_FOUND, "Carpool not found");
  }
  if (!carpool.members || carpool.members.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Carpool has no members");
  }
  // Check if user is a member or creator of the carpool
  const isMember =
    carpool.members.includes(new Types.ObjectId(userId)) ||
    carpool.createdBy.toString() === userId;
  if (!isMember) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not a member of this carpool"
    );
  }

  // Verify all children belong to the user
  const userDependents = await Dependents.find({
    //! 2nd operation
    _id: { $in: childrenIds },
    parentId: userId,
    tag: "children",
  });

  if (userDependents.length !== childrenIds.length) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Some children do not belong to you"
    );
  }

  // Remove children from carpool
  const updatedCarpool = await Carpool.findByIdAndUpdate(
    carpoolId,
    {
      $pull: { childrens: { $in: childrenIds } },
    },
    { new: true }
  ).populate([
    { path: "createdBy", select: "firstName lastName email" },
    { path: "members", select: "firstName lastName email" },
    { path: "driver", select: "firstName lastName email" },
    { path: "childrens", select: "firstName lastName age parentId" },
  ]);

  // Update cache
  await CarpoolCacheManage.updateCarpoolCache(carpoolId);

  return updatedCarpool as TCarpool;
};

const updateDriver = async (carpoolId: string, userId: string) => {
  const updatedDriver = await Carpool.findByIdAndUpdate(
    carpoolId,
    { driver: userId },
    { new: true }
  );
  return updatedDriver;
};

const removeUserFromCarpool = async (carpoolId: string, userId: string) => {
  const carpool = await Carpool.findById(carpoolId);
  if (!carpool) {
    throw new AppError(StatusCodes.NOT_FOUND, "Carpool not found");
  }
  console.log(carpool.createdBy.toString(), userId);
  if (carpool.createdBy.toString() === userId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot remove the creator of the carpool"
    );
  }

  const updatedCarpool = await Carpool.findByIdAndUpdate(
    carpoolId,
    { $pull: { members: userId } },
    { new: true }
  );
  if (!updatedCarpool) {
    throw new AppError(StatusCodes.NOT_FOUND, "Carpool not found");
  }
  //remove children associated with the user
  await Carpool.findByIdAndUpdate(
    carpoolId,
    { $pull: { childrens: { parentId: userId } } },
    { new: true }
  );

  await CarpoolInvitation.deleteMany({
    carpool: carpoolId,
    invitee: userId,
  });

  return updatedCarpool;
};

const updateDriverLocation = async (carpoolId: string, location: [number, number]) => {
  if (!Types.ObjectId.isValid(carpoolId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid carpool ID");
  }

  // Validate coordinates
  const [longitude, latitude] = location;
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new AppError(
      StatusCodes.BAD_REQUEST, 
      "Invalid coordinates: longitude must be between -180 and 180, latitude between -90 and 90"
    );
  }

  const updatedCarpool = await Carpool.findByIdAndUpdate(
    carpoolId,
    { driverLocation: location },
    { new: true }
  );

  if (!updatedCarpool) {
    throw new AppError(StatusCodes.NOT_FOUND, "Carpool not found");
  }

  // Update cache
  await CarpoolCacheManage.updateCarpoolCache(carpoolId);
  
  return updatedCarpool;
};

const getDriverLocation = async (carpoolId: string) => {
  if (!Types.ObjectId.isValid(carpoolId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid carpool ID");
  }

  const carpool = await Carpool.findById(carpoolId).select('driverLocation driver eventName updatedAt');
  if (!carpool) {
    throw new AppError(StatusCodes.NOT_FOUND, "Carpool not found");
  }

  return {
    carpoolId: carpool._id,
    eventName: carpool.eventName,
    driverLocation: carpool.driverLocation,
    driver: carpool.driver,
    lastUpdated: (carpool as any).updatedAt
  };
};

export const carpoolService = {
  createCarpool,
  getAllCarpools,
  getCarpoolById,
  getCarpoolsByUser,
  updateCarpool,
  deleteCarpool,
  updateDriver,
  addChildrenToCarpool,
  removeChildrenFromCarpool,
  removeUserFromCarpool,
  updateDriverLocation,
  getDriverLocation,
};
