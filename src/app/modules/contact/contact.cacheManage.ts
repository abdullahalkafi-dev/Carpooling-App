import redisClient from "../../../util/redisClient";

class ContactCacheManage {
  // Cache key patterns
  private static getUserContactsKey(userId: string): string {
    return `user_contacts:${userId}`;
  }

  private static getPendingRequestsKey(userId: string): string {
    return `pending_requests:${userId}`;
  }

  private static getSentRequestsKey(userId: string): string {
    return `sent_requests:${userId}`;
  }

  // Clear user's contact-related cache
  static async clearUserContactCache(userId: string): Promise<void> {
    try {
      const keys = [
        this.getUserContactsKey(userId),
        this.getPendingRequestsKey(userId),
        this.getSentRequestsKey(userId),
      ];
      
      // Delete each key individually
      for (const key of keys) {
        await redisClient.delete(key);
      }
    } catch (error) {
      console.error("Error clearing contact cache:", error);
    }
  }

  // Clear cache for both users involved in a contact
  static async clearContactCache(userId1: string, userId2: string): Promise<void> {
    try {
      await Promise.all([
        this.clearUserContactCache(userId1),
        this.clearUserContactCache(userId2),
      ]);
    } catch (error) {
      console.error("Error clearing contact cache for both users:", error);
    }
  }

  // Cache user contacts
  static async cacheUserContacts(userId: string, contacts: any[]): Promise<void> {
    try {
      const key = this.getUserContactsKey(userId);
      await redisClient.set(key, JSON.stringify(contacts), 300); // 5 minutes cache
    } catch (error) {
      console.error("Error caching user contacts:", error);
    }
  }

  // Get cached user contacts
  static async getCachedUserContacts(userId: string): Promise<any[] | null> {
    try {
      const key = this.getUserContactsKey(userId);
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error getting cached user contacts:", error);
      return null;
    }
  }

  // Cache pending requests
  static async cachePendingRequests(userId: string, requests: any[]): Promise<void> {
    try {
      const key = this.getPendingRequestsKey(userId);
      await redisClient.set(key, JSON.stringify(requests), 300); // 5 minutes cache
    } catch (error) {
      console.error("Error caching pending requests:", error);
    }
  }

  // Get cached pending requests
  static async getCachedPendingRequests(userId: string): Promise<any[] | null> {
    try {
      const key = this.getPendingRequestsKey(userId);
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error getting cached pending requests:", error);
      return null;
    }
  }
}

export default ContactCacheManage;
