import { z } from "zod";

const inviteToCarpool = z.object({
  body: z
    .object({
      carpoolId: z
        .string()
        .min(24, "Carpool ID is required")
        .regex(/^[0-9a-fA-F]{24}$/, "Carpool ID must be a valid ObjectId"),
      inviteeIds: z
        .array(
          z
            .string()
            .min(24, "Invitee ID is required")
            .regex(/^[0-9a-fA-F]{24}$/, "Invitee ID must be a valid ObjectId")
        )
        .min(1, "At least one invitee is required")
        .max(10, "Cannot invite more than 10 people at once"),
      message: z.string().max(500, "Message cannot exceed 500 characters").optional(),
      invitationType: z.enum(["member", "driver"], {
        errorMap: () => ({
          message: "Invitation type must be either 'member' or 'driver'",
        }),
      }).default("member"),
    })
    .strict(),
});

const respondToInvitation = z.object({
  body: z
    .object({
      status: z.enum(["accepted", "declined"], {
        errorMap: () => ({
          message: "Status must be either 'accepted' or 'declined'",
        }),
      }),
    })
    .strict(),
  params: z.object({
    invitationId: z
      .string()
      .min(24, "Invitation ID is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Invitation ID must be a valid ObjectId"),
  }),
});

export const CarpoolInvitationValidation = {
  inviteToCarpool,
  respondToInvitation,
};
