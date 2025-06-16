import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { CarpoolModal, TCarpool } from "./carpool.interface";

const carpoolSchema = new Schema<TCarpool, CarpoolModal>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventName: {
      type: String,
      required: true,
    },
    members: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    childrens: {
      type: [Schema.Types.ObjectId],
      ref: "Dependents",
      default: [],
    },
    startLocation: {
      title: {
        type: String,
        required: true,
      },
      coordinates: {
        type: [Number], 
      
        validate: {
          validator: (coords: number[]) => {
            console.log("Validating coordinates:", coords);
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 && // longitude
              coords[1] >= -90 &&
              coords[1] <= 90 // latitude
            );
          },
          message:
            "Coordinates must be [longitude, latitude] with valid ranges",
        },
        default: [],
      },
    },

    endLocation: 
    {
      title: {
        type: String,
        required: true,
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: (coords: number[]) => {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 && // longitude
              coords[1] >= -90 &&
              coords[1] <= 90 // latitude
            );
          },
          message:
            "Coordinates must be [longitude, latitude] with valid ranges",
        },
        default: [],
      },
    },
    carpoolType: {
      type: String,
      enum: ["Does not repeat", "Daily", "Every Week", "Custom"],
      required: true,
    },
    driver: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    startDate: {
      type: Date,
    },
    startTime: {
      type: Date,
    },
    estimatedEndTime: {
      type: Date,
    },
   
    repeatUntil: {
      type: Date,
    },
    returnTrip: {
      returnDate: {
        type: Date,
      },
      returnStartTime: {
        type: Date,
      },
      returnEstimatedEndTime: {
        type: Date,
      },
    },
    driverLocation: {
      type: [Number],
      required: false,
      validate: {
        validator: function(coords: number[]) {
          if (!coords || coords.length === 0) return true; // Allow null/empty
          return (
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 && // longitude
            coords[1] >= -90 &&
            coords[1] <= 90 // latitude
          );
        },
        message: "Coordinates must be [longitude, latitude] with valid ranges",
      },
      default: null,
    },
    weeklyDays: {
      type: [String],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

carpoolSchema.statics.isExistCarpoolById = async function (id: string) {
  return await this.findById(id);
};

carpoolSchema.statics.isExistCarpoolByEmail = async function (email: string) {
  return await this.findOne({ email });
};

carpoolSchema.statics.isExistCarpoolByPhnNum = async function (phnNum: string) {
  return await this.findOne({ phoneNumber: phnNum });
};

carpoolSchema.statics.isMatchPassword = function (
  password: string,
  hashPassword: string
) {
  return bcrypt.compareSync(password, hashPassword);
};

carpoolSchema.statics.isJWTIssuedBeforePasswordChanged = function (
  passwordChangedTimestamp: Date,
  jwtIssuedTimestamp: number
) {
  const passwordChangedTime =
    new Date(passwordChangedTimestamp).getTime() / 1000;
  return passwordChangedTime > jwtIssuedTimestamp;
};

export const Carpool = model<TCarpool, CarpoolModal>("Carpool", carpoolSchema);
