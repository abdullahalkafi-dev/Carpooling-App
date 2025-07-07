import { createClient, RedisClientType } from "redis";
import config from "../config";
console.log(`redis://${config.redis.host}:${config.redis.port}`);
class RedisClient {
  public client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: `redis://${config.redis.host}:${config.redis.port}`,
      // 'redis://redis:6379',
      socket: {
        reconnectStrategy: (retries: number) => {
          const delay = Math.min(retries * 1000, 30000); // Exponential backoff with a max delay of 30 seconds
          console.log(`Reconnecting to Redis in ${delay}ms...`);
          return delay;
        },
      },
    });
    this.client.on("error", (err: Error) => {
      console.error("Redis Client Error:", err);
    });
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log("Connected to Redis");
    }
  }

  async ensureConnected(): Promise<void> {
    if (!this.client.isOpen) {
      await this.connect();
    }
  }
  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
      console.log("Disconnected from Redis");
    }
  }

  async set(
    key: string,
    value: string,
    expiryInSec: number = 3600
  ): Promise<void> {
    try {
      await this.ensureConnected();
      await this.client.setEx(key, expiryInSec, value);
    } catch (err) {
      console.error(`Error setting key ${key}:`, err);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      await this.ensureConnected();
      return await this.client.get(key);
    } catch (err) {
      console.error(`Error getting key ${key}:`, err);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.ensureConnected();
      await this.client.del(key);
    } catch (err) {
      console.error(`Error deleting key ${key}:`, err);
    }
  }

  // New method to support keys lookup
  async keys(pattern: string): Promise<string[]> {
    await this.ensureConnected();
    return this.client.keys(pattern);
  }
}

export default new RedisClient();
