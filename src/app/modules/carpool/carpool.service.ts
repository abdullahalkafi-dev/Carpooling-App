import { Types } from "mongoose";
import { QueryBuilder } from "../../builder/QueryBuilder";
import { TCarpool, TReturnCarpool } from "./carpool.interface";
import { Carpool } from "./carpool.model";
import { carpoolValidator } from "./carpool.utils";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import CarpoolCacheManage from "./carpool.cacheManage";
import { Dependents } from "../dependents/dependents.model";

const createCarpool = async (payload: Partial<TCarpool>) => {
  // Validate the payload using the carpoolValidator function
  carpoolValidator(payload);
   if(!payload.createdBy){
    throw new AppError(StatusCodes.BAD_REQUEST, "createdBy is required");
   }
  payload.members= [payload.createdBy];
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

  // Add userId to the query
  const updatedQuery = { ...query, createdBy: userId };
  const carpoolQuery = new QueryBuilder(
    Carpool.find().populate([
      {
        path: "members",
        select: "firstName email lastName image",
      },
      {
        path: "childrens",
        select: "firstName lastName image tag parentId",
      },
    ]),
    updatedQuery
  )
    .search(["eventName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await carpoolQuery.modelQuery;
  const meta = await carpoolQuery.countTotal();

  return {
    meta,
    data: result.length > 0 ? result : null,
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

// const addChildrenToCarpool = async (
//   carpoolId: string,
//   userId: string,
//   childrenIds: string[]
// ): Promise<TCarpool> => {
//   // Check if carpool exists
//   const carpool = await Carpool.findById(carpoolId);
//   if (!carpool) {
//     throw new AppError(StatusCodes.NOT_FOUND, "Carpool not found");
//   }
//   if (!Types.ObjectId.isValid(carpoolId)) {
//     throw new AppError(StatusCodes.BAD_REQUEST, "Invalid carpool ID format");
//   }
//   if (!carpool.members || carpool.members.length === 0) {
//     throw new AppError(StatusCodes.BAD_REQUEST, "Carpool has no members");
//   }

//   // Check if user is a member or creator of the carpool
//   const isMember =
//     carpool.members.includes(new Types.ObjectId(userId)) ||
//     carpool.createdBy.toString() === userId;

//   if (!isMember) {
//     throw new AppError(
//       StatusCodes.FORBIDDEN,
//       "You are not a member of this carpool"
//     );
//   }

//   // Verify all children belong to the user
//   const userDependents = await Dependents.find({
//     _id: { $in: childrenIds },
//     parentId: userId,
//   });

//   if (userDependents.filter((dep) => dep.tag !== "children").length > 0) {
//     throw new AppError(
//       StatusCodes.BAD_REQUEST,
//       "Only children can be added to carpool"
//     );
//   }

//   if (userDependents.length !== childrenIds.length) {
//     throw new AppError(
//       StatusCodes.BAD_REQUEST,
//       "Some children do not belong to you"
//     );
//   }

//   // Add children to carpool (avoid duplicates)
//   const existingChildren = carpool.childrens || [];
//   const newChildren = childrenIds.filter(
//     (childId) =>
//       !existingChildren.some((existing) => existing.toString() === childId)
//   ); 
//   console.time("Adding children to carpool");
   
//   const updatedCarpool = await Carpool.findByIdAndUpdate(
//     carpoolId,
//     {
//       $addToSet: { childrens: { $each: newChildren } },
//     },
//     { new: true }
//   ).populate([
//     { path: "createdBy", select: "firstName lastName email" },
//     { path: "members", select: "firstName lastName email" },
//     { path: "driver", select: "firstName lastName email" },
//     { path: "childrens", select: "firstName lastName age parentId" },
//   ]);
//   console.timeEnd("Adding children to carpool");
//   // Update cache
//   await CarpoolCacheManage.updateCarpoolCache(carpoolId);
//   return updatedCarpool as TCarpool;
// };


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
    })
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
    carpool.members.some(member => member.equals(userObjectId)) ||
    carpool.createdBy.equals(userObjectId);

  if (!isMember) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not a member of this carpool"
    );
  }

  // Check if any dependents are not children
  if (userDependents.some(dep => dep.tag !== "children")) {
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
    CarpoolCacheManage.updateCarpoolCache(carpoolId).catch(err => 
      console.error('Cache update failed:', err)
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
  CarpoolCacheManage.updateCarpoolCache(carpoolId).catch(err => 
    console.error('Cache update failed:', err)
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
  const userDependents = await Dependents.find({     //! 2nd operation
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

export const carpoolService = {
  createCarpool,
  getAllCarpools,
  getCarpoolById,
  getCarpoolsByUser,
  updateCarpool,
  deleteCarpool,
  addChildrenToCarpool,
  removeChildrenFromCarpool,
};
