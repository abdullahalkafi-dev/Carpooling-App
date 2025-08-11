import express, { Router } from "express";
import { carpoolController } from "./carpool.controller";
import { CarpoolValidation } from "./carpool.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../user/user.constant";
import { CarpoolInvitationController } from "../carpoolInvitation/carpoolInvitation.controller";

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

// Get driver location for a carpool
router.get("/:carpoolId/driver-location", carpoolController.getDriverLocation);

// Update driver of a carpool
router.patch(
  "/:carpoolId/update-driver",
  auth(USER_ROLES.USER),
  carpoolController.updateDriver
);


// Add children to carpool (for members)
router.patch(
  "/:carpoolId/add-children",
  auth(USER_ROLES.USER),
  validateRequest(CarpoolValidation.addChildrenToCarpool),
  carpoolController.addChildrenToCarpool
);

// Remove children from carpool (for members)
router.patch(
  "/:carpoolId/remove-children",
  auth(USER_ROLES.USER),
  validateRequest(CarpoolValidation.removeChildrenFromCarpool),
  carpoolController.removeChildrenFromCarpool
);

router.patch("/:carpoolId/remove-user",auth(),carpoolController.removeUserFromCarpool);


// Update a carpool
router.patch(
  "/:id",
  validateRequest(CarpoolValidation.updateCarpool),
  carpoolController.updateCarpool
);

// Delete a carpool
router.delete("/:id", carpoolController.deleteCarpool);

export const CarpoolRoutes: Router = router;
