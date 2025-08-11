import { z } from "zod";

const createCarpoolMessage = z.object({
  data: z.object({
    carpoolId: z
      .string()
      .min(24, "Carpool ID is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Carpool ID must be a valid ObjectId"),
    senderId: z
      .string()
      .min(24, "Sender ID is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Sender ID must be a valid ObjectId"),
    message: z.string().optional(),
  }),
});

const getCarpoolMessages = z.object({
  query: z.object({
    carpoolId: z
      .string()
      .min(24, "Carpool ID is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Carpool ID must be a valid ObjectId"),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const CarpoolMessageValidation = {
  createCarpoolMessage,
  getCarpoolMessages,
};
