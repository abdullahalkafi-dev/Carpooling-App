import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ChildrenServices } from "./children.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

const createChild = catchAsync(async (req: Request, res: Response) => {
  const childrenData = JSON.parse(req.body.data);
 let image = null;
 if (req.files && "image" in req.files && req.files.image[0]) {
  image = `/images/${req.files.image[0].filename}`;
}
  const childData = {
    ...childrenData,
    image: image,
  };
  const child = await ChildrenServices.createChild(childData);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Child created successfully",
    data: child,
  });
});

const getAllChildrens = catchAsync(async (req: Request, res: Response) => {
  const childrensRes = await ChildrenServices.getAllChildrens(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Children retrieved successfully",
    data: childrensRes.result,
    meta: childrensRes.meta,
  });
});

const getChildrenById = catchAsync(async (req: Request, res: Response) => {
  const child = await ChildrenServices.getChildrenById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Child retrieved successfully",
    data: child,
  });
});

const getChildrenByParentId = catchAsync(async (req: Request, res: Response) => {
  const children = await ChildrenServices.getChildrenByParentId(req.params.parentId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Children retrieved successfully",
    data: children,
  });
});

const updateChildren = catchAsync(async (req: Request, res: Response) => {

  const childrenData = JSON.parse(req.body.data);
 let image = null;
 if (req.files && "image" in req.files && req.files.image[0]) {
  image = `/images/${req.files.image[0].filename}`;
}
  const childData = {
    ...childrenData,
    image: image,
  };
  if (childData.image === null) {
    delete childData.image;
  }




  const child = await ChildrenServices.updateChildren(req.params.id,childData);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Child updated successfully",
    data: child,
  });
});

export const ChildrenController = {
  createChild,
  getAllChildrens,
  getChildrenById,
  getChildrenByParentId,
  updateChildren,
};
