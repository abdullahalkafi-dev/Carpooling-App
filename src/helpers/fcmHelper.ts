import { User } from "../app/modules/user/user.model";
import { logger } from "../shared/logger";

/**
 * Get FCM token for a single user
 */
export const getUserFcmToken = async (userId: string): Promise<string | null> => {
  try {
    const user = await User.findById(userId).select('fcmToken');
    return user?.fcmToken || null;
  } catch (error) {
    logger.error('Error fetching user FCM token:', error);
    return null;
  }
};

/**
 * Get FCM tokens for multiple users
 */
export const getUsersFcmTokens = async (userIds: string[]): Promise<string[]> => {
  try {
    const users = await User.find({ _id: { $in: userIds } }).select('fcmToken');
    return users
      .map(user => user.fcmToken)
      .filter(token => token !== null && token !== undefined) as string[];
  } catch (error) {
    logger.error('Error fetching users FCM tokens:', error);
    return [];
  }
};

/**
 * Get FCM tokens for users by email
 */
export const getUsersFcmTokensByEmail = async (emails: string[]): Promise<string[]> => {
  try {
    const users = await User.find({ email: { $in: emails } }).select('fcmToken');
    return users
      .map(user => user.fcmToken)
      .filter(token => token !== null && token !== undefined) as string[];
  } catch (error) {
    logger.error('Error fetching users FCM tokens by email:', error);
    return [];
  }
};

/**
 * Update FCM token for user (alternative to service method)
 */
export const updateUserFcmToken = async (userId: string, fcmToken: string): Promise<boolean> => {
  try {
    await User.findByIdAndUpdate(userId, { fcmToken });
    logger.info(`FCM token updated for user ${userId}`);
    return true;
  } catch (error) {
    logger.error('Error updating user FCM token:', error);
    return false;
  }
};

/**
 * Remove FCM token for user (useful for logout)
 */
export const removeUserFcmToken = async (userId: string): Promise<boolean> => {
  try {
    await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } });
    logger.info(`FCM token removed for user ${userId}`);
    return true;
  } catch (error) {
    logger.error('Error removing user FCM token:', error);
    return false;
  }
};

export const fcmHelper = {
  getUserFcmToken,
  getUsersFcmTokens,
  getUsersFcmTokensByEmail,
  updateUserFcmToken,
  removeUserFcmToken,
};
