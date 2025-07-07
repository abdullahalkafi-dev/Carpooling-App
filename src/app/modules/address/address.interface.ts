import { Document, Model } from "mongoose";

export interface TAddress {
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
}
