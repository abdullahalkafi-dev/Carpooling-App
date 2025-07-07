import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ContactServices } from "./contact.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

const sendContactRequest = catchAsync(async (req: Request, res: Response) => {
  const { recipientId } = req.body;
  const requesterId = req.user.id; // Assuming auth middleware adds user to request

  const contact = await ContactServices.sendContactRequest(requesterId, recipientId);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Friend request sent successfully",
    data: contact,
  });
});

const respondToContactRequest = catchAsync(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const { status } = req.body;
  const recipientId = req.user.id;

  const contact = await ContactServices.respondToContactRequest(requestId, recipientId, status);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Friend request ${status} successfully`,
    data: contact,
  });
});

const getMyContacts = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const contacts = await ContactServices.getContactsByUser(userId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Contacts retrieved successfully",
    data: contacts.result,
    meta: contacts.meta,
  });
});

const getPendingRequests = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const requests = await ContactServices.getPendingRequests(userId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Pending requests retrieved successfully",
    data: requests.result,
    meta: requests.meta,
  });
});

const getSentRequests = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const requests = await ContactServices.getSentRequests(userId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sent requests retrieved successfully",
    data: requests.result,
    meta: requests.meta,
  });
});

const removeContact = catchAsync(async (req: Request, res: Response) => {
  const { contactId } = req.params;
  const userId = req.user.id;

  await ContactServices.removeContact(contactId, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Contact removed successfully",
    data: null,
  });
});

const blockUnblockContact = catchAsync(async (req: Request, res: Response) => {
  const { contactId } = req.params;
  const { action } = req.body;
  const userId = req.user.id;

  const contact = await ContactServices.blockUnblockContact(contactId, userId, action);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Contact ${action}ed successfully`,
    data: contact,
  });
});

const getContactsForInvitation = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const contacts = await ContactServices.getContactsForInvitation(userId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Contacts for invitation retrieved successfully",
    data: contacts.result,
    meta: contacts.meta,
  });
});

export const ContactController = {
  sendContactRequest,
  respondToContactRequest,
  getMyContacts,
  getPendingRequests,
  getSentRequests,
  removeContact,
  blockUnblockContact,
  getContactsForInvitation,
};
