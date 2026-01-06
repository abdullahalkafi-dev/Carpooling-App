import * as cron from "node-cron";
import { Notification } from "./notification.model";
import { Carpool } from "../carpool/carpool.model";
import { User } from "../user/user.model";
import { NotificationService } from "./notification.service";
import { logger } from "../../../shared/logger";
import { Types } from "mongoose";

interface CarpoolNotificationData {
  carpoolId: Types.ObjectId;
  eventName: string;
  startTime: Date;
  driverId?: Types.ObjectId;
  memberIds: Types.ObjectId[];
}

// Track scheduler state
let isRunning = false;

// Process and send pending notifications (runs every minute)
const startNotificationSender = (): void => {
  cron.schedule("* * * * *", async () => {
    try {
      await processPendingNotifications();
    } catch (error) {
      logger.error("Error processing pending notifications:", error);
    }
  });
};

// Schedule reminders for upcoming carpools (runs every 5 minutes)
const startCarpoolReminderScheduler = (): void => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      await scheduleCarpoolReminders();
    } catch (error) {
      logger.error("Error scheduling carpool reminders:", error);
    }
  });
};

// Cleanup old notifications (runs daily at 2 AM)
const startCleanupJob = (): void => {
  cron.schedule("0 2 * * *", async () => {
    try {
      await NotificationService.cleanupOldNotifications();
    } catch (error) {
      logger.error("Error cleaning up notifications:", error);
    }
  });
};

// Process and send pending notifications
const processPendingNotifications = async (): Promise<void> => {
  try {
    const now = new Date();
    const pendingNotifications = await Notification.find({
      scheduledFor: { $lte: now },
      $or: [
        { status: 'pending' },
        { status: { $exists: false } }
      ]
    }).populate("userId", "fcmToken");

    for (const notification of pendingNotifications) {
      await sendScheduledNotification(notification);
    }

    if (pendingNotifications.length > 0) {
      logger.info(
        `Processed ${pendingNotifications.length} pending notifications`
      );
    }
  } catch (error) {
    logger.error("Error processing pending notifications:", error);
  }
};

// Send a scheduled notification
const sendScheduledNotification = async (notification: any): Promise<void> => {
  try {
    const user = notification.userId;
    if (!user || !user.fcmToken) {
      await Notification.findByIdAndUpdate(notification._id, {
        sentAt: new Date(),
        status: "failed",
      });
      logger.warn(`Cannot send notification ${notification._id}: User ${notification.userId?._id || 'unknown'} has no FCM token`);
      return;
    }

    await NotificationService.sendImmediateNotification(
      notification.userId._id,
      notification.title,
      notification.message,
      notification.type,
      notification.data
    );

    // Mark as sent since sendImmediateNotification doesn't return success status
    await Notification.findByIdAndUpdate(notification._id, {
      sentAt: new Date(),
      status: "sent",
    });
    logger.info(`Notification sent to user ${user._id}: ${notification.title}`);
  } catch (error) {
    logger.error("Error sending scheduled notification:", error);
    await Notification.findByIdAndUpdate(notification._id, {
      status: "failed",
      sentAt: new Date(),
    });
  }
};

// Schedule carpool reminders
const scheduleCarpoolReminders = async (): Promise<void> => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find carpools happening within next 2 hours
    const upcomingCarpools = await Carpool.find({
      startTime: {
        $gte: now,
        $lte: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      },
    }).populate("driver members", "firstName lastName fcmToken _id");

    for (const carpool of upcomingCarpools) {
      await scheduleReminderForCarpool(carpool);
    }

    // Find carpools happening tomorrow and schedule advance reminders
    const tomorrowCarpools = await Carpool.find({
      startTime: {
        $gte: tomorrow,
        $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
      },
    }).populate("driver members", "firstName lastName fcmToken _id");

    for (const carpool of tomorrowCarpools) {
      await scheduleAdvanceReminderForCarpool(carpool);
    }
  } catch (error) {
    logger.error("Error scheduling carpool reminders:", error);
  }
};

// Schedule reminder for a specific carpool
const scheduleReminderForCarpool = async (carpool: any): Promise<void> => {
  try {
    const reminderTime = new Date(carpool.startTime.getTime() - 30 * 60 * 1000); // 30 minutes before

    if (reminderTime <= new Date()) {
      return; // Too late to schedule
    }

    // Check if we already scheduled reminders for this carpool
    const existingReminders = await Notification.find({
      carpoolId: carpool._id,
      type: "driving_reminder",
      scheduledFor: reminderTime,
    });

    if (existingReminders.length > 0) {
      return; // Already scheduled
    }

    const participants = [
      ...(carpool.members || []),
      ...(carpool.driver ? [carpool.driver] : []),
    ];

    if (participants.length === 0) {
      logger.warn(`Carpool ${carpool._id} (${carpool.eventName}) has no participants. Skipping reminder scheduling.`);
      return;
    }

    for (const participant of participants) {
      const isDriver =
        carpool.driver &&
        participant._id.toString() === carpool.driver._id.toString();

      const title = isDriver
        ? `🚗 Time to drive - ${carpool.eventName}`
        : `🎯 Your ride is coming - ${carpool.eventName}`;

      const message = isDriver
        ? `Your carpool starts in 30 minutes. Time to pick up your passengers!`
        : `Your driver will be there in 30 minutes. Get ready!`;

      await NotificationService.createNotification({
        userId: participant._id,
        title,
        message,
        type: "driving_reminder",
        carpoolId: carpool._id,
        scheduledFor: reminderTime,
        data: {
          carpoolId: carpool._id.toString(),
          eventName: carpool.eventName,
          startTime: carpool.startTime.toISOString(),
          isDriver: isDriver.toString(),
        },
      });
    }

    logger.info(
      `Scheduled reminders for carpool ${carpool.eventName} at ${reminderTime}`
    );
  } catch (error) {
    logger.error("Error scheduling carpool reminder:", error);
  }
};

