// cacheService.ts
import redisClient from "./redisClient";

class CacheService {
  async setCache(
    key: string,
    value: any,
    expiryInSec: number = 3600
  ): Promise<void> {
    const stringifiedValue = JSON.stringify(value);
    await redisClient.set(key, stringifiedValue, expiryInSec);
  }

  async getCache<T>(key: string): Promise<T | null> {
    const data = await redisClient.get(key);
    if (data) {
      return JSON.parse(data) as T;
    }
    return null;
  }

  async deleteCache(key: string): Promise<void> {
    await redisClient.delete(key);
  }

  // New method for deleting keys by pattern
  async deleteCacheByPattern(pattern: string): Promise<void> {
    // Get keys matching the pattern using the Redis client's keys() method.
    const keys: string[] = await redisClient.keys(pattern);
    if (keys.length > 0) {
      for (const key of keys) {
        await this.deleteCache(key);
      }
    }
  }
}

export default new CacheService();
