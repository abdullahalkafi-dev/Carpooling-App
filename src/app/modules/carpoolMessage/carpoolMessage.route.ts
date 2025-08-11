import { Router } from "express";
import { CarpoolMessageControllers } from "./carpoolMessage.controller";
import validateRequest from "../../middlewares/validateRequest";
import { CarpoolMessageValidation } from "./carpoolMessage.validation";
import fileUploadHandler from "../../middlewares/fileUploadHandler";

const router = Router();

// Get carpool messages
router.get("/carpool/:carpoolId/messages", CarpoolMessageControllers.getCarpoolMessages);

// Get carpool members
router.get("/carpool/:carpoolId/members", CarpoolMessageControllers.getCarpoolMembers);

// Create carpool message
router.post(
  "/carpool/message",
  validateRequest(CarpoolMessageValidation.createCarpoolMessage),
  CarpoolMessageControllers.createCarpoolMessage
);

// Create carpool message with image
router.post(
  "/carpool/message-with-image",
  fileUploadHandler,
  validateRequest(CarpoolMessageValidation.createCarpoolMessage),
  CarpoolMessageControllers.createCarpoolMessageWithImage
);

export const CarpoolMessageRoutes: Router = router;
