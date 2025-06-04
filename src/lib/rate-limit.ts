import { db } from './firebase-admin';

interface RateLimitResult {
  success: boolean;
  message: string;
}

const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
};

export async function rateLimit(userId: string): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.windowMs;

  try {
    // Get user's request count from Firestore
    const snapshot = await db.collection('rate_limits')
      .where('userId', '==', userId)
      .where('timestamp', '>', new Date(windowStart))
      .get();

    const requestCount = snapshot.size;

    if (requestCount >= RATE_LIMIT.maxRequests) {
      return {
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
      };
    }

    // Log the new request
    await db.collection('rate_limits').add({
      userId,
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Rate limit check passed',
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // Allow the request if rate limit check fails
    return {
      success: true,
      message: 'Rate limit check failed, proceeding with request',
    };
  }
} 