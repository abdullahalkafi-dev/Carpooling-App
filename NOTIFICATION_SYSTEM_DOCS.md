# Carpooling App Notification System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Frontend Integration](#frontend-integration)
7. [Push Notifications Setup](#push-notifications-setup)
8. [Usage Examples](#usage-examples)
9. [Troubleshooting](#troubleshooting)

## Overview

The notification system is a comprehensive solution for managing real-time notifications in the carpooling application. It supports:

- **Push Notifications** via Firebase Cloud Messaging (FCM)
- **Scheduled Notifications** for carpool reminders
- **Real-time Messaging** notifications for carpool participants
- **User Preferences** for notification settings
- **Automatic Cleanup** of old notifications

## Architecture

The notification system follows a **functional programming approach** with the following key principles:

- **Modular Functions**: Each functionality is implemented as independent functions
- **No Class Dependencies**: Uses functional exports instead of class-based singletons
- **State Management**: Simple module-level state tracking
- **Consistent Patterns**: Matches the functional approach used across other modules

### System Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   FCM Service   │
│                 │────│                  │────│                 │
│ - React/Vue/etc │    │ - Express Routes │    │ - Firebase      │
│ - FCM Token     │    │ - Socket.IO      │    │ - Push Delivery │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Database      │    │   Scheduler      │    │   Notification  │
│                 │    │                  │    │   Preferences   │
│ - Notifications │    │ - Cron Jobs      │    │                 │
│ - Preferences   │    │ - Auto Reminders │    │ - User Settings │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Core Components

### 1. FCM Service (`fcm.service.ts`)

**Purpose**: Handles Firebase Cloud Messaging for push notifications.

**Key Functions**:
```typescript
export const FCMService = {
  initialize: (serviceAccount: any, databaseURL?: string) => void
  sendNotification: (payload: FCMNotificationPayload) => Promise<boolean>
  sendMulticastNotification: (payload: MulticastNotificationPayload) => Promise<MulticastResult>
  validateToken: (token: string) => Promise<boolean>
  subscribeToTopic: (tokens: string[], topic: string) => Promise<void>
  unsubscribeFromTopic: (tokens: string[], topic: string) => Promise<void>
}
```

**Interfaces**:
```typescript
interface FCMNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: { [key: string]: string };
}

interface MulticastNotificationPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: { [key: string]: string };
}
```

### 2. Notification Service (`notification.service.ts`)

**Purpose**: Main business logic for notification management.

**Key Functions**:
```typescript
const NotificationService = {
  createNotification: (data: CreateNotificationData) => Promise<INotification>
  sendImmediateNotification: (userId, title, message, type, data?) => Promise<void>
  sendMulticastNotification: (userIds, title, message, type, data?) => Promise<void>
  getUserNotifications: (filters: NotificationFilters) => Promise<NotificationList>
  markAsRead: (notificationId: string, userId: string) => Promise<void>
  markAllAsRead: (userId: string) => Promise<void>
  getNotificationPreferences: (userId: string) => Promise<INotificationPreference>
  updateNotificationPreferences: (userId, preferences) => Promise<INotificationPreference>
  cleanupOldNotifications: (daysOld?: number) => Promise<void>
}
```

### 3. Notification Scheduler (`notification.scheduler.ts`)

**Purpose**: Automated scheduling and sending of notifications.

**Key Features**:
- **Cron Jobs**: 
  - Every minute: Process pending notifications
  - Every 5 minutes: Schedule carpool reminders
  - Daily at 2 AM: Cleanup old notifications

**Functions**:
```typescript
const NotificationScheduler = {
  start: () => void
  stop: () => void
  scheduleMessageNotification: (carpoolId, senderId, message, excludeUserId?) => Promise<void>
  scheduleChildPickupNotification: (carpoolId, parentId, childName, pickupTime, driverName) => Promise<void>
}
```

### 4. Configuration (`notification.config.ts`)

**Purpose**: Initialize and configure notification services.

```typescript
export const initializeNotificationServices = async (): Promise<void>
export const cleanupNotificationServices = (): void
```

## API Endpoints

### User Notifications

#### Get User Notifications
```http
GET /api/notifications
Query Parameters:
  - limit: number (default: 20)
  - skip: number (default: 0)
  - isRead: boolean (optional)
  - type: string (optional)
  - carpoolId: string (optional)
```

#### Mark Notification as Read
```http
PATCH /api/notifications/:id/read
```

#### Mark All Notifications as Read
```http
PATCH /api/notifications/read-all
```

#### Get Notification Preferences
```http
GET /api/notifications/preferences
```

#### Update Notification Preferences
```http
PUT /api/notifications/preferences
Body:
{
  "pushNotifications": boolean,
  "emailNotifications": boolean,
  "smsNotifications": boolean,
  "drivingReminders": boolean,
  "participationReminders": boolean,
  "messageNotifications": boolean,
  "childPickupReminders": boolean
}
```

#### Update FCM Token
```http
POST /api/notifications/fcm-token
Body:
{
  "token": "fcm_device_token"
}
```

## Database Schema

### Notifications Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to User
  title: String,
  message: String,
  type: String, // 'driving_reminder', 'participation_reminder', 'carpool_message', 'child_pickup'
  carpoolId: ObjectId, // Reference to Carpool (optional)
  data: Object, // Additional data payload
  isRead: Boolean, // Default: false
  scheduledFor: Date,
  sentAt: Date, // When the notification was actually sent
  status: String, // 'pending', 'sent', 'failed'
  fcmTokens: [String], // FCM tokens used for sending
  createdAt: Date,
  updatedAt: Date
}
```

### NotificationPreferences Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to User
  pushNotifications: Boolean, // Default: true
  emailNotifications: Boolean, // Default: true
  smsNotifications: Boolean, // Default: false
  drivingReminders: Boolean, // Default: true
  participationReminders: Boolean, // Default: true
  messageNotifications: Boolean, // Default: true
  childPickupReminders: Boolean, // Default: true
  createdAt: Date,
  updatedAt: Date
}
```


## Frontend Integration

### 1. Firebase Setup

#### Install Firebase SDK
```bash
# For React/Vue/Angular
npm install firebase
# or
pnpm add firebase
```

#### Initialize Firebase
```javascript
// firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
```

### 2. FCM Token Management

#### Request Permission and Get Token
```javascript
// notificationService.js
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from './firebase';

class NotificationService {
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'your-vapid-key'
        });
        
        // Send token to backend
        await this.updateFCMToken(token);
        return token;
      } else {
        console.log('Notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  }

  async updateFCMToken(token) {
    try {
      const response = await fetch('/api/notifications/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Your auth token
        },
        body: JSON.stringify({ token })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update FCM token');
      }
    } catch (error) {
      console.error('Error updating FCM token:', error);
    }
  }

  setupForegroundMessageListener() {
    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      // Show notification in UI
      this.showInAppNotification(payload);
    });
  }

  showInAppNotification(payload) {
    // Custom in-app notification logic
    // You can use toast libraries like react-toastify, vue-toasted, etc.
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png'
      });
    }
  }
}

export const notificationService = new NotificationService();
```

### 3. Service Worker (for background notifications)

#### Create `public/firebase-messaging-sw.js`
```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  // Your Firebase config
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
```

### 4. React Integration Example

#### Notification Hook
```jsx
// hooks/useNotifications.js
import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    initializeNotifications();
    fetchNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      await notificationService.requestPermission();
      notificationService.setupForegroundMessageListener();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const fetchNotifications = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?' + new URLSearchParams(filters), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
};
```

#### Notification Component
```jsx
// components/NotificationList.jsx
import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationList = () => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (loading) {
    return <div className="notification-loading">Loading notifications...</div>;
  }

  return (
    <div className="notification-container">
      <div className="notification-header">
        <h3>Notifications {unreadCount > 0 && <span className="badge">{unreadCount}</span>}</h3>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="mark-all-read">
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">No notifications yet</div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification._id}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              onClick={() => !notification.isRead && markAsRead(notification._id)}
            >
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-time">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </span>
              </div>
              {!notification.isRead && <div className="unread-indicator"></div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;
```

#### CSS Styles
```css
/* styles/notifications.css */
.notification-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.badge {
  background-color: #ff4444;
  color: white;
  border-radius: 50%;
  padding: 2px 8px;
  font-size: 12px;
  margin-left: 8px;
}

.mark-all-read {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.notification-list {
  space-y: 12px;
}

.notification-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.notification-item:hover {
  background-color: #f5f5f5;
}

.notification-item.unread {
  background-color: #f0f8ff;
  border-left: 4px solid #007bff;
}

.notification-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.notification-content p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.unread-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 8px;
  height: 8px;
  background-color: #007bff;
  border-radius: 50%;
}

.no-notifications {
  text-align: center;
  color: #999;
  padding: 40px;
}

.notification-loading {
  text-align: center;
  padding: 40px;
}
```

### 5. Vue.js Integration Example

#### Vue Composition API Hook
```javascript
// composables/useNotifications.js
import { ref, onMounted } from 'vue';
import { notificationService } from '../services/notificationService';

export function useNotifications() {
  const notifications = ref([]);
  const loading = ref(true);
  const unreadCount = ref(0);

  const initializeNotifications = async () => {
    try {
      await notificationService.requestPermission();
      notificationService.setupForegroundMessageListener();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const fetchNotifications = async (filters = {}) => {
    try {
      loading.value = true;
      const response = await fetch('/api/notifications?' + new URLSearchParams(filters), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      notifications.value = data.notifications;
      unreadCount.value = data.unreadCount;
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      loading.value = false;
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      notifications.value = notifications.value.map(notif => 
        notif._id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      );
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  onMounted(() => {
    initializeNotifications();
    fetchNotifications();
  });

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead
  };
}
```

## Push Notifications Setup

### Environment Variables
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com
```

### Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Cloud Messaging
4. Generate service account key
5. Download the service account JSON file
6. Extract the required environment variables from the JSON

## Usage Examples

### 1. Send Immediate Notification
```typescript
import { NotificationService } from './notification.service';

// Send immediate push notification
await NotificationService.sendImmediateNotification(
  userId,
  'Carpool Update',
  'Your ride is arriving in 5 minutes!',
  'driving_reminder',
  { carpoolId: '12345', driverName: 'John Doe' }
);
```

### 2. Schedule Carpool Reminder
```typescript
import { NotificationService } from './notification.service';

// Schedule notification for later
await NotificationService.createNotification({
  userId: userId,
  title: 'Upcoming Carpool',
  message: 'Don\'t forget about your carpool tomorrow at 8:00 AM',
  type: 'participation_reminder',
  carpoolId: carpoolId,
  scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  data: { eventName: 'School Pickup' }
});
```

### 3. Send Message Notification
```typescript
import { NotificationScheduler } from './notification.scheduler';

// Notify carpool participants about new message
await NotificationScheduler.scheduleMessageNotification(
  carpoolId,
  senderId,
  'Running 10 minutes late!',
  senderId // exclude sender from receiving notification
);
```

### 4. Update User Preferences
```typescript
import { NotificationService } from './notification.service';

await NotificationService.updateNotificationPreferences(userId, {
  pushNotifications: true,
  emailNotifications: false,
  drivingReminders: true,
  messageNotifications: true,
  childPickupReminders: true
});
```

## Troubleshooting

### Common Issues

#### 1. FCM Token Not Received
**Problem**: Frontend not receiving FCM token
**Solutions**:
- Check if notification permission is granted
- Verify VAPID key configuration
- Ensure service worker is properly registered
- Check browser compatibility (Chrome 50+, Firefox 44+)

#### 2. Notifications Not Sending
**Problem**: Backend not sending notifications
**Solutions**:
- Verify Firebase service account configuration
- Check environment variables are loaded correctly
- Ensure FCM service is initialized before use
- Check user has valid FCM token in database

#### 3. Scheduled Notifications Not Working
**Problem**: Cron jobs not executing
**Solutions**:
- Verify NotificationScheduler.start() is called
- Check server timezone settings
- Ensure database connection is stable
- Check for any cron job conflicts

#### 4. Database Connection Issues
**Problem**: Cannot save/retrieve notifications
**Solutions**:
- Verify MongoDB connection string
- Check database permissions
- Ensure notification models are properly imported
- Check for schema validation errors

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=notification:*
```

### Health Check Endpoints
```http
GET /api/health/notifications
GET /api/health/fcm
GET /api/health/scheduler
```

### Monitoring
- Check notification delivery rates in Firebase Console
- Monitor failed notification counts in application logs
- Set up alerts for FCM quota limits
- Track user engagement with notification analytics

## Timezone & Date Handling

### Backend (Server-Side)

#### How Dates are Stored
All date fields in the Carpool model (`startTime`, `startDate`, `estimatedEndTime`, etc.) are stored as **JavaScript Date objects** in MongoDB, which are automatically converted to **UTC**.

**MongoDB Storage Format**:
```javascript
// When you save: new Date('2026-01-10T14:30:00')
// MongoDB stores: ISODate("2026-01-10T14:30:00.000Z")
```

#### Validation
- Frontend sends date/time as **ISO 8601 strings** or custom format strings
- Backend validates as strings (see `carpool.validation.ts`)
- Mongoose automatically converts string dates to UTC Date objects when saving

**Important**: The backend does NOT perform timezone conversion - it assumes dates sent from frontend are already in the correct timezone.

### Frontend (Client-Side)

#### Sending Dates to Backend

**✅ Recommended Approach - Send ISO String with Timezone**:
```javascript
// User selects: "January 10, 2026, 2:30 PM" (in their local timezone)
const userSelectedDate = new Date('2026-01-10T14:30:00'); // Local time
const isoString = userSelectedDate.toISOString(); // Converts to UTC
// Result: "2026-01-10T14:30:00.000Z" (if user is in UTC)
// Result: "2026-01-10T19:30:00.000Z" (if user is in EST -5)

// Send to backend
fetch('/api/carpools', {
  method: 'POST',
  body: JSON.stringify({
    startTime: isoString,
    // ... other fields
  })
});
```

#### Receiving Dates from Backend

When you fetch carpools, dates come back as **ISO strings in UTC**:

```javascript
// Response from backend
{
  "startTime": "2026-01-10T14:30:00.000Z",
  "eventName": "School Pickup"
}

// Convert to user's local timezone for display
const carpool = await response.json();
const localDate = new Date(carpool.startTime); // Automatically converts to local
console.log(localDate.toLocaleString()); // "1/10/2026, 9:30:00 AM" (if user in EST)
```

#### Display in UI

**Option 1: Simple Local Display**:
```javascript
const displayTime = new Date(carpool.startTime).toLocaleString('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short'
});
// Output: "Jan 10, 2026, 2:30 PM" (in user's timezone)
```

**Option 2: Using date-fns or moment.js**:
```javascript
import { format } from 'date-fns';

const displayTime = format(new Date(carpool.startTime), 'MMM dd, yyyy h:mm a');
// Output: "Jan 10, 2026 2:30 PM"
```

**Option 3: Show Specific Timezone**:
```javascript
const displayTime = new Date(carpool.startTime).toLocaleString('en-US', {
  timeZone: 'America/New_York',
  dateStyle: 'medium',
  timeStyle: 'short'
});
// Output: "Jan 10, 2026, 9:30 AM" (EST time, regardless of user's timezone)
```

### Notification Reminders

The notification scheduler calculates reminder times using JavaScript Date arithmetic:

```typescript
// 30 minutes before carpool
const reminderTime = new Date(carpool.startTime.getTime() - 30 * 60 * 1000);

// Day before at 8 PM
const carpoolDate = new Date(carpool.startTime);
const reminderTime = new Date(carpoolDate);
reminderTime.setDate(carpoolDate.getDate() - 1);
reminderTime.setHours(20, 0, 0, 0);
```

**Important**: These calculations are done in **server timezone** (typically UTC). Make sure:
1. Server clock is synchronized (use NTP)
2. Server timezone is set consistently (UTC recommended)
3. All servers in cluster use same timezone

### Best Practices

#### For Frontend Developers

1. **Always store user timezone**:
```javascript
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// Store in user preferences: "America/New_York", "Europe/London", etc.
```

2. **Send dates in ISO format**:
```javascript
// ✅ Good
{ startTime: new Date('2026-01-10T14:30').toISOString() }

// ❌ Bad - ambiguous
{ startTime: '01/10/2026 2:30 PM' }
```

3. **Display dates in user's local timezone**:
```javascript
// ✅ Good
new Date(startTime).toLocaleString()

// ❌ Bad - shows UTC time
startTime // Don't display raw ISO string
```

4. **Handle timezone changes**:
```javascript
// User traveling? Show both timezones
const carpoolTime = new Date(carpool.startTime);
const localTime = carpoolTime.toLocaleString('en-US', { timeZone: userTimezone });
const carpoolLocation = 'America/New_York';
const locationTime = carpoolTime.toLocaleString('en-US', { timeZone: carpoolLocation });

console.log(`Your time: ${localTime}`);
console.log(`Carpool time: ${locationTime}`);
```

#### For Backend Developers

1. **Store in UTC**: Let Mongoose handle conversion
2. **Never manipulate timezone on server**: Frontend handles display
3. **Use UTC for all scheduling logic**
4. **Log timezone in production**: `console.log(new Date().toString())` to verify server timezone

### Example: Complete Flow

**Scenario**: User in Los Angeles (PST, UTC-8) creates a carpool for 2:30 PM their time.

```javascript
// FRONTEND (Los Angeles, PST)
// Step 1: User selects time in local timezone
const userInput = '2026-01-10 14:30'; // 2:30 PM PST
const localDate = new Date(userInput);

// Step 2: Convert to ISO (automatically converts to UTC)
const isoString = localDate.toISOString();
// Result: "2026-01-10T22:30:00.000Z" (10 PM UTC = 2:30 PM PST)

// Step 3: Send to backend
POST /api/carpools
{
  "startTime": "2026-01-10T22:30:00.000Z",
  ...
}

// BACKEND (Server in UTC)
// Step 4: Mongoose saves as Date object
startTime: ISODate("2026-01-10T22:30:00.000Z")

// Step 5: Scheduler calculates reminder (30 min before)
reminderTime: ISODate("2026-01-10T22:00:00.000Z") // 10 PM UTC

// Step 6: At reminder time, send notification
// FCM notification sent at exactly 10 PM UTC = 2 PM PST

// FRONTEND (Receives notification)
// Step 7: Display in user's local time
"Your carpool starts in 30 minutes at 2:30 PM"
```

### Changes Required in Frontend

**✅ No changes required if you're already:**
- Sending dates as ISO strings (`toISOString()`)
- Using `new Date()` to parse dates from API responses
- Displaying with `.toLocaleString()` or date libraries

**⚠️ Changes required if you're:**
- Sending dates in custom string formats (like "23 Oct 2024, 14:38")
  - **Solution**: Convert to ISO before sending
- Displaying raw ISO strings to users
  - **Solution**: Parse to Date and format for display
- Hardcoding timezone conversions
  - **Solution**: Let JavaScript handle it automatically

---

**Note**: This documentation covers the functional-based notification system. All components have been converted from class-based to functional approach for better maintainability and consistency with the rest of the codebase.
