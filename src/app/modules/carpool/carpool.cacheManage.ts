// carpool.cacheManage.ts
import cacheService from "../../../util/cacheService";
import { normalizeQuery } from "../../../util/normalizeQuery";
import { TCarpool } from "./carpool.interface";

const DEFAULT_TTL = 60 * 60 * 12; // 12 hours

const CarpoolCacheManage = {
  keys: {
    carpoolList: "carpoolList",
    carpoolListWithQuery: "carpoolListWithQuery",
    carpoolId: (id: string) => `carpool:${id}`,
    carpoolListWithQueryKey: (query: Record<string, unknown>) => {
      const normalized = normalizeQuery(query);
      return `${CarpoolCacheManage.keys.carpoolListWithQuery}:${JSON.stringify(
        normalized
      )}`;
    },
  },
  updateCarpoolCache: async (carpoolId: string) => {
    // Remove the specific carpool cache
    await cacheService.deleteCache(
      CarpoolCacheManage.keys.carpoolId(carpoolId)
    );

    // Remove the general carpool list cache
    await cacheService.deleteCache(CarpoolCacheManage.keys.carpoolList);

    // Invalidate all query-based caches using pattern deletion
    await cacheService.deleteCacheByPattern(
      CarpoolCacheManage.keys.carpoolListWithQuery + ":*"
    );
  },

  getCacheSingleCarpool: async (
    carpoolId: string
  ): Promise<TCarpool | null> => {
    const key = CarpoolCacheManage.keys.carpoolId(carpoolId);
    const cached = await cacheService.getCache<TCarpool>(key);
    return cached ?? null;
  },

  setCacheSingleCarpool: async (carpoolId: string, data: Partial<TCarpool>) => {
    const key = CarpoolCacheManage.keys.carpoolId(carpoolId);
    await cacheService.setCache(key, data, DEFAULT_TTL);
  },

  setCacheListWithQuery: async (
    query: Record<string, unknown>,
    data: { result: any; meta?: any },
    ttl: number = DEFAULT_TTL
  ) => {
    const key = CarpoolCacheManage.keys.carpoolListWithQueryKey(query);
    console.log(key);
    await cacheService.setCache(key, data, ttl);
  },

  getCacheListWithQuery: async (
    query: Record<string, unknown>
  ): Promise<{ result: any; meta?: any } | null> => {
    const key = CarpoolCacheManage.keys.carpoolListWithQueryKey(query);
    const cached = await cacheService.getCache<{ result: any; meta?: any }>(
      key
    );
    return cached ?? null;
  },
};

export default CarpoolCacheManage;
