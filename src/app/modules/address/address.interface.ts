import { Document, Model, Types } from "mongoose";

export interface TAddress {
  user: Types.ObjectId;
  address: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface TAddressDocument extends TAddress, Document {}

export interface AddressModel extends Model<TAddressDocument> {
  findNearby(
    longitude: number,
    latitude: number,
    maxDistance?: number
  ): Promise<TAddressDocument[]>;
  findByUserId(userId: string | Types.ObjectId): Promise<TAddressDocument[]>;
}
