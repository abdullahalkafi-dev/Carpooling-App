import { Document, Types } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: 'driving_reminder' | 'participation_reminder' | 'carpool_message' | 'child_pickup';
  carpoolId?: Types.ObjectId;
  isRead: boolean;
  sentAt?: Date;
  scheduledFor: Date;
  data?: Record<string, any>;
  fcmTokens?: string[];
}

export interface INotificationPreference extends Document {
  userId: Types.ObjectId;
  // Driving reminders
  drivingReminder10Min: boolean;
  drivingReminder1Hour: boolean;
  drivingReminder24Hour: boolean;
  
  // Participation reminders  
  participationReminder10Min: boolean;
  participationReminder1Hour: boolean;
  participationReminder24Hour: boolean;
  
  // Carpool notes notifications
  carpoolMessageNotifications: boolean;
  
  // Live tracking
  childPickupNotifications: boolean;
  
  // Preference method
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export type TNotificationPreference = Omit<INotificationPreference, keyof Document>;
