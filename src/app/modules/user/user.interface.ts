import { Model, Types } from "mongoose";

export type TUser = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "ADMIN" | "USER";
  phoneNumber?: string;
  image?: string;
  status: "active" | "delete";
  verified?: boolean;
  fcmToken?: string;
  address?: Types.ObjectId[];
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: string;
    expireAt: Date;
  };
  passwordChangedAt?: Date;
};
export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isExistUserByPhnNum(phnNum: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
  isJWTIssuedBeforePasswordChanged(
    passwordChangedTimestamp: Date,
    jwtIssuedTimestamp: number
  ): boolean;
} & Model<TUser>;

export namespace TReturnUser {
  export type Meta = {
    page: number;
    limit: number;
    totalPage: number;
    total: number;
  };

  export type getAllUser = {
    result: TUser[];
    meta?: Meta;
  };

  export type getSingleUser = TUser;
  export type updateUser = TUser;
  export type updateUserActivationStatus = TUser;

  export type updateUserRole = TUser;

  export type deleteUser = TUser;
}
