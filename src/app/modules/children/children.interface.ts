import { Types } from "mongoose";

export type TChildren = {
  parentId: Types.ObjectId;
  firstName: string;
  lastName: string;
  schoolName?: string;
  image: string;
  tag: "children"|"spouse";
};

export namespace TReturnChildren {
  export type Meta = {
    page: number;
    limit: number;
    totalPage: number;
    total: number;
  };

  export type getAllChildren = {
    result: TChildren[];
    meta?: Meta;
  };

  export type getSingleChildren = TChildren;
  export type updateChildren = TChildren;
  export type updateChildrenActivationStatus = TChildren;
  export type updateChildrenRole = TChildren;
  export type deleteChildren = TChildren;
  export type getChildrenByParentId = TChildren[];
}
