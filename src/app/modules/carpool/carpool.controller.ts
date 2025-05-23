import { Request, Response } from "express";
import { carpoolService } from "./carpool.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";

const createCarpool = catchAsync(async (req: Request, res: Response) => {
  const carpoolData = req.body;
  const result = await carpoolService.createCarpool(carpoolData);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Carpool created successfully",
    data: result,
  });
});

export const carpoolController = {
  createCarpool,
};
