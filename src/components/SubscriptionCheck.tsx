'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, getUserSubscription, SubscriptionType } from '@/lib/firebase';

interface SubscriptionCheckProps {
  children: React.ReactNode;
  requiredSubscription?: SubscriptionType;
  showUpgradePrompt?: boolean;
}

export default function SubscriptionCheck({
  children,
  requiredSubscription = 'pro',
  showUpgradePrompt = true,
}: SubscriptionCheckProps) {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!auth.currentUser) {
        router.push('/login');
        return;
      }

      try {
        const userSubscription = await getUserSubscription(auth.currentUser.uid);
        setSubscription(userSubscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (subscription !== requiredSubscription && showUpgradePrompt) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Upgrade to Pro for Full Access
          </h3>
          <p className="text-gray-600 mb-6">
            You need a Pro subscription to access this feature. Upgrade now to unlock:
          </p>
          <ul className="text-left space-y-3 mb-8">
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Unlimited AI Market Analysis Reports
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Advanced Buyer Matchmaking
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Premium Product Visibility Tools
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Priority Support
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => router.push('/pricing')}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Upgrade to Pro
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 