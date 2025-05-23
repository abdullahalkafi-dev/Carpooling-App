import express, { Router } from "express";
import { carpoolController } from "./carpool.controller";
import { CarpoolValidation } from "./carpool.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

router.post(
  "/",
  validateRequest(CarpoolValidation.createCarpool),
  carpoolController.createCarpool
);

export const carpoolRoutes: Router = router;
