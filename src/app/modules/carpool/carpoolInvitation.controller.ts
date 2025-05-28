import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CarpoolInvitationServices } from "./carpoolInvitation.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

const inviteToCarpool = catchAsync(async (req: Request, res: Response) => {
  const { carpoolId, inviteeIds, message } = req.body;
  const inviterId = req.user.id;

  const invitations = await CarpoolInvitationServices.inviteToCarpool(
    inviterId,
    carpoolId,
    inviteeIds,
    message
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: `Successfully sent ${invitations.length} invitation(s)`,
    data: invitations,
  });
});

const respondToInvitation = catchAsync(async (req: Request, res: Response) => {
  const { invitationId } = req.params;
  const { status } = req.body;
  const inviteeId = req.user.id;

  const invitation = await CarpoolInvitationServices.respondToInvitation(
    invitationId,
    inviteeId,
    status
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Invitation ${status} successfully`,
    data: invitation,
  });
});

const getMyInvitations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const invitations = await CarpoolInvitationServices.getMyInvitations(userId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Invitations retrieved successfully",
    data: invitations.result,
    meta: invitations.meta,
  });
});

const getSentInvitations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const invitations = await CarpoolInvitationServices.getSentInvitations(userId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sent invitations retrieved successfully",
    data: invitations.result,
    meta: invitations.meta,
  });
});

const getInvitationsForCarpool = catchAsync(async (req: Request, res: Response) => {
  const { carpoolId } = req.params;
  const userId = req.user.id;
  const invitations = await CarpoolInvitationServices.getInvitationsForCarpool(
    carpoolId,
    userId,
    req.query
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Carpool invitations retrieved successfully",
    data: invitations.result,
    meta: invitations.meta,
  });
});

export const CarpoolInvitationController = {
  inviteToCarpool,
  respondToInvitation,
  getMyInvitations,
  getSentInvitations,
  getInvitationsForCarpool,
};
