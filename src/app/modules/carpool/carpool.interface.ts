import { Model, Types } from "mongoose";

export type TLocation = {
  address: string;
  latitude: number;
  longitude: number;
};

export type TCarpool = {
  createdBy: Types.ObjectId;
  eventName: string;
  startLocation: TLocation;
  endLocation: TLocation;
  carpoolType: "Does not repeat" | "Daily" | "Every Week" | "Custom";
  startDate?: Date;
  startTime?: Date;
  note?: string;
  driver?: Types.ObjectId;
  passengers?: Types.ObjectId[];
  estimatedEndTime?: Date;
  repeatUntil?: Date;
  returnTrip?: {
    returnDate?: Date;
    returnStartTime?: Date;
    returnEstimatedEndTime?: Date;
  };
  driverLocation?: {
    latitude: number;
    longitude: number;
  };
  weeklyDays?: (
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday"
  )[];
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

  export type getSingleCarpool = TCarpool;
  export type updateCarpool = TCarpool;
  export type updateCarpoolActivationStatus = TCarpool;

  export type updateCarpoolRole = TCarpool;

  export type deleteCarpool = TCarpool;
}
