import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface SubscriptionStatus {
  isPro: boolean;
  isTrialActive: boolean;
  daysRemaining: number | null;
  hasActiveSubscription: boolean;
}

function parseDate(dateValue: any): Date | null {
  try {
    if (dateValue instanceof Timestamp) {
      return dateValue.toDate();
    }
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }
    if (typeof dateValue === 'number') {
      return new Date(dateValue);
    }
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>({
    isPro: false,
    isTrialActive: false,
    daysRemaining: null,
    hasActiveSubscription: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus({
          isPro: false,
          isTrialActive: false,
          daysRemaining: null,
          hasActiveSubscription: false,
        });
        setLoading(false);
        setError(null);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const createdAt = parseDate(userData.createdAt);
          const now = new Date();
          
          // Calculate trial status
          const trialEndDate = createdAt 
            ? new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
            : null;
          const isTrialActive = trialEndDate ? now < trialEndDate : false;
          const daysRemaining = trialEndDate 
            ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            : null;

          setStatus({
            isPro: userData.subscription === 'pro',
            isTrialActive,
            daysRemaining,
            hasActiveSubscription: userData.subscription === 'pro' || isTrialActive,
          });
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        setError(error instanceof Error ? error : new Error('Unknown error occurred'));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { ...status, loading, error };
} 