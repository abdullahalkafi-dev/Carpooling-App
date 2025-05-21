import { TCarpool } from "./carpool.interface";
import { Carpool } from "./carpool.model";

const carpoolValidator = (payload: Partial<TCarpool>) => {
  const {
    role,
    eventName,
    startLocation,
    totalSeats,
    endLocation,
    carpoolType,
    childrens,
    estimatedEndTime,
    repeatUntil,
    returnTrip,
    startDate,
    startTime,
    user,
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
      throw new Error("All fields are required");
    }
    if (returnTrip) {
      const requiredReturnFields = [
        returnTrip.returnDate,
        returnTrip.returnStartTime,
        returnTrip.returnEstimatedEndTime,
      ];

      if (requiredReturnFields.some((field) => !field)) {
        throw new Error("All return trip fields are required");
      }
    }

    if (repeatUntil || weeklyDays) {
      throw new Error(
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
      throw new Error("All fields are required");
    }

    if (returnTrip) {
      const requiredReturnFields = [
        returnTrip.returnDate,
        returnTrip.returnStartTime,
        returnTrip.returnEstimatedEndTime,
      ];

      if (requiredReturnFields.some((field) => !field)) {
        throw new Error("All return trip fields are required");
      }
    }

    if (!repeatUntil) {
      throw new Error("repeatUntilDate is required");
    }
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
      throw new Error("All fields are required");
    }

    if (returnTrip) {
      const requiredReturnFields = [
        returnTrip.returnStartTime,
        returnTrip.returnEstimatedEndTime,
      ];

      if (requiredReturnFields.some((field) => !field)) {
        throw new Error("All return trip fields are required");
      }
    }

    if (repeatUntil || weeklyDays || returnTrip?.returnDate) {
      throw new Error(
        "repeatUntil and weeklyDays and  returnDate are not applicable for Daily carpool type"
      );
    }
  }



 if(carpoolType === "Custom"){
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
      throw new Error("All fields are required");
    }

    if (returnTrip) {
      const requiredReturnFields = [
        returnTrip.returnDate,
        returnTrip.returnStartTime,
        returnTrip.returnEstimatedEndTime,
      ];

      if (requiredReturnFields.some((field) => !field)) {
        throw new Error("All return trip fields are required");
      }
    }
  }
 
 



};

const createCarpool = async (payload: Partial<TCarpool>) => {

  const result = await Carpool.create(payload);
  return result;
};
