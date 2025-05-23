import { TCarpool } from "./carpool.interface";
import { Carpool } from "./carpool.model";
import { carpoolValidator } from "./carpool.utils";

const createCarpool = async (payload: Partial<TCarpool>) => {
  // Validate the payload using the carpoolValidator function
  carpoolValidator(payload);
  const result = await Carpool.create(payload);
  return result;
};
export const carpoolService = {
  createCarpool,
};