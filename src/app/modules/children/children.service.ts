import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import ChildrenCacheManage from "./children.cacheManage";
import { TChildren, TReturnChildren } from "./children.interface";
import { Children } from "./children.model";
import { User } from "../user/user.model";
import unlinkFile from "../../../shared/unlinkFile";

const createChild = async (child: TChildren): Promise<Partial<TChildren>> => {
  //check if parent is exists
  const isParentExists = await User.findById(child.parentId);
  if (!isParentExists) {
    throw new AppError(StatusCodes.NOT_FOUND, "Parent not found");
  }
  const newChild = await Children.create(child);
  await ChildrenCacheManage.updateChildrenCache(
    newChild._id.toString(),
    child.parentId.toString()
  );
  return newChild;
};
const getAllChildrens = async (
  query: Record<string, unknown>
): Promise<TReturnChildren.getAllChildren> => {
  const cached = await ChildrenCacheManage.getCacheListWithQuery(query);
  if (cached) return cached;

  const childrenQuery = new QueryBuilder(Children.find(), query)
    .search(["firstName", "lastName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await childrenQuery.modelQuery;
  console.log(result);
  const meta = await childrenQuery.countTotal();

  await ChildrenCacheManage.setCacheListWithQuery(query, { result, meta });

  return { result, meta };
};
const getChildrenById = async (
  id: string
): Promise<Partial<TReturnChildren.getSingleChildren>> => {
  // First, try to retrieve the children from cache.
  const cachedChildren = await ChildrenCacheManage.getCacheSingleChildren(id);
  if (cachedChildren) return cachedChildren;

  // If not cached, query the database using lean with virtuals enabled.
  const children = await Children.findById(id);

  if (!children) {
    throw new AppError(StatusCodes.NOT_FOUND, "Children not found");
  }

  // Cache the freshly retrieved children data.
  await ChildrenCacheManage.setCacheSingleChildren(id, children);
  return children;
};

const getChildrenByParentId = async (
  parentId: string
): Promise<Partial<TReturnChildren.getChildrenByParentId>> => {
  // First, try to retrieve the children from cache.
  const cachedChildren = await ChildrenCacheManage.getCacheChildrenByParentId(
    parentId
  );
  if (cachedChildren) return cachedChildren;
  const isParentExists = await User.findById(parentId);
  if (!isParentExists) {
    throw new AppError(StatusCodes.NOT_FOUND, "Parent not found");
  }

  // If not cached, query the database using lean with virtuals enabled.
  const children = await Children.find({ parentId });

  if (!children) {
    throw new AppError(StatusCodes.NOT_FOUND, "Children not found");
  }

  // Cache the freshly retrieved children data.
  await ChildrenCacheManage.setCacheChildrenByParentId(parentId, children);
  return children;
};
const updateChildren = async (
  id: string,
  updateData: Partial<TReturnChildren.updateChildren>
): Promise<Partial<TReturnChildren.updateChildren>> => {
  console.log("inside", updateData);

  let oldImage: string | undefined;

  if (updateData.image) {
    const existing = await Children.findById(id).select("image");
    if (!existing) {
      throw new AppError(StatusCodes.NOT_FOUND, "Children not found");
    }
    oldImage = existing.image;
  }

  const updatedChild = await Children.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  if (!updatedChild) {
    throw new AppError(StatusCodes.NOT_FOUND, "Children update failed");
  }

  if (updateData.image && oldImage && oldImage !== updateData.image) {
    try {
      await unlinkFile(oldImage);
    } catch (error) {
      console.error("Failed to delete old image:", error);
    }
  }

  await ChildrenCacheManage.updateChildrenCache(id);

  return updatedChild;
};


export const ChildrenServices = {
  createChild,
  getAllChildrens,
  getChildrenById,
  updateChildren,
  getChildrenByParentId,
};
