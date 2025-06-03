import { useState, useEffect } from 'react';
import { auth, getUserSubscription, SubscriptionType, SUBSCRIPTION_LIMITS } from '@/lib/firebase';

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!auth.currentUser) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      try {
        const userSubscription = await getUserSubscription(auth.currentUser.uid);
        setSubscription(userSubscription);
        setError(null);
      } catch (err) {
        console.error('Error checking subscription:', err);
        setError('Failed to load subscription status');
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, []);

  const isPro = subscription === 'pro';
  const limits = subscription ? SUBSCRIPTION_LIMITS[subscription] : null;

  return {
    subscription,
    loading,
    error,
    isPro,
    limits,
  };
} 