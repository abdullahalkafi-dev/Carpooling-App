import express, { Router } from "express";
import { UserController } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidation } from "./user.validation";

const router = express.Router();

// User routes
router.post(
  "/",
  validateRequest(UserValidation.createUser),
  UserController.createUser
);
router.get("/", UserController.getAllUsers);
router.get("/:id", UserController.getUserById);
router.patch(
  "/:id",
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
