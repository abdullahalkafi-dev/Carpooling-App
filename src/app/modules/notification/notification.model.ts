import { model, Schema } from "mongoose";
import { INotification, INotificationPreference } from "./notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['driving_reminder', 'participation_reminder', 'carpool_message', 'child_pickup'],
      required: true,
      index: true,
    },
    carpoolId: {
      type: Schema.Types.ObjectId,
      ref: "Carpool",
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    sentAt: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
      index: true,
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    fcmTokens: [{
      type: String,
    }],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ scheduledFor: 1, sentAt: 1 });
notificationSchema.index({ carpoolId: 1, type: 1 });

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Driving reminders
    drivingReminder10Min: {
      type: Boolean,
      default: true,
    },
    drivingReminder1Hour: {
      type: Boolean,
      default: true,
    },
    drivingReminder24Hour: {
      type: Boolean,
      default: true,
    },
    
    // Participation reminders
    participationReminder10Min: {
      type: Boolean,
      default: true,
    },
    participationReminder1Hour: {
      type: Boolean,
      default: true,
    },
    participationReminder24Hour: {
      type: Boolean,
      default: true,
    },
    
    // Carpool notes notifications
    carpoolMessageNotifications: {
      type: Boolean,
      default: true,
    },
    
    // Live tracking
    childPickupNotifications: {
      type: Boolean,
      default: true,
    },
    
    // Preference method
    emailNotifications: {
      type: Boolean,
      default: false,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Notification = model<INotification>("Notification", notificationSchema);
export const NotificationPreference = model<INotificationPreference>("NotificationPreference", notificationPreferenceSchema);
