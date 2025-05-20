import { StatusCodes } from "http-status-codes";
import { JwtPayload, Secret } from "jsonwebtoken";
import config from "../../../config";
import { emailHelper } from "../../../helpers/emailHelper";
import { jwtHelper } from "../../../helpers/jwtHelper";
import { emailTemplate } from "../../../shared/emailTemplate";
import cryptoToken from "../../../util/cryptoToken";
import generateOTP from "../../../util/generateOTP";
import { User } from "../user/user.model";
import AppError from "../../errors/AppError";
import { ResetToken } from "../resetToken/userResetToken.model";
import bcrypt from "bcryptjs";
import {
  TAuthResetPassword,
  TChangePassword,
  TLoginData,
  TVerifyEmail,
} from "../../../types/auth";
import { TUser } from "../user/user.interface";
import UserCacheManage from "../user/user.cacheManage";
//login
const loginUserFromDB = async (payload: Partial<TLoginData>) => {
  const { email, password } = payload;
  console.log(payload);
  if (!password) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Password is required");
  }

  const isExistUser = await User.findOne({ email }).select("+password");
  console.log(isExistUser);
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //check user status
  if (isExistUser.status === "delete") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Your account has been deleted, Please contact with admin"
    );
  }

  //check match password
  if (
    password &&
    !(await User.isMatchPassword(password, isExistUser.password))
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Password is incorrect!");
  }

  //create token
  const accessToken = jwtHelper.createToken(
    { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
    config.jwt.jwt_secret as Secret,
    "100y"
  );

  const { password: _, ...userWithoutPassword } = isExistUser.toObject();

  return { accessToken, user: userWithoutPassword };
};

const forgetPasswordToDB = async (email: string) => {
  const isExistUser: Partial<TUser> = await User.isExistUserByEmail(email);
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //send mail
  const otp = generateOTP();
  console.log(otp, "otp");
  const value = {
    otp,
    email: isExistUser.email,
    name: isExistUser.firstName!,
    theme: "theme-red" as
      | "theme-green"
      | "theme-red"
      | "theme-purple"
      | "theme-orange"
      | "theme-blue",
    expiresIn: 15,
  };
  const forgetPassword = emailTemplate.resetPassword(value);

  emailHelper.sendEmail(forgetPassword);

  //save to DB
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 15 * 60000),
  };

  await User.findOneAndUpdate({ email }, { $set: { authentication } });
};

//verify email
const verifyEmailToDB = async (payload: TVerifyEmail) => {
  const { email, oneTimeCode } = payload;
  console.log(oneTimeCode, "new code");
  const isExistUser = await User.findOne({ email }).select("+authentication");
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (!oneTimeCode) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Please give the otp, check your email we send a code"
    );
  }
  console.log(isExistUser.authentication?.oneTimeCode, "old code");
  if (isExistUser.authentication?.oneTimeCode !== oneTimeCode) {
    throw new AppError(StatusCodes.BAD_REQUEST, "You provided wrong otp");
  }

  const date = new Date();
  if (date > isExistUser.authentication?.expireAt) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Otp already expired, Please try again"
    );
  }

  let message;
  let data;

  await User.findOneAndUpdate(
    { _id: isExistUser._id },
    {
      verified: true,
      authentication: {
        isResetPassword: true,
        oneTimeCode: null,
        expireAt: null,
      },
    }
  );

  //create token ;
  const createToken = cryptoToken();
  await ResetToken.create({
    user: isExistUser._id,
    token: createToken,
    expireAt: new Date(Date.now() + 15 * 60000),
  });
  message =
    "Verification Successful: Please securely store and utilize this code for reset password";
  data = createToken;

  return { data, message };
};

//forget password
const resetPasswordToDB = async (
  token: string,
  payload: TAuthResetPassword
) => {
  const { newPassword, confirmPassword } = payload;
  //isExist token
  const isExistToken = await ResetToken.isExistToken(token);
  if (!isExistToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized");
  }

  //user permission check
  const isExistUser = await User.findById(isExistToken.user).select(
    "+authentication"
  );
  if (!isExistUser?.authentication?.isResetPassword) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "You don't have permission to change the password. Please click again to 'Forgot Password'"
    );
  }

  //validity check
  const isValid = await ResetToken.isExpireToken(token);
  if (!isValid) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Token expired, Please click again to the forget password"
    );
  }

  //check password
  if (newPassword !== confirmPassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "New password and Confirm password doesn't match!"
    );
  }

  const hashPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  const updateData = {
    password: hashPassword,
    authentication: {
      isResetPassword: false,
    },
  };

  await User.findOneAndUpdate({ _id: isExistToken.user }, updateData, {
    new: true,
  });
};

const changePasswordToDB = async (
  user: JwtPayload,
  payload: TChangePassword
) => {
  const { currentPassword, newPassword, confirmPassword } = payload;
  const isExistUser = await User.findById(user.id).select("+password");
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //current password match
  if (
    currentPassword &&
    !(await User.isMatchPassword(currentPassword, isExistUser.password))
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Password is incorrect");
  }

  //newPassword and current password
  if (currentPassword === newPassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Please give different password from current password"
    );
  }
  //new password and confirm password check
  if (newPassword !== confirmPassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Password and Confirm password doesn't matched"
    );
  }

  //hash password
  const hashPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  const updateData = {
    password: hashPassword,
  };
  await User.findOneAndUpdate({ _id: user.id }, updateData, { new: true });

  const value = {
    receiver: isExistUser._id,
    text: "Your password changed successfully",
  };
};

const deleteAccountToDB = async (user: JwtPayload) => {
  const result = await User.findByIdAndUpdate(
    user.id,
    { isDeleted: true },
    { new: true }
  );
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "No User found");
  }
  await UserCacheManage.updateUserCache(user.id);

  return result;
};

export const AuthService = {
  verifyEmailToDB,
  loginUserFromDB,
  forgetPasswordToDB,
  resetPasswordToDB,
  changePasswordToDB,
  deleteAccountToDB,
};
