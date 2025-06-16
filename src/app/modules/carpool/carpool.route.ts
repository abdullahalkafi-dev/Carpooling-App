import express, { Router } from "express";
import { carpoolController } from "./carpool.controller";
import { CarpoolValidation } from "./carpool.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../user/user.constant";

const router = express.Router();

// Create a carpool
router.post(
  "/",
  validateRequest(CarpoolValidation.createCarpool),
  carpoolController.createCarpool
);

// Get all carpools (with filtering/pagination)
router.get("/", carpoolController.getAllCarpools);

// Get carpools by user ID
router.get("/user/:userId", carpoolController.getCarpoolsByUser);

// Get a single carpool by ID
router.get("/:id", carpoolController.getCarpoolById);

// Update a carpool
router.patch(
  "/:id",
  validateRequest(CarpoolValidation.updateCarpool),
  carpoolController.updateCarpool
);

// Delete a carpool
router.delete("/:id", carpoolController.deleteCarpool);

export const CarpoolRoutes: Router = router;
