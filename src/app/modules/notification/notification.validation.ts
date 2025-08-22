import { z } from 'zod';

const updatePreferences = z.object({
  body: z.object({
    // Driving reminders
    drivingReminder10Min: z.boolean().optional(),
    drivingReminder1Hour: z.boolean().optional(),
    drivingReminder24Hour: z.boolean().optional(),
    
    // Participation reminders
    participationReminder10Min: z.boolean().optional(),
    participationReminder1Hour: z.boolean().optional(),
    participationReminder24Hour: z.boolean().optional(),
    
    // Carpool notes notifications
    carpoolMessageNotifications: z.boolean().optional(),
    
    // Live tracking
    childPickupNotifications: z.boolean().optional(),
    
    // Preference method
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
  }).strict(),
});

const testNotification = z.object({
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    message: z.string().min(1).max(500).optional(),
  }).strict(),
});

export const NotificationValidation = {
  updatePreferences,
  testNotification,
};
