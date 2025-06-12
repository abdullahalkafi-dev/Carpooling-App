import { z } from "zod";

// Define the validation schema for carpool creation
const createCarpool = z.object({
  body: z
    .object({
      createdBy: z.string().min(1, "User ID is required"),
      eventName: z.string().min(3, "Event name is required").trim(),
      note: z.string().optional(),
      passengers: z
        .array(z.string({ message: "Min 1 childrens id is required" }))
        .optional(),
      startLocation: z.object({
        address: z.string().min(3, "Start location is required").trim(),
        latitude: z.number(),
        longitude: z.number(),
      }),
      endLocation: z.object({
        address: z.string().min(3, "End location is required").trim(),
        latitude: z.number(),
        longitude: z.number(),
      }),
      carpoolType: z.enum(
        ["Does not repeat", "Daily", "Every Week", "Custom"],
        {
          errorMap: () => ({
            message:
              "Carpool type must be one of ['Does not repeat', 'Daily', 'Every Week', 'Custom']",
          }),
        }
      ),
      // Conditional validation based on carpoolType
      startDate: z.string().optional(),
      startTime: z.string().optional(),
      estimatedEndTime: z.string().optional(),
      returnTrip: z
        .object({
          returnDate: z.string().optional(),
          returnStartTime: z.string().optional(),
          returnEstimatedEndTime: z.string().optional(),
        })
        .optional(),
      weeklyDays: z
        .array(
          z.enum([
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ])
        )
        .optional(),
    })
    .strict()
    .refine(
      (data) => {
        if (data.carpoolType === "Does not repeat") {
          return data.startDate && data.startTime && data.estimatedEndTime;
        }
        if (data.carpoolType === "Daily") {
          return data.startDate && data.startTime && data.estimatedEndTime;
        }
        if (data.carpoolType === "Every Week") {
          return (
            data.startDate &&
            data.startTime &&
            data.estimatedEndTime &&
            data.weeklyDays &&
            data.weeklyDays.length > 0
          );
        }
        if (data.carpoolType === "Custom") {
          return (
            data.startDate &&
            data.startTime &&
            data.estimatedEndTime &&
            data.weeklyDays &&
            data.weeklyDays.length > 0
          );
        }
      },
      {
        message: "Missing required fields for the selected carpool type",
      }
    ),
});

// Define the validation schema for updating carpool
const updateCarpool = z.object({
  body: z
    .object({
      role: z
        .enum(["Attend", "Drive"], {
          errorMap: () => ({
            message: "Role must be either 'Attend' or 'Drive'",
          }),
        })
        .optional(),
      eventName: z.string().min(3, "Event name is required").trim().optional(),
      totalSeats: z
        .number()
        .min(1, "Total seats must be at least 1")
        .optional(),
      note: z.string().optional(),
      p: z
        .array(z.string({ message: "Min 1 dependents id is required" }))
        .optional(),
      startLocation: z.object({
        address: z
          .string()
          .min(3, "Start location is required")
          .trim()
          .optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
      ,
      endLocation: z.object({
        address: z
          .string()
          .min(3, "End location is required")
          .trim()
          .optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }),
      carpoolType: z
        .enum(["Does not repeat", "Daily", "Every Week", "Custom"], {
          errorMap: () => ({
            message:
              "Carpool type must be one of ['Does not repeat', 'Daily', 'Every Week', 'Custom']",
          }),
        })
        .optional(),
      startDate: z.string().optional(),
      startTime: z.string().optional(),
      estimatedEndTime: z.string().optional(),
      returnTrip: z
        .object({
          returnDate: z.string().optional(),
          returnStartTime: z.string().optional(),
          returnEstimatedEndTime: z.string().optional(),
        })
        .optional(),
      weeklyDays: z
        .array(
          z.enum([
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ])
        )
        .optional(),
    })
    .strict(),
});

export const CarpoolValidation = {
  createCarpool,
  updateCarpool,
};
