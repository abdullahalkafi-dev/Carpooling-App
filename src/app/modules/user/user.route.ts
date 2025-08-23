import express, { Router } from "express";
import { UserController } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidation } from "./user.validation";
import fileUploadHandler from "../../middlewares/fileUploadHandler";
import auth from "../../middlewares/auth";

const router = express.Router();

// User routes
router.post(
  "/",
  validateRequest(UserValidation.createUser),
  UserController.createUser
);
router.get("/", UserController.getAllUsers);
router.get("/me", auth(),UserController.getMe);
router.get("/:id", UserController.getUserById);
router.patch(
  "/fcm-token",
  auth(),
  validateRequest(UserValidation.updateFcmToken),
  UserController.updateFcmToken
);
router.patch(
  "/:id", 
  fileUploadHandler,
  validateRequest(UserValidation.updateUser),
  UserController.updateUser
);
router.patch(
  "/:id/status",
  validateRequest(UserValidation.updateUserActivationStatus),
  UserController.updateUserActivationStatus
);
router.patch(
  "/:id/role",
  validateRequest(UserValidation.updateUserRole),
  UserController.updateUserRole
);

export const UserRoutes: Router = router;
