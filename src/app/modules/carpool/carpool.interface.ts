import { Model, Types } from "mongoose";

export type TCarpool = {
  role: "Attend"|"Drive";
  user: Types.ObjectId;
  eventName: string;
  childrens: Types.ObjectId[];
  startLocation: string;
  totalSeats: number;
  endLocation: string;
  carpoolType: "Does not repeat"|"Daily"| "Every Week"| "Custom";
  startDate?: Date;
  startTime?: Date;
  note?: string;
  estimatedEndTime?: Date;
  repeatUntil?: Date;
  returnTrip?: {
    returnDate?: Date;
    returnStartTime?: Date;
    returnEstimatedEndTime?: Date;
  };
  weeklyDays?: ("Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday")[];
};

export type CarpoolModal = {
  isExistCarpoolById(id: string): Promise<TCarpool | null>;
  isExistCarpoolByEmail(email: string): Promise<TCarpool | null>;
  isExistCarpoolByPhnNum(phnNum: string): Promise<TCarpool | null>;
  isMatchPassword(password: string, hashPassword: string): boolean;
  isJWTIssuedBeforePasswordChanged(
    passwordChangedTimestamp: Date,
    jwtIssuedTimestamp: number
  ): boolean;
} & Model<TCarpool>;

export namespace TReturnCarpool {
  export type Meta = {
    page: number;
    limit: number;
    totalPage: number;
    total: number;
  };

  export type getAllCarpool = {
    result: TCarpool[];
    meta?: Meta;
  };

  export type getSingleCarpool = TCarpool
  export type updateCarpool = TCarpool
  export type updateCarpoolActivationStatus = TCarpool

  export type updateCarpoolRole =TCarpool

  export type deleteCarpool =TCarpool
}
