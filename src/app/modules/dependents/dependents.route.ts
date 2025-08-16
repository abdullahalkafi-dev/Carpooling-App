import express, { Router } from "express";
import { DependentController } from "./dependents.controller";
import validateRequest from "../../middlewares/validateRequest";
import { DependentValidation } from "./dependents.validation";
import fileUploadHandler from "../../middlewares/fileUploadHandler";
import auth from "../../middlewares/auth";

const router = express.Router();

// Dependents routes
router.post(
  "/",
  fileUploadHandler,
  validateRequest(DependentValidation.createDependent),
  DependentController.createDependent   
);
router.get("/", DependentController.getAllDependents);
router.get("/:id", DependentController.getDependentById);
router.get("/parent/:parentId", DependentController.getDependentByParentId); // New route
router.patch(
  "/:id",
  fileUploadHandler,
  // validateRequest(DependentValidation.updateDependent),
  DependentController.updateDependent
);
router.delete("/:id", auth(),DependentController.deleteDependent); 

export const DependentRoutes: Router = router;
