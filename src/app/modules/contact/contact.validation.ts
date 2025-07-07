import { z } from "zod";

const sendContactRequest = z.object({
  body: z
    .object({
      recipientId: z
        .string()
        .min(24, "Recipient ID is required")
        .regex(/^[0-9a-fA-F]{24}$/, "Recipient ID must be a valid ObjectId"),
    })
    .strict(),
});

const respondToContactRequest = z.object({
  body: z
    .object({
      status: z.enum(["accepted", "blocked"], {
        errorMap: () => ({
          message: "Status must be either 'accepted' or 'blocked'",
        }),
      }),
    })
    .strict(),
  params: z.object({
    requestId: z
      .string()
      .min(24, "Request ID is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Request ID must be a valid ObjectId"),
  }),
});

const blockUnblockContact = z.object({
  body: z
    .object({
      action: z.enum(["block", "unblock"], {
        errorMap: () => ({
          message: "Action must be either 'block' or 'unblock'",
        }),
      }),
    })
    .strict(),
  params: z.object({
    contactId: z
      .string()
      .min(24, "Contact ID is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Contact ID must be a valid ObjectId"),
  }),
});


export const ContactValidation = {
  sendContactRequest,
  respondToContactRequest,
  blockUnblockContact,
};
