import { StatusCodes } from "http-status-codes";
import { QueryBuilder } from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { TCarpoolInvitation, TReturnCarpoolInvitation } from "./carpoolInvitation.interface";
import { CarpoolInvitation } from "./carpoolInvitation.model";
import { Carpool } from "../carpool/carpool.model";
import { Contact } from "../contact/contact.model";
import { User } from "../user/user.model";

const inviteToCarpool = async (
  inviterId: string,
  carpoolId: string,
  inviteeIds: string[],
  invitationType: "member" | "driver" = "member",
  message?: string
): Promise<TCarpoolInvitation[]> => {
  // Check if carpool exists and inviter is the creator
  const carpool = await Carpool.findById(carpoolId);
  if (!carpool) {
    throw new AppError(StatusCodes.NOT_FOUND, "Carpool not found");
  }

  if (carpool.createdBy.toString() !== inviterId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only send invitations for your own carpools"
    );
  }

  // Check if trying to invite as driver when driver already exists
  if (invitationType === "driver" && carpool.driver) {
    throw new AppError(StatusCodes.BAD_REQUEST, "This carpool already has a driver");
  }

  const createdInvitations: TCarpoolInvitation[] = [];
  const errors: string[] = [];

  for (const inviteeId of inviteeIds) {
    try {
      // Check if invitee exists
      const invitee = await User.findById(inviteeId);
      if (!invitee) {
        errors.push(`User with ID ${inviteeId} not found`);
        continue;
      }

      // Check if inviter and invitee are friends
      const areFriends = await Contact.isAlreadyFriends(inviterId, inviteeId);
      if (!areFriends) {
        errors.push(`You are not friends with ${invitee.firstName} ${invitee.lastName}`);
        continue;
      }

      // Check if invitation already exists
      const existingInvitation = await CarpoolInvitation.isInvitationExists(carpoolId, inviteeId);
      if (existingInvitation) {
        if (existingInvitation.status === "pending") {
          errors.push(`Invitation already sent to ${invitee.firstName} ${invitee.lastName}`);
        } else {
          errors.push(`${invitee.firstName} ${invitee.lastName} has already responded to this carpool`);
        }
        continue;
      }

      // Check if user is already a member or driver
      const isAlreadyMember = carpool.members?.some(memberId => memberId.toString() === inviteeId);
      const isAlreadyDriver = carpool.driver?.toString() === inviteeId;
      
      if (isAlreadyMember || isAlreadyDriver) {
        errors.push(`${invitee.firstName} ${invitee.lastName} is already part of this carpool`);
        continue;
      }

      // Create invitation
      const invitation = await CarpoolInvitation.create({
        carpool: carpoolId,
        inviter: inviterId,
        invitee: inviteeId,
        message: message,
        invitationType: invitationType,
        status: "pending",
      });

      createdInvitations.push(invitation);
    } catch (error) {
      errors.push(`Failed to invite user ${inviteeId}: ${error}`);
    }
  }

  // If no invitations were created, throw error
  if (createdInvitations.length === 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Failed to send any invitations. Errors: ${errors.join(", ")}`
    );
  }

  return createdInvitations;
};

const respondToInvitation = async (
  invitationId: string,
  inviteeId: string,
  status: "accepted" | "declined"
): Promise<TCarpoolInvitation> => {
  // Find the invitation
  const invitation = await CarpoolInvitation.findById(invitationId);
  if (!invitation) {
    throw new AppError(StatusCodes.NOT_FOUND, "Invitation not found");
  }

  // Check if the current user is the invitee
  if (invitation.invitee.toString() !== inviteeId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only respond to invitations sent to you"
    );
  }

  // Check if invitation is still pending
  if (invitation.status !== "pending") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This invitation has already been responded to"
    );
  }

  // If accepting, add user to carpool
  if (status === "accepted") {
    const carpool = await Carpool.findById(invitation.carpool);
    if (!carpool) {
      throw new AppError(StatusCodes.NOT_FOUND, "Carpool no longer exists");
    }

    // Add user to carpool based on invitation type
    if (invitation.invitationType === "driver") {
      // Check if carpool already has a driver
      if (carpool.driver) {
        throw new AppError(StatusCodes.BAD_REQUEST, "This carpool already has a driver");
      }
      carpool.driver = invitation.invitee;
    } else {
      // Add as member
      if (!carpool.members) {
        carpool.members = [];
      }
      if (!carpool.members.includes(invitation.invitee)) {
        carpool.members.push(invitation.invitee);
      }
    }

    await carpool.save();
  }

  // Update invitation status
  invitation.status = status;
  await invitation.save();

  return invitation;
};

const getMyInvitations = async (
  userId: string,
  query: Record<string, unknown>
): Promise<TReturnCarpoolInvitation.getAllInvitations> => {
  // Get invitations received by the user
  const invitationQuery = CarpoolInvitation.find({
    invitee: userId
  }).populate([
    {
      path: "carpool",
      populate: {
        path: "createdBy",
        select: "firstName lastName email image"
      }
    },
    {
      path: "inviter",
      select: "firstName lastName email image"
    }
  ]);

  const queryBuilder = new QueryBuilder(invitationQuery, query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  return { result, meta };
};

const getSentInvitations = async (
  userId: string,
  query: Record<string, unknown>
): Promise<TReturnCarpoolInvitation.getAllInvitations> => {
  // Get invitations sent by the user
  const invitationQuery = CarpoolInvitation.find({
    inviter: userId
  }).populate([
    {
      path: "carpool",
      select: "eventName startLocation endLocation startDate startTime"
    },
    {
      path: "invitee",
      select: "firstName lastName email image"
    }
  ]);

  const queryBuilder = new QueryBuilder(invitationQuery, query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  return { result, meta };
};

const getInvitationsForCarpool = async (
  carpoolId: string,
  userId: string,
  query: Record<string, unknown>
): Promise<TReturnCarpoolInvitation.getAllInvitations> => {
  // Check if carpool exists and user is the owner
  const carpool = await Carpool.findById(carpoolId);
  if (!carpool) {
    throw new AppError(StatusCodes.NOT_FOUND, "Carpool not found");
  }

  if (carpool.createdBy.toString() !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only view invitations for your own carpools"
    );
  }

  // Get invitations for this carpool
  const invitationQuery = CarpoolInvitation.find({
    carpool: carpoolId
  }).populate([
    {
      path: "invitee",
      select: "firstName lastName email image"
    }
  ]);

  const queryBuilder = new QueryBuilder(invitationQuery, query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  return { result, meta };
};

export const CarpoolInvitationServices = {
  inviteToCarpool,
  respondToInvitation,
  getMyInvitations,
  getSentInvitations,
  getInvitationsForCarpool,
};
