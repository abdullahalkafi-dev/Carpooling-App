// dependents.cacheManage.ts
import { set } from "mongoose";
import cacheService from "../../../util/cacheService";
import { normalizeQuery } from "../../../util/normalizeQuery";
import { TDependent } from "./dependents.interface";

const DEFAULT_TTL = 60 * 60 * 12; // 12 hours
const DependentCacheManage = {
  keys: {
    dependentList: "dependentList",
    dependentListWithQuery: "dependentListWithQuery",
    dependentId: (id: string) => `dependents:${id}`,
    dependentIdWithParentId: (id: string) => `dependents:${id}:parentId`,
    dependentListWithQueryKey: (query: Record<string, unknown>) => {
      const normalized = normalizeQuery(query);
      return `${
        DependentCacheManage.keys.dependentListWithQuery
      }:${JSON.stringify(normalized)}`;
    },
  },
  updateDependentCache: async (dependentId: string,parentId:string|null=null) => {
    // Remove the specific dependents cache
    await cacheService.deleteCache(
      DependentCacheManage.keys.dependentId(dependentId)
    );

    // Remove the general dependents list cache
    await cacheService.deleteCache(DependentCacheManage.keys.dependentList);
    if(parentId) {
       await cacheService.deleteCache(
      DependentCacheManage.keys.dependentIdWithParentId(parentId)
    )
    }
   
    // Invalidate all query-based caches using pattern deletion
    await cacheService.deleteCacheByPattern(
      DependentCacheManage.keys.dependentListWithQuery + ":*"
    );
    
  },

  getCacheSingleDependent: async (
    dependentId: string
  ): Promise<TDependent | null> => {
    const key = DependentCacheManage.keys.dependentId(dependentId);
    const cached = await cacheService.getCache<TDependent>(key);
    return cached ?? null;
  },
  getCacheDependentByParentId: async (
    parentId: string
  ): Promise<TDependent[] | null> => {
    const key = DependentCacheManage.keys.dependentIdWithParentId(parentId);
    const cached = await cacheService.getCache<TDependent[]>(key);
    return cached ?? null;
  },

  setCacheDependentByParentId: async (
    dependentId: string,
    data: Partial<TDependent[]>
  ) => {
    const key = DependentCacheManage.keys.dependentIdWithParentId(dependentId);
    await cacheService.setCache(key, data, DEFAULT_TTL);
  },
  setCacheSingleDependent: async (
    dependentId: string,
    data: Partial<TDependent>
  ) => {
    const key = DependentCacheManage.keys.dependentId(dependentId);
    await cacheService.setCache(key, data, DEFAULT_TTL);
  },

  setCacheListWithQuery: async (
    query: Record<string, unknown>,
    data: { result: any; meta?: any },
    ttl: number = DEFAULT_TTL
  ) => {
    const key = DependentCacheManage.keys.dependentListWithQueryKey(query);
    console.log(key);
    await cacheService.setCache(key, data, ttl);
  },

  getCacheListWithQuery: async (
    query: Record<string, unknown>
  ): Promise<{ result: any; meta?: any } | null> => {
    const key = DependentCacheManage.keys.dependentListWithQueryKey(query);
    const cached = await cacheService.getCache<{ result: any; meta?: any }>(
      key
    );
    return cached ?? null;
  },
};

export default DependentCacheManage;
