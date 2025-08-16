import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import DependentCacheManage from "./dependents.cacheManage";
import { TDependent, TReturnDependent } from "./dependents.interface";
import { Dependents } from "./dependents.model";
import { User } from "../user/user.model";
import unlinkFile from "../../../shared/unlinkFile";
import { Types } from "mongoose";
import { Carpool } from "../carpool/carpool.model";

const createDependent = async (
  dependent: TDependent
): Promise<Partial<TDependent>> => {
  //check if parent is exists
  const isParentExists = await User.findById(dependent.parentId);
  if (!isParentExists) {
    throw new AppError(StatusCodes.NOT_FOUND, "Parent not found");
  }
  const newDependent = await Dependents.create(dependent);
  await DependentCacheManage.updateDependentCache(
    newDependent._id.toString(),
    dependent.parentId.toString()
  );
  return newDependent;
};
const getAllDependents = async (
  query: Record<string, unknown>
): Promise<TReturnDependent.getAllDependent> => {
  const cached = await DependentCacheManage.getCacheListWithQuery(query);
  if (cached) return cached;

  const dependentQuery = new QueryBuilder(Dependents.find(), query)
    .search(["firstName", "lastName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await dependentQuery.modelQuery;
  console.log(result);
  const meta = await dependentQuery.countTotal();

  await DependentCacheManage.setCacheListWithQuery(query, { result, meta });

  return { result, meta };
};
const getDependentById = async (
  id: string
): Promise<Partial<TReturnDependent.getSingleDependent>> => {
  // First, try to retrieve the dependents from cache.
  const cachedDependent = await DependentCacheManage.getCacheSingleDependent(
    id
  );
  if (cachedDependent) return cachedDependent;

  // If not cached, query the database using lean with virtuals enabled.
  const dependents = await Dependents.findById(id);

  if (!dependents) {
    throw new AppError(StatusCodes.NOT_FOUND, "Dependents not found");
  }

  // Cache the freshly retrieved dependents data.
  await DependentCacheManage.setCacheSingleDependent(id, dependents);
  return dependents;
};

const getDependentByParentId = async (
  parentId: string
): Promise<Partial<TReturnDependent.getDependentByParentId>> => {
  // First, try to retrieve the dependents from cache.
  const cachedDependent =
    await DependentCacheManage.getCacheDependentByParentId(parentId);
  if (cachedDependent) return cachedDependent;
  const isParentExists = await User.findById(parentId);
  if (!isParentExists) {
    throw new AppError(StatusCodes.NOT_FOUND, "Parent not found");
  }

  // If not cached, query the database using lean with virtuals enabled.
  const dependents = await Dependents.find({ parentId });

  if (!dependents) {
    throw new AppError(StatusCodes.NOT_FOUND, "Dependents not found");
  }

  // Cache the freshly retrieved dependents data.
  await DependentCacheManage.setCacheDependentByParentId(parentId, dependents);
  return dependents;
};
const updateDependent = async (
  id: string,
  updateData: Partial<TReturnDependent.updateDependent>
): Promise<Partial<TReturnDependent.updateDependent>> => {
  console.log("inside", updateData);

  let oldImage: string | undefined;

  if (updateData.image) {
    const existing = await Dependents.findById(id).select("image");
    if (!existing) {
      throw new AppError(StatusCodes.NOT_FOUND, "Dependents not found");
    }
    oldImage = existing.image;
  }

  const updatedDependent = await Dependents.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  if (!updatedDependent) {
    throw new AppError(StatusCodes.NOT_FOUND, "Dependents update failed");
  }

  if (updateData.image && oldImage && oldImage !== updateData.image) {
    try {
      await unlinkFile(oldImage);
    } catch (error) {
      console.error("Failed to delete old image:", error);
    }
  }

  await DependentCacheManage.updateDependentCache(id);

  return updatedDependent;
};
const deleteDependent = async (id: string): Promise<void> => {
  // Validate if the id is a valid ObjectId
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid ID format");
  }

  // Check if the dependent exists
  const existingDependent = await Dependents.findById(id);
  if (!existingDependent) {
    throw new AppError(StatusCodes.NOT_FOUND, "Dependent not found");
  }

  await Dependents.findByIdAndDelete(id);
  //remove children from carpools
  await Carpool.updateMany({ childrens: id }, { $pull: { childrens: id } });

  await DependentCacheManage.updateDependentCache(id);
};

export const DependentServices = {
  createDependent,
  getAllDependents,
  getDependentById,
  updateDependent,
  getDependentByParentId,
  deleteDependent
};
