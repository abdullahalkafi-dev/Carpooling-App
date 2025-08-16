import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import UserCacheManage from "./user.cacheManage";
import { TReturnUser, TUser } from "./user.interface";
import { User } from "./user.model";
import { AuthService } from "../auth/auth.service";
import { Address } from "../address/address.model";
import { unlinkFileSync } from "../../../shared/unlinkFile";

const createUser = async (user: Partial<TUser>): Promise<Partial<TUser>> => {
  const existingUser = await User.findOne({ email: user.email });
  if (existingUser?.verified === false) {
    //delete the existing user
    await User.findByIdAndDelete(existingUser._id);
  }
  // Check if the user already exists
  if (existingUser && existingUser.verified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User already exists");
  }

  const address = await Address.create({
    address: user.address,
    location: {
      type: "Point",
      coordinates: [user.longitude, user.latitude],
    },
  });
  if (!address) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Address creation failed"
    );
  }

  const userData = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: user.password,
    role: "USER",
    address: address._id,
  };

  const newUser = await User.create(userData);
  if (!newUser) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "User creation failed"
    );
  }
  await AuthService.resendOtp(newUser.email);

  await UserCacheManage.updateUserCache(newUser._id.toString());
  return newUser;
};
const getAllUsers = async (
  query: Record<string, unknown>
): Promise<TReturnUser.getAllUser> => {
  const cached = await UserCacheManage.getCacheListWithQuery(query);
  if (cached) return cached;

  const userQuery = new QueryBuilder(User.find(), query)
    .search(["firstName", "lastName", "email"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();

  await UserCacheManage.setCacheListWithQuery(query, { result, meta });

  return { result, meta };
};
const getUserById = async (
  id: string
): Promise<Partial<TReturnUser.getSingleUser>> => {
  // First, try to retrieve the user from cache.
  const cachedUser = await UserCacheManage.getCacheSingleUser(id);
  if (cachedUser) return cachedUser;
  // If not cached, query the database using lean with virtuals enabled.
  const user = await User.findById(id).populate("address").lean({
    virtuals: true,
  });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  // Cache the freshly retrieved user data.
  await UserCacheManage.setCacheSingleUser(id, user);
  return user;
};
const updateUser = async (
  id: string,
  updateData: Partial<TReturnUser.updateUser>
): Promise<Partial<TReturnUser.updateUser>> => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (updateData.image && user.image) {
        unlinkFileSync(user.image);
  }

  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  if (!updatedUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User update failed");
  }
  //remove cache
  await UserCacheManage.updateUserCache(id);

  //set new cache
  UserCacheManage.setCacheSingleUser(id, updatedUser);
  return updatedUser;
};
const updateUserActivationStatus = async (
  id: string,
  status: "active" | "delete"
): Promise<TReturnUser.updateUserActivationStatus> => {
  console.log(status);
  console.log(id);

  const user = await User.findByIdAndUpdate(
    id,
    { status: status },
    { new: true }
  );
  console.log(user);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  //remove cache
  await UserCacheManage.updateUserCache(id);

  //set new cache
  // UserCacheManage.setCacheSingleUser(id, user);
  return user;
};
const updateUserRole = async (
  id: string,
  role: "USER" | "ADMIN"
): Promise<Partial<TReturnUser.updateUserRole>> => {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { role } },
    { new: true }
  );
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  //remove cache
  await UserCacheManage.updateUserCache(id);

  //set new cache
  // UserCacheManage.setCacheSingleUser(id, user);
  return user;
};

const getMe = async (
  userId: string
): Promise<Partial<TReturnUser.getSingleUser>> => {
  // First, try to retrieve the user from cache.
  const cachedUser = await UserCacheManage.getCacheSingleUser(userId);
  if (cachedUser) return cachedUser;

  // If not cached, query the database using lean with virtuals enabled.
  const user = await User.findById(userId).populate("address").lean({
    virtuals: true,
  });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  // Cache the freshly retrieved user data.
  await UserCacheManage.setCacheSingleUser(userId, user);
  return user;
};

export const UserServices = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserActivationStatus,
  updateUserRole,
  getMe,
};
