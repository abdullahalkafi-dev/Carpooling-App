import { Types } from "mongoose";
import { QueryBuilder } from "../../builder/QueryBuilder";
import { TCarpool, TReturnCarpool } from "./carpool.interface";
import { Carpool } from "./carpool.model";
import { carpoolValidator } from "./carpool.utils";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import CarpoolCacheManage from "./carpool.cacheManage";

const createCarpool = async (payload: Partial<TCarpool>) => {
  // Validate the payload using the carpoolValidator function
  carpoolValidator(payload);
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
        select: "firstName lastName image",
      },
      {
        path: "childrens",
        select: "firstName lastName image tag parentId",
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
        select: "firstName lastName image",
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
    data: result,
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

export const carpoolService = {
  createCarpool,
  getAllCarpools,
  getCarpoolById,
  getCarpoolsByUser,
  updateCarpool,
  deleteCarpool,
};
