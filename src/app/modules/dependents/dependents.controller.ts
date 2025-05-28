import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { DependentServices } from "./dependents.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

const createDependent = catchAsync(async (req: Request, res: Response) => {
  const dependentData = JSON.parse(req.body.data);
 let image = null;
 if (req.files && "image" in req.files && req.files.image[0]) {
  image = `/images/${req.files.image[0].filename}`;
}
  const cependentData = {
    ...dependentData,
    image: image,
  };
  const cependent = await DependentServices.createDependent(cependentData);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Dependent created successfully",
    data: cependent,
  });
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
  const cependent = await DependentServices.getDependentById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dependent retrieved successfully",
    data: cependent,
  });
});

const getDependentByParentId = catchAsync(async (req: Request, res: Response) => {
  const dependents = await DependentServices.getDependentByParentId(req.params.parentId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dependents retrieved successfully",
    data: dependents,
  });
});

const updateDependent = catchAsync(async (req: Request, res: Response) => {

  const dependentData = JSON.parse(req.body.data);
 let image = null;
 if (req.files && "image" in req.files && req.files.image[0]) {
  image = `/images/${req.files.image[0].filename}`;
}
  const cependentData = {
    ...dependentData,
    image: image,
  };
  if (cependentData.image === null) {
    delete cependentData.image;
  }




  const cependent = await DependentServices.updateDependent(req.params.id,cependentData);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dependent updated successfully",
    data: cependent,
  });
});

export const DependentController = {
  createDependent,
  getAllDependents,
  getDependentById,
  getDependentByParentId,
  updateDependent,
};
