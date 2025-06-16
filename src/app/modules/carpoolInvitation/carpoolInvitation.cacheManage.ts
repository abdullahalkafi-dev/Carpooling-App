import cacheService from "../../../util/cacheService";
import { normalizeQuery } from "../../../util/normalizeQuery";
import { TCarpoolInvitation } from "./carpoolInvitation.interface";

const DEFAULT_TTL = 60 * 60 * 6; // 6 hours

const CarpoolInvitationCacheManage = {
  keys: {
    invitationList: "carpoolInvitationList",
    invitationListWithQuery: "carpoolInvitationListWithQuery",
    invitationId: (id: string) => `carpoolInvitation:${id}`,
    userReceivedInvitations: (userId: string) => `userReceivedInvitations:${userId}`,
    userSentInvitations: (userId: string) => `userSentInvitations:${userId}`,
    carpoolInvitations: (carpoolId: string) => `carpoolInvitations:${carpoolId}`,
    invitationListWithQueryKey: (query: Record<string, unknown>) => {
      const normalized = normalizeQuery(query);
      return `${CarpoolInvitationCacheManage.keys.invitationListWithQuery}:${JSON.stringify(
        normalized
      )}`;
    },
  },

  updateInvitationCache: async (invitationId: string) => {
    // Remove specific invitation cache
    await cacheService.deleteCache(
      CarpoolInvitationCacheManage.keys.invitationId(invitationId)
    );

    // Remove general invitation list cache
    await cacheService.deleteCache(CarpoolInvitationCacheManage.keys.invitationList);

    // Invalidate all query-based caches using pattern deletion
    await cacheService.deleteCacheByPattern(
      CarpoolInvitationCacheManage.keys.invitationListWithQuery + ":*"
    );

    // Invalidate user-specific caches
    await cacheService.deleteCacheByPattern("userReceivedInvitations:*");
    await cacheService.deleteCacheByPattern("userSentInvitations:*");
    await cacheService.deleteCacheByPattern("carpoolInvitations:*");
  },

  getCacheSingleInvitation: async (
    invitationId: string
  ): Promise<TCarpoolInvitation | null> => {
    const key = CarpoolInvitationCacheManage.keys.invitationId(invitationId);
    const cached = await cacheService.getCache<TCarpoolInvitation>(key);
    return cached ?? null;
  },

  setCacheSingleInvitation: async (invitationId: string, data: Partial<TCarpoolInvitation>) => {
    const key = CarpoolInvitationCacheManage.keys.invitationId(invitationId);
    await cacheService.setCache(key, data, DEFAULT_TTL);
  },

  getCacheUserReceivedInvitations: async (userId: string): Promise<any | null> => {
    const key = CarpoolInvitationCacheManage.keys.userReceivedInvitations(userId);
    const cached = await cacheService.getCache<any>(key);
    return cached ?? null;
  },

  setCacheUserReceivedInvitations: async (userId: string, data: any) => {
    const key = CarpoolInvitationCacheManage.keys.userReceivedInvitations(userId);
    await cacheService.setCache(key, data, DEFAULT_TTL);
  },

  getCacheUserSentInvitations: async (userId: string): Promise<any | null> => {
    const key = CarpoolInvitationCacheManage.keys.userSentInvitations(userId);
    const cached = await cacheService.getCache<any>(key);
    return cached ?? null;
  },

  setCacheUserSentInvitations: async (userId: string, data: any) => {
    const key = CarpoolInvitationCacheManage.keys.userSentInvitations(userId);
    await cacheService.setCache(key, data, DEFAULT_TTL);
  },

  getCacheCarpoolInvitations: async (carpoolId: string): Promise<any | null> => {
    const key = CarpoolInvitationCacheManage.keys.carpoolInvitations(carpoolId);
    const cached = await cacheService.getCache<any>(key);
    return cached ?? null;
  },

  setCacheCarpoolInvitations: async (carpoolId: string, data: any) => {
    const key = CarpoolInvitationCacheManage.keys.carpoolInvitations(carpoolId);
    await cacheService.setCache(key, data, DEFAULT_TTL);
  },

  setCacheListWithQuery: async (
    query: Record<string, unknown>,
    data: { result: any; meta?: any },
    ttl: number = DEFAULT_TTL
  ) => {
    const key = CarpoolInvitationCacheManage.keys.invitationListWithQueryKey(query);
    await cacheService.setCache(key, data, ttl);
  },

  getCacheListWithQuery: async (
    query: Record<string, unknown>
  ): Promise<{ result: any; meta?: any } | null> => {
    const key = CarpoolInvitationCacheManage.keys.invitationListWithQueryKey(query);
    const cached = await cacheService.getCache<{ result: any; meta?: any }>(key);
    return cached ?? null;
  },
};

export default CarpoolInvitationCacheManage;
