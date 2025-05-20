import express, { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import { USER_ROLES } from "../user/user.constant";
const router = express.Router();

router.post(
  "/login",
  validateRequest(AuthValidation.Login),
  AuthController.loginUser
);
router.post(
  "/forgot-password",
  validateRequest(AuthValidation.createForgetPassword),
  AuthController.forgetPassword
);
router.post(
  "/verify-email",
  validateRequest(AuthValidation.createVerifyEmail),
  AuthController.verifyEmail
);
router.post(
  "/reset-password",
  validateRequest(AuthValidation.createResetPassword),
  AuthController.resetPassword
);
router.delete(
  "/delete-account",
  // auth(USER_ROLES.USER),
  AuthController.deleteAccount
);
router.post(
  "/change-password",
  auth(USER_ROLES.ADMIN, USER_ROLES.USER),
  validateRequest(AuthValidation.createChangePassword),
  AuthController.changePassword
);
export const AuthRoutes: Router = router;
