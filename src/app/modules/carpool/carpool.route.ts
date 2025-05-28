import express, { Router } from "express";
import { carpoolController } from "./carpool.controller";
import { CarpoolValidation } from "./carpool.validation";
import { CarpoolInvitationController } from "./carpoolInvitation.controller";
import { CarpoolInvitationValidation } from "./carpoolInvitation.validation";
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

// ========== CARPOOL INVITATION ROUTES ==========

// Invite contacts to carpool
router.post(
  "/invite",
  auth(USER_ROLES.USER),
  validateRequest(CarpoolInvitationValidation.inviteToCarpool),
  CarpoolInvitationController.inviteToCarpool
);

// Respond to carpool invitation
router.patch(
  "/invitation/:invitationId/respond",
  auth(USER_ROLES.USER),
  validateRequest(CarpoolInvitationValidation.respondToInvitation),
  CarpoolInvitationController.respondToInvitation
);

// Get my received invitations
router.get(
  "/invitations/received",
  auth(USER_ROLES.USER),
  CarpoolInvitationController.getMyInvitations
);

// Get my sent invitations
router.get(
  "/invitations/sent",
  auth(USER_ROLES.USER),
  CarpoolInvitationController.getSentInvitations
);

// Get invitations for a specific carpool
router.get(
  "/:carpoolId/invitations",
  auth(USER_ROLES.USER),
  CarpoolInvitationController.getInvitationsForCarpool
);

export const CarpoolRoutes: Router = router;
