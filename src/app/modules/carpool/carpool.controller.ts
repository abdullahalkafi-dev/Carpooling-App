import { Request, Response } from "express";
import { carpoolService } from "./carpool.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";

// Create a new carpool
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

// Get all carpools with filtering and pagination
const getAllCarpools = catchAsync(async (req: Request, res: Response) => {
  const result = await carpoolService.getAllCarpools(req.query);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Carpools retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

// Get a single carpool by ID
const getCarpoolById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await carpoolService.getCarpoolById(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Carpool retrieved successfully",
    data: result,
  });
});

// Get all carpools by user ID
const getCarpoolsByUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
    console.log(userId);

  const result = await carpoolService.getCarpoolsByUser(userId, req.query);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User's carpools retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// Update a carpool
const updateCarpool = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const result = await carpoolService.updateCarpool(id, updateData);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Carpool updated successfully",
    data: result,
  });
});

// Delete a carpool
const deleteCarpool = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await carpoolService.deleteCarpool(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Carpool deleted successfully",
    data: result,
  });
});
const addChildrenToCarpool = catchAsync(async (req: Request, res: Response) => {
  const { carpoolId } = req.params;
  const { childrenIds } = req.body;
  const userId = req.user?.id;

  const result = await carpoolService.addChildrenToCarpool(
    carpoolId,
    userId,
    childrenIds
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Children added to carpool successfully",
    data: result,
  });
});

const removeChildrenFromCarpool = catchAsync(async (req: Request, res: Response) => {
  const { carpoolId } = req.params;
  const { childrenIds } = req.body;
  const userId = req.user?.id;

  const result = await carpoolService.removeChildrenFromCarpool(
    carpoolId,
    userId,
    childrenIds
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Children removed from carpool successfully",
    data: result,
  });
});

export const carpoolController = {
  createCarpool,
  getAllCarpools,
  getCarpoolById,
  getCarpoolsByUser,
  updateCarpool,
  deleteCarpool,
  addChildrenToCarpool,
  removeChildrenFromCarpool
};
