import express, { Router } from 'express';
import { NotificationController } from './notification.controller';
import validateRequest from '../../middlewares/validateRequest';
import { NotificationValidation } from './notification.validation';
import auth from '../../middlewares/auth';

const router = express.Router();

// Get user notifications
router.get(
  '/',
  auth(),
  NotificationController.getNotifications
);

// Mark specific notification as read
router.patch(
  '/:notificationId/read',
  auth(),
  NotificationController.markNotificationAsRead
);

// Mark all notifications as read
router.patch(
  '/mark-all-read',
  auth(),
  NotificationController.markAllNotificationsAsRead
);

// Get notification preferences
router.get(
  '/preferences',
  auth(),
  NotificationController.getNotificationPreferences
);

// Update notification preferences
router.patch(
  '/preferences',
  auth(),
  validateRequest(NotificationValidation.updatePreferences),
  NotificationController.updateNotificationPreferences
);

// Test notification (development only)
router.post(
  '/test',
  auth(),
  validateRequest(NotificationValidation.testNotification),
  NotificationController.testNotification
);

export const NotificationRoutes: Router = router;
