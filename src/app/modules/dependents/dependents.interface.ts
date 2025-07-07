import { Types } from "mongoose";

export type TDependent = {
  parentId: Types.ObjectId;
  firstName: string;
  lastName: string;
  schoolName?: string;
  image: string;
  tag: "children"|"spouse";
};

export namespace TReturnDependent {
  export type Meta = {
    page: number;
    limit: number;
    totalPage: number;
    total: number;
  };

  export type getAllDependent = {
    result: TDependent[];
    meta?: Meta;
  };

  export type getSingleDependent = TDependent;
  export type updateDependent = TDependent;
  export type updateDependentActivationStatus = TDependent;
  export type updateDependentRole = TDependent;
  export type deleteDependent = TDependent;
  export type getDependentByParentId = TDependent[];
}
