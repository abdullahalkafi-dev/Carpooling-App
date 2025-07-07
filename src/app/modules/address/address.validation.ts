import { z } from "zod";

const createAddressZodSchema = z.object({
  body: z.object({
    address: z
      .string({
        required_error: "Address is required",
      })
      .min(1, "Address cannot be empty")
      .trim(),
    longitude: z
      .number({
        required_error: "Longitude is required",
      })
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180"),
    latitude: z
      .number({
        required_error: "Latitude is required",
      })
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90"),
  }),
});


const updateAddressZodSchema = z.object({
  body: z.object({
    address: z
      .string()
      .min(1, "Address cannot be empty")
      .trim()
      .optional(),
    longitude: z
      .number()
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180")
      .optional(),
    latitude: z
      .number()
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90")
      .optional(),
  }),
});

const findNearbyZodSchema = z.object({
  query: z.object({
    longitude: z
      .string()
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val) && val >= -180 && val <= 180, {
        message: "Longitude must be a valid number between -180 and 180",
      }),
    latitude: z
      .string()
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val) && val >= -90 && val <= 90, {
        message: "Latitude must be a valid number between -90 and 90",
      }),
    maxDistance: z
      .string()
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "Max distance must be a positive number",
      })
      .optional(),
  }),
});

export const AddressValidation = {
  createAddressZodSchema,
  updateAddressZodSchema,
  findNearbyZodSchema,
};
