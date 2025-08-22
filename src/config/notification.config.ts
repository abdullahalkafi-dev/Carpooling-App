import { FCMService } from '../app/modules/notification/fcm.service';
import NotificationScheduler from '../app/modules/notification/notification.scheduler';
import config from '../config';
import { logger } from '../shared/logger';

interface FirebaseConfig {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Firebase service account configuration
// You should set these in your environment variables
const serviceAccount: FirebaseConfig = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
  private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL || "",
  client_id: process.env.FIREBASE_CLIENT_ID || "",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL || ""
};

export const initializeNotificationServices = async (): Promise<void> => {
  try {
    // Check if Firebase configuration is provided
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      logger.warn('Firebase configuration not found. Push notifications will be disabled.');
      logger.info('To enable push notifications, set the following environment variables:');
      logger.info('- FIREBASE_PROJECT_ID');
      logger.info('- FIREBASE_PRIVATE_KEY');  
      logger.info('- FIREBASE_CLIENT_EMAIL');
      logger.info('- FIREBASE_PRIVATE_KEY_ID');
      logger.info('- FIREBASE_CLIENT_ID');
      logger.info('- FIREBASE_CLIENT_X509_CERT_URL');
      return;
    }

    // Initialize Firebase Admin SDK
    FCMService.initialize(serviceAccount);
    logger.info('Firebase Admin SDK initialized successfully');

    // Start notification scheduler
    NotificationScheduler.start();
    logger.info('Notification scheduler started successfully');

  } catch (error) {
    logger.error('Failed to initialize notification services:', error);
    throw error;
  }
};

export const cleanupNotificationServices = (): void => {
  try {
    NotificationScheduler.stop();
    logger.info('Notification services cleaned up successfully');
  } catch (error) {
    logger.error('Error cleaning up notification services:', error);
  }
};