// Schedule advance reminder for tomorrow's carpool
const scheduleAdvanceReminderForCarpool = async (
  carpool: any
): Promise<void> => {
  try {
    // Calculate 8 PM on the day before the carpool
    const carpoolDate = new Date(carpool.startTime);
    const reminderTime = new Date(carpoolDate);
    reminderTime.setDate(carpoolDate.getDate() - 1); // Day before
    reminderTime.setHours(20, 0, 0, 0); // 8 PM

    if (reminderTime <= new Date()) {
      return; // Already past the reminder time
    }

    // Check if we already scheduled advance reminders
    const existingReminders = await Notification.find({
      carpoolId: carpool._id,
      type: "participation_reminder",
      scheduledFor: reminderTime,
    });

    if (existingReminders.length > 0) {
      return; // Already scheduled
    }

    const participants = [
      ...(carpool.members || []),
      ...(carpool.driver ? [carpool.driver] : []),
    ];

    if (participants.length === 0) {
      logger.warn(`Carpool ${carpool._id} (${carpool.eventName}) has no participants. Skipping advance reminder scheduling.`);
      return;
    }

    for (const participant of participants) {
      await NotificationService.createNotification({
        userId: participant._id,
        title: `📅 Tomorrow's Carpool - ${carpool.eventName}`,
        message: `Don't forget! You have a carpool tomorrow at ${carpool.startTime.toLocaleTimeString()}.`,
        type: "participation_reminder",
        carpoolId: carpool._id,
        scheduledFor: reminderTime,
        data: {
          carpoolId: carpool._id.toString(),
          eventName: carpool.eventName,
          startTime: carpool.startTime.toISOString(),
        },
      });
    }

    logger.info(`Scheduled advance reminders for carpool ${carpool.eventName}`);
  } catch (error) {
    logger.error("Error scheduling advance carpool reminder:", error);
  }
};

// Schedule child pickup notification
const scheduleChildPickupNotification = async (
  carpoolId: Types.ObjectId,
  parentId: Types.ObjectId,
  childName: string,
  pickupTime: Date,
  driverName: string
): Promise<void> => {
  try {
    const reminderTime = new Date(pickupTime.getTime() - 15 * 60 * 1000); // 15 minutes before pickup

    await NotificationService.createNotification({
      userId: parentId,
      title: `👶 Child Pickup Reminder`,
      message: `${driverName} will pick up ${childName} in 15 minutes.`,
      type: "child_pickup",
      carpoolId,
      scheduledFor: reminderTime,
      data: {
        carpoolId: carpoolId.toString(),
        childName,
        driverName,
        pickupTime: pickupTime.toISOString(),
      },
    });

    logger.info(`Scheduled child pickup notification for ${childName}`);
  } catch (error) {
    logger.error("Error scheduling child pickup notification:", error);
  }
};

// Schedule message notification for carpool participants
const scheduleMessageNotification = async (
  carpoolId: Types.ObjectId,
  senderId: Types.ObjectId,
  message: string,
  excludeUserId?: Types.ObjectId
): Promise<void> => {
  try {
    const carpool = await Carpool.findById(carpoolId).populate(
      "members driver",
      "fcmToken _id"
    );
    const sender = await User.findById(senderId, "firstName lastName");

    if (!carpool || !sender) return;

    // Get all carpool participants except sender
    const participants = [
      ...(carpool.members || []),
      ...(carpool.driver ? [carpool.driver] : []),
    ].filter(
      (user) =>
        user._id.toString() !== senderId.toString() &&
        (!excludeUserId || user._id.toString() !== excludeUserId.toString())
    );

    if (participants.length === 0) return;

    const title = `💬 New message in ${carpool.eventName}`;
    const body = `${sender.firstName}: ${
      message.length > 50 ? message.substring(0, 50) + "..." : message
    }`;

    await NotificationService.sendMulticastNotification(
      participants.map((p) => p._id),
      title,
      body,
      "carpool_message",
      {
        carpoolId: carpoolId.toString(),
        senderId: senderId.toString(),
        senderName: `${sender.firstName} ${sender.lastName}`,
      }
    );

    logger.info(
      `Message notification sent to ${participants.length} carpool participants`
    );
  } catch (error) {
    logger.error("Error sending message notification:", error);
  }
};

// Start all cron jobs
const start = (): void => {
  if (isRunning) {
    logger.warn("Notification scheduler is already running");
    return;
  }

  startNotificationSender();
  startCarpoolReminderScheduler();
  startCleanupJob();

  isRunning = true;
  logger.info("Notification scheduler started");
};

// Stop all cron jobs
const stop = (): void => {
  cron.getTasks().forEach((task) => task.stop());
  isRunning = false;
  logger.info("Notification scheduler stopped");
};

export const NotificationScheduler = {
  start,
  stop,
  scheduleMessageNotification,
  scheduleChildPickupNotification,
};

export default NotificationScheduler;
