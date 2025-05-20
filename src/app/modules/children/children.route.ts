import express, { Router } from "express";
import { ChildrenController } from "./children.controller";
import validateRequest from "../../middlewares/validateRequest";
import { ChildrenValidation } from "./children.validation";
import fileUploadHandler from "../../middlewares/fileUploadHandler";

const router = express.Router();

// Children routes
router.post(
  "/",
  fileUploadHandler,
  validateRequest(ChildrenValidation.createChildren),
  ChildrenController.createChild   // Changed from createChildren to match controller
);
router.get("/", ChildrenController.getAllChildrens);
router.get("/:id", ChildrenController.getChildrenById);
router.get("/parent/:parentId", ChildrenController.getChildrenByParentId); // New route
router.patch(
  "/:id",
  fileUploadHandler,
  // validateRequest(ChildrenValidation.updateChildren),
  ChildrenController.updateChildren
);

export const ChildrenRoutes: Router = router;
