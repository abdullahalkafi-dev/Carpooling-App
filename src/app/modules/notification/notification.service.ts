import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { INotification, INotificationPreference } from "./notification.interface";
import { Notification, NotificationPreference } from "./notification.model";
import { User } from "../user/user.model";
import { FCMService } from "./fcm.service";
import { logger } from "../../../shared/logger";
import { Types } from "mongoose";

interface CreateNotificationData {
  userId: Types.ObjectId | string;
  title: string;
  message: string;
  type: 'driving_reminder' | 'participation_reminder' | 'carpool_message' | 'child_pickup';
  carpoolId?: Types.ObjectId | string;
  scheduledFor: Date;
  data?: Record<string, any>;
}

interface NotificationFilters {
  userId?: string;
  type?: string;
  isRead?: boolean;
  carpoolId?: string;
  limit?: number;
  skip?: number;
}

// Create and schedule a notification
const createNotification = async (notificationData: CreateNotificationData): Promise<INotification> => {
  try {
    const user = await User.findById(notificationData.userId);
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    // Get user's FCM token
    const fcmTokens = user.fcmToken ? [user.fcmToken] : [];

    const notification = new Notification({
      ...notificationData,
      fcmTokens,
    });

    await notification.save();
    logger.info(`Notification created for user ${notificationData.userId}: ${notificationData.title}`);
    
    return notification;
  } catch (error) {
    logger.error("Error creating notification:", error);
    throw error;
  }
};

// Send immediate notification
const sendImmediateNotification = async (
  userId: string | Types.ObjectId,
  title: string,
  message: string,
  type: string,
  data?: Record<string, any>
): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmToken) {
      logger.warn(`No FCM token found for user ${userId}`);
      return;
    }

    // Check user preferences
    const preferences = await NotificationPreference.findOne({ userId });
    if (!preferences?.pushNotifications) {
      logger.info(`Push notifications disabled for user ${userId}`);
      return;
    }

    // Send FCM notification
    const success = await FCMService.sendNotification({
      token: user.fcmToken,
      title,
      body: message,
      data: data ? Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, String(value)])
      ) : undefined,
    });

    if (success) {
      // Save notification record
      await Notification.create({
        userId,
        title,
        message,
        type,
        scheduledFor: new Date(),
        sentAt: new Date(),
        fcmTokens: [user.fcmToken],
        data,
      });
    }
  } catch (error) {
    logger.error("Error sending immediate notification:", error);
  }
};

// Send notifications to multiple users
const sendMulticastNotification = async (
  userIds: (string | Types.ObjectId)[],
  title: string,
  message: string,
  type: string,
  data?: Record<string, any>
): Promise<void> => {
  try {
    const users = await User.find({ 
      _id: { $in: userIds },
      fcmToken: { $exists: true, $ne: null }
    });

    if (users.length === 0) {
      logger.warn("No users with FCM tokens found for multicast notification");
      return;
    }

    // Get user preferences
    const preferences = await NotificationPreference.find({
      userId: { $in: userIds },
      pushNotifications: true
    });
    
    const enabledUserIds = preferences.map(p => p.userId.toString());
    const enabledUsers = users.filter(user => enabledUserIds.includes(user._id.toString()));
    
    if (enabledUsers.length === 0) {
      logger.info("No users have push notifications enabled");
      return;
    }

    const tokens = enabledUsers.map(user => user.fcmToken!);
    
    const result = await FCMService.sendMulticastNotification({
      tokens,
      title,
      body: message,
      data: data ? Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, String(value)])
      ) : undefined,
    });

    // Save notification records for successful sends
    const successfulUsers = enabledUsers.filter((_, index) => 
      !result.failedTokens.includes(tokens[index])
    );

    const notifications = successfulUsers.map(user => ({
      userId: user._id,
      title,
      message,
      type,
      scheduledFor: new Date(),
      sentAt: new Date(),
      fcmTokens: [user.fcmToken!],
      data,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    logger.info(`Multicast notification sent to ${result.successCount} users`);
  } catch (error) {
    logger.error("Error sending multicast notification:", error);
  }
};

// Get user notifications
const getUserNotifications = async (filters: NotificationFilters): Promise<{
  notifications: INotification[];
  total: number;
  unreadCount: number;
}> => {
  try {
    const query: any = {};
    
    if (filters.userId) query.userId = filters.userId;
    if (filters.type) query.type = filters.type;
    if (filters.isRead !== undefined) query.isRead = filters.isRead;
    if (filters.carpoolId) query.carpoolId = filters.carpoolId;

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      ...query, 
      isRead: false 
    });

    const notifications = await Notification.find(query)
      .populate('carpoolId', 'eventName startDate startTime')
      .sort({ createdAt: -1 })
      .limit(filters.limit || 20)
      .skip(filters.skip || 0);

    return {
      notifications,
      total,
      unreadCount,
    };
  } catch (error) {
    logger.error("Error getting user notifications:", error);
    throw error;
  }
};

// Mark notification as read
const markAsRead = async (notificationId: string, userId: string): Promise<void> => {
  try {
    await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    throw error;
  }
};

// Mark all notifications as read for user
const markAllAsRead = async (userId: string): Promise<void> => {
  try {
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  } catch (error) {
    logger.error("Error marking all notifications as read:", error);
    throw error;
  }
};

// Get or create notification preferences
const getNotificationPreferences = async (userId: string): Promise<INotificationPreference> => {
  try {
    let preferences = await NotificationPreference.findOne({ userId });
    
    if (!preferences) {
      preferences = await NotificationPreference.create({ userId });
    }
    
    return preferences;
  } catch (error) {
    logger.error("Error getting notification preferences:", error);
    throw error;
  }
};

// Update notification preferences
const updateNotificationPreferences = async (
  userId: string, 
  updates: Partial<INotificationPreference>
): Promise<INotificationPreference> => {
  try {
    const preferences = await NotificationPreference.findOneAndUpdate(
      { userId },
      updates,
      { new: true, upsert: true }
    );

    return preferences!;
  } catch (error) {
    logger.error("Error updating notification preferences:", error);
    throw error;
  }
};

// Delete old notifications (cleanup)
const cleanupOldNotifications = async (daysOld = 30): Promise<void> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true,
    });

    logger.info(`Cleaned up ${result.deletedCount} old notifications`);
  } catch (error) {
    logger.error("Error cleaning up old notifications:", error);
  }
};

export const NotificationService = {
  createNotification,
  sendImmediateNotification,
  sendMulticastNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  cleanupOldNotifications,
};
