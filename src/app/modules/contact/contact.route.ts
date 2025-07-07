import express, { Router } from "express";
import { ContactController } from "./contact.controller";
import { ContactValidation } from "./contact.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../user/user.constant";

const router = express.Router();

// Send friend request
router.post(
  "/send-request",
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(ContactValidation.sendContactRequest),
  ContactController.sendContactRequest
);

// Respond to friend request (accept/block)
router.patch(
  "/respond/:requestId",
  auth(USER_ROLES.USER),
  validateRequest(ContactValidation.respondToContactRequest),
  ContactController.respondToContactRequest
);

// Get my contacts (friends list)
router.get(
  "/my-contacts",
  auth(USER_ROLES.USER),
  ContactController.getMyContacts
);

// Get pending requests received
router.get(
  "/pending-requests",
  auth(USER_ROLES.USER),
  ContactController.getPendingRequests
);

// Get sent requests
router.get(
  "/sent-requests",
  auth(USER_ROLES.USER),
  ContactController.getSentRequests
);

// Remove contact (unfriend)
router.delete(
  "/:contactId",
  auth(USER_ROLES.USER),
  ContactController.removeContact
);

// Get contacts available for carpool invitation
router.get(
  "/invitation-contacts",
  auth(USER_ROLES.USER),
  ContactController.getContactsForInvitation
);

// Block/Unblock contact
router.patch(
  "/block-unblock/:contactId",
  auth(USER_ROLES.USER),
  validateRequest(ContactValidation.blockUnblockContact),
  ContactController.blockUnblockContact
);

export const ContactRoutes: Router = router;
