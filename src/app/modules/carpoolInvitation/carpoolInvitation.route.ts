import express, { Router } from "express";
import { CarpoolInvitationController } from "./carpoolInvitation.controller";
import { CarpoolInvitationValidation } from "./carpoolInvitation.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../user/user.constant";

const router = express.Router();

// Invite contacts to carpool
router.post(
  "/invite",
  auth(USER_ROLES.USER),
  validateRequest(CarpoolInvitationValidation.inviteToCarpool),
  CarpoolInvitationController.inviteToCarpool
);

// Respond to carpool invitation
router.patch(
  "/:invitationId/respond",
  auth(USER_ROLES.USER),
  validateRequest(CarpoolInvitationValidation.respondToInvitation),
  CarpoolInvitationController.respondToInvitation
);

// Get my received invitations
router.get(
  "/received",
  auth(USER_ROLES.USER),
  CarpoolInvitationController.getMyInvitations
);

// Get my sent invitations
router.get(
  "/sent",
  auth(USER_ROLES.USER),
  CarpoolInvitationController.getSentInvitations
);

// Get invitations for a specific carpool
router.get(
  "/carpool/:carpoolId",
  auth(USER_ROLES.USER),
  CarpoolInvitationController.getInvitationsForCarpool
);

export const CarpoolInvitationRoutes: Router = router;
