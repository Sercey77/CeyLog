import { db } from './firebase-admin';

interface LogActivityParams {
  userId: string;
  recipient: string;
  format: string;
  status: 'sent' | 'error';
  messageId?: string;
  error?: string;
  ipAddress: string;
  userAgent: string;
}

export async function logActivity(data: LogActivityParams): Promise<void> {
  try {
    await db.collection('email_logs').add({
      ...data,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw the error to prevent disrupting the main flow
  }
} 