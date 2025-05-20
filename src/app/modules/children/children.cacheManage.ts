// children.cacheManage.ts
import { set } from "mongoose";
import cacheService from "../../../util/cacheService";
import { normalizeQuery } from "../../../util/normalizeQuery";
import { TChildren } from "./children.interface";

const DEFAULT_TTL = 60 * 60 * 12; // 12 hours
const ChildrenCacheManage = {
  keys: {
    childrenList: "childrenList",
    childrenListWithQuery: "childrenListWithQuery",
    childrenId: (id: string) => `children:${id}`,
    childrenIdWithParentId: (id: string) => `children:${id}:parentId`,
    childrenListWithQueryKey: (query: Record<string, unknown>) => {
      const normalized = normalizeQuery(query);
      return `${
        ChildrenCacheManage.keys.childrenListWithQuery
      }:${JSON.stringify(normalized)}`;
    },
  },
  updateChildrenCache: async (childrenId: string,parentId:string|null=null) => {
    // Remove the specific children cache
    await cacheService.deleteCache(
      ChildrenCacheManage.keys.childrenId(childrenId)
    );

    // Remove the general children list cache
    await cacheService.deleteCache(ChildrenCacheManage.keys.childrenList);
    if(parentId) {
       await cacheService.deleteCache(
      ChildrenCacheManage.keys.childrenIdWithParentId(parentId)
    )
    }
   
    // Invalidate all query-based caches using pattern deletion
    await cacheService.deleteCacheByPattern(
      ChildrenCacheManage.keys.childrenListWithQuery + ":*"
    );
    
  },

  getCacheSingleChildren: async (
    childrenId: string
  ): Promise<TChildren | null> => {
    const key = ChildrenCacheManage.keys.childrenId(childrenId);
    const cached = await cacheService.getCache<TChildren>(key);
    return cached ?? null;
  },
  getCacheChildrenByParentId: async (
    parentId: string
  ): Promise<TChildren[] | null> => {
    const key = ChildrenCacheManage.keys.childrenIdWithParentId(parentId);
    const cached = await cacheService.getCache<TChildren[]>(key);
    return cached ?? null;
  },

  setCacheChildrenByParentId: async (
    childrenId: string,
    data: Partial<TChildren[]>
  ) => {
    const key = ChildrenCacheManage.keys.childrenIdWithParentId(childrenId);
    await cacheService.setCache(key, data, DEFAULT_TTL);
  },
  setCacheSingleChildren: async (
    childrenId: string,
    data: Partial<TChildren>
  ) => {
    const key = ChildrenCacheManage.keys.childrenId(childrenId);
    await cacheService.setCache(key, data, DEFAULT_TTL);
  },

  setCacheListWithQuery: async (
    query: Record<string, unknown>,
    data: { result: any; meta?: any },
    ttl: number = DEFAULT_TTL
  ) => {
    const key = ChildrenCacheManage.keys.childrenListWithQueryKey(query);
    console.log(key);
    await cacheService.setCache(key, data, ttl);
  },

  getCacheListWithQuery: async (
    query: Record<string, unknown>
  ): Promise<{ result: any; meta?: any } | null> => {
    const key = ChildrenCacheManage.keys.childrenListWithQueryKey(query);
    const cached = await cacheService.getCache<{ result: any; meta?: any }>(
      key
    );
    return cached ?? null;
  },
};

export default ChildrenCacheManage;
