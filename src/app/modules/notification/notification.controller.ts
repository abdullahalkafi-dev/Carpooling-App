import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { NotificationService } from './notification.service';
import { TNotificationPreference } from './notification.interface';

const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { type, isRead, limit = '20', page = '1' } = req.query;

  const limitNum = parseInt(limit as string);
  const pageNum = parseInt(page as string);
  const skip = (pageNum - 1) * limitNum;

  const filters = {
    userId,
    type: type as string,
    isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
    limit: limitNum,
    skip: skip,
  };

  const result = await NotificationService.getUserNotifications(filters);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notifications retrieved successfully',
    meta: {
      page: pageNum,
      limit: limitNum,
      total: result.total,
      totalPage: Math.ceil(result.total / limitNum)
    },
    data: {
      notifications: result.notifications,
      unreadCount: result.unreadCount
    },
  });
});

const markNotificationAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { notificationId } = req.params;

  await NotificationService.markAsRead(notificationId, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification marked as read',
  });
});

const markAllNotificationsAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  await NotificationService.markAllAsRead(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'All notifications marked as read',
  });
});

const getNotificationPreferences = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const preferences = await NotificationService.getNotificationPreferences(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification preferences retrieved successfully',
    data: preferences,
  });
});

const updateNotificationPreferences = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const updates: Partial<TNotificationPreference> = req.body;

  const preferences = await NotificationService.updateNotificationPreferences(userId, updates);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification preferences updated successfully',
    data: preferences,
  });
});

const testNotification = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { title = 'Test Notification', message = 'This is a test notification' } = req.body;

  await NotificationService.sendImmediateNotification(
    userId,
    title,
    message,
    'carpool_message'
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Test notification sent successfully',
  });
});

export const NotificationController = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  testNotification,
};
