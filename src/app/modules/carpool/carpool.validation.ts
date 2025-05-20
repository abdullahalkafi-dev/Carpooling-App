import { z } from "zod";

// Define the validation schema for carpool creation
const createCarpool = z.object({
  body: z
    .object({
      role: z.enum(["Attend", "Drive"], {
        errorMap: () => ({
          message: "Role must be either 'Attend' or 'Drive'",
        }),
      }),
      user: z.string().uuid("Invalid user ID"),
      childrens: z.array(z.string().uuid("Invalid child ID")).optional(),
      startLocation: z.string().min(3, "Start location is required").trim(),
      endLocation: z.string().min(3, "End location is required").trim(),
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
      startDate: z.date().optional(),
      startTime: z.date().optional(),
      estimatedEndTime: z.date().optional(),
      returnTrip: z
        .object({
          returnStartDate: z.date().optional(),
          returnStartTime: z.date().optional(),
          returnEstimatedEndTime: z.date().optional(),
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

export const CarpoolValidation = {
  createCarpool,
};
