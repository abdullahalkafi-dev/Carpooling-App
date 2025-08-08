import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { TCarpool } from "./carpool.interface";

export const carpoolValidator = (payload: Partial<TCarpool>) => {
  const {
    eventName,
    startLocation,
    endLocation,
    carpoolType,
    estimatedEndTime,
    repeatUntil,
    returnTrip,
    startDate,
    startTime,
    weeklyDays,
  } = payload;



  if (carpoolType === "Does not repeat") {
    const requiredFields = [
      eventName,
      startLocation,
      endLocation,
      startDate,
      startTime,
      estimatedEndTime,
    ];
    if (requiredFields.some((field) => !field)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "All fields are required");
    }
    if (returnTrip) {
      const requiredReturnFields = [
        returnTrip.returnDate,
        returnTrip.returnStartTime,
        returnTrip.returnEstimatedEndTime,
      ];

      if (requiredReturnFields.some((field) => !field)) {
        throw new AppError(StatusCodes.BAD_REQUEST, "All return trip fields are required");
      }
    }

    if (repeatUntil || weeklyDays) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "repeatUntil and weeklyDays are not applicable for Does not repeat carpool type"
      );
    }
  }

  if (carpoolType === "Every Week") {
    const requiredFields = [
      eventName,
      startLocation,
      endLocation,
      startDate,
      startTime,
      estimatedEndTime,
      weeklyDays,
    ];

    if (requiredFields.some((field) => !field)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "All fields are required");
    }

    if (returnTrip) {
      const requiredReturnFields = [
        returnTrip.returnDate,
        returnTrip.returnStartTime,
        returnTrip.returnEstimatedEndTime,
      ];

      if (requiredReturnFields.some((field) => !field)) {
        throw new AppError(StatusCodes.BAD_REQUEST, "All return trip fields are required");
      }
    }

    // if (!repeatUntil) {
    //   throw new Error("repeatUntilDate is required");
    // }
  }
  if (carpoolType === "Daily") {
    const requiredFields = [
      eventName,
      startLocation,
      endLocation,
      startDate,
      startTime,
      estimatedEndTime,
    ];

    if (requiredFields.some((field) => !field)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "All fields are required");
    }

    if (returnTrip) {
      const requiredReturnFields = [
        returnTrip.returnStartTime,
        returnTrip.returnEstimatedEndTime,
      ];

      if (requiredReturnFields.some((field) => !field)) {
        throw new AppError(StatusCodes.BAD_REQUEST, "All return trip fields are required");
      }
    }
  console.log(`
    
    
    
    ${returnTrip}


    
    
    `);
    if (repeatUntil || weeklyDays || returnTrip?.returnDate) {
      throw new AppError(StatusCodes.BAD_REQUEST, "repeatUntil and weeklyDays and  returnDate are not applicable for Daily carpool type");
    }
  }

  if (carpoolType === "Custom") {
    const requiredFields = [
      eventName,
      startLocation,
      endLocation,
      startDate,
      startTime,
      estimatedEndTime,
      weeklyDays,
      repeatUntil,
    ];

    if (requiredFields.some((field) => !field)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "All fields are required");
    }

    if (returnTrip) {
      const requiredReturnFields = [
        returnTrip.returnDate,
        returnTrip.returnStartTime,
        returnTrip.returnEstimatedEndTime,
      ];

      if (requiredReturnFields.some((field) => !field)) {
        throw new AppError(StatusCodes.BAD_REQUEST, "All return trip fields are required");
      }
    }
  }
};
