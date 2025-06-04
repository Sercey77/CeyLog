'use client';

import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useSubscription } from '@/hooks/useSubscription';
import AIIcon from '@/components/AIIcon';

export default function SupportPage() {
  const router = useRouter();
  const { isPro, isTrialActive } = useSubscription();

  if (!auth.currentUser) {
    router.push('/login');
    return null;
  }

  if (!isPro && !isTrialActive) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Upgrade to Pro</h2>
              <p className="text-gray-600 mb-6">
                Get access to our priority support service and other premium features.
              </p>
              <button
                onClick={() => router.push('/pricing')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Pricing Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <AIIcon className="h-10 w-10 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Priority Support</h1>
          </div>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon</h2>
            <p className="text-gray-600">
              Our priority support service is under development. This feature will provide you with:
            </p>
            <ul className="mt-4 text-left list-disc list-inside space-y-2 text-gray-600">
              <li>24/7 dedicated support team access</li>
              <li>Priority response to your inquiries</li>
              <li>Expert guidance on platform usage</li>
              <li>Custom solutions for your business needs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 