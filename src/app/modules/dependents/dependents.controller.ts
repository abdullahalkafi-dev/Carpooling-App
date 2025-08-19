import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { DependentServices } from "./dependents.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { unlinkSync } from "fs";
import AppError from "../../errors/AppError";

const createDependent = catchAsync(async (req: Request, res: Response) => {
  let image = null;
  try {
    const dependentJson = JSON.parse(req.body.data);
    image = null;
    if (req.files && "image" in req.files && req.files.image[0]) {
      image = `/images/${req.files.image[0].filename}`;
    }
    const dependentData = {
      ...dependentJson,
      image: image,
    };
    const dependent = await DependentServices.createDependent(dependentData);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Dependent created successfully",
      data: dependent,
    });
  } catch (e) {

    image && unlinkSync(`uploads/${image}`); // Delete the image i f an error occurs
    throw new AppError((e as any).statusCode || StatusCodes.INTERNAL_SERVER_ERROR,(e as any).message || "Failed to create dependent");
    // throw new AppError(e.status, e.message);
  }
});

const getAllDependents = catchAsync(async (req: Request, res: Response) => {
  const dependentsRes = await DependentServices.getAllDependents(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dependents retrieved successfully",
    data: dependentsRes.result,
    meta: dependentsRes.meta,
  });
});

const getDependentById = catchAsync(async (req: Request, res: Response) => {
  const dependent = await DependentServices.getDependentById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dependent retrieved successfully",
    data: dependent,
  });
});

const getDependentByParentId = catchAsync(
  async (req: Request, res: Response) => {
    const dependents = await DependentServices.getDependentByParentId(
      req.params.parentId
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Dependents retrieved successfully",
      data: dependents,
    });
  }
);

const updateDependent = catchAsync(async (req: Request, res: Response) => {
  const dependentJson = JSON.parse(req.body.data);
  let image = null;
  if (req.files && "image" in req.files && req.files.image[0]) {
    image = `/images/${req.files.image[0].filename}`;
  }
  const dependentData = {
    ...dependentJson,
    image: image,
  };
  if (dependentData.image === null) {
    delete dependentData.image;
  }

  const dependent = await DependentServices.updateDependent(
    req.params.id,
    dependentData
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dependent updated successfully",
    data: dependent,
  });
});
const deleteDependent = catchAsync(async (req: Request, res: Response) => {
   console.log(req.params.id,"user id");
  await DependentServices.deleteDependent(req.params.id);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dependent deleted successfully",
    data:null
  });
});
export const DependentController = {
  createDependent,
  getAllDependents,
  getDependentById,
  getDependentByParentId,
  updateDependent,
  deleteDependent
};
