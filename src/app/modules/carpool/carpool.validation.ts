import { z } from "zod";

// Define the validation schema for carpool creation
const createCarpool = z.object({
  body: z
    .object({
      createdBy: z.string().min(1, "User ID is required"),
      eventName: z.string().min(3, "Event name is required").trim(),
      members: z
        .array(z.string({ message: "Member ID is required" }))
        .optional(),
      childrens: z
        .array(z.string({ message: "Min 1 childrens id is required" }))
        .optional(),
      startLocation: z.object({
        title: z.string().min(3, "Start location title is required").trim(),
        coordinates: z
          .array(z.number())
          .length(2, "Coordinates must be [longitude, latitude]")
          .refine(
            (coords) => 
              coords[0] >= -180 && coords[0] <= 180 && 
              coords[1] >= -90 && coords[1] <= 90,
            "Invalid coordinates range"
          )
          .optional(),
      }),
      endLocation: z.object({
        title: z.string().min(3, "End location title is required").trim(),
        coordinates: z
          .array(z.number())
          .length(2, "Coordinates must be [longitude, latitude]")
          .refine(
            (coords) => 
              coords[0] >= -180 && coords[0] <= 180 && 
              coords[1] >= -90 && coords[1] <= 90,
            "Invalid coordinates range"
          )
          .optional(),
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
      driver: z.string().min(1, "Driver ID is required"),
      startDate: z.string().optional(),
      startTime: z.string().optional(),
      estimatedEndTime: z.string().optional(),
      repeatUntil: z.string().optional(),
      returnTrip: z
        .object({
          returnDate: z.string().optional(),
          returnStartTime: z.string().optional(),
          returnEstimatedEndTime: z.string().optional(),
        })
        .optional(),
      driverLocation: z
        .array(z.number())
        .length(2, "Driver location must be [longitude, latitude]")
        .refine(
          (coords) => 
            coords[0] >= -180 && coords[0] <= 180 && 
            coords[1] >= -90 && coords[1] <= 90,
          "Invalid driver location coordinates"
        )
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
      eventName: z.string().min(3, "Event name is required").trim().optional(),
      members: z
        .array(z.string({ message: "Member ID is required" }))
        .optional(),
      childrens: z
        .array(z.string({ message: "Min 1 childrens id is required" }))
        .optional(),
      startLocation: z.object({
        title: z.string().min(3, "Start location title is required").trim().optional(),
        coordinates: z
          .array(z.number())
          .length(2, "Coordinates must be [longitude, latitude]")
          .refine(
            (coords) => 
              coords[0] >= -180 && coords[0] <= 180 && 
              coords[1] >= -90 && coords[1] <= 90,
            "Invalid coordinates range"
          )
          .optional(),
      }).optional(),
      endLocation: z.object({
        title: z.string().min(3, "End location title is required").trim().optional(),
        coordinates: z
          .array(z.number())
          .length(2, "Coordinates must be [longitude, latitude]")
          .refine(
            (coords) => 
              coords[0] >= -180 && coords[0] <= 180 && 
              coords[1] >= -90 && coords[1] <= 90,
            "Invalid coordinates range"
          )
          .optional(),
      }).optional(),
      carpoolType: z
        .enum(["Does not repeat", "Daily", "Every Week", "Custom"], {
          errorMap: () => ({
            message:
              "Carpool type must be one of ['Does not repeat', 'Daily', 'Every Week', 'Custom']",
          }),
        })
        .optional(),
      driver: z.string().min(1, "Driver ID is required").optional(),
      startDate: z.string().optional(),
      startTime: z.string().optional(),
      estimatedEndTime: z.string().optional(),
      repeatUntil: z.string().optional(),
      returnTrip: z
        .object({
          returnDate: z.string().optional(),
          returnStartTime: z.string().optional(),
          returnEstimatedEndTime: z.string().optional(),
        })
        .optional(),
      driverLocation: z
        .array(z.number())
        .length(2, "Driver location must be [longitude, latitude]")
        .refine(
          (coords) => 
            coords[0] >= -180 && coords[0] <= 180 && 
            coords[1] >= -90 && coords[1] <= 90,
          "Invalid driver location coordinates"
        )
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
const addChildrenToCarpool = z.object({
  body: z.object({
    childrenIds: z
      .array(z.string().min(1, "Child ID is required"))
      .min(1, "At least one child ID is required")
  }),
  params: z.object({
    carpoolId: z.string().min(1, "Carpool ID is required")
  })
});

const removeChildrenFromCarpool = z.object({
  body: z.object({
    childrenIds: z
      .array(z.string().min(1, "Child ID is required"))
      .min(1, "At least one child ID is required")
  }),
  params: z.object({
    carpoolId: z.string().min(1, "Carpool ID is required")
  })
});

export const CarpoolValidation = {
  createCarpool,
  updateCarpool,
  addChildrenToCarpool,
  removeChildrenFromCarpool 
};
