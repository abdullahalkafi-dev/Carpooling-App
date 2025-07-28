import { model, Schema } from "mongoose";
import { TAddressDocument, AddressModel } from "./address.interface";
const addressSchema = new Schema<TAddressDocument, AddressModel>(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
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
          message: "Coordinates must be [longitude, latitude] with valid ranges",
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
    versionKey: false,
  }
);

// Create 2dsphere index for geospatial queries
addressSchema.index({ location: "2dsphere" });

// Static method to find nearby addresses
addressSchema.statics.findNearby = async function (
  longitude: number,
  latitude: number,
  maxDistance: number = 5000 // 5km default
) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance, // in meters
      },
    },
  });
};

export const Address = model<TAddressDocument, AddressModel>(
  "Address",
  addressSchema,
  "addresses"
);
