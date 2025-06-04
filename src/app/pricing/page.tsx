'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, getUserSubscription, updateUserSubscription, SubscriptionType } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import SubscriptionCheck from '@/components/SubscriptionCheck';
import Link from 'next/link';
import BackToHome from '@/components/BackToHome';

export default function PricingPage() {
  const router = useRouter();
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingCompany, setCheckingCompany] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!auth.currentUser) {
        router.push('/login');
        return;
      }

      try {
        const subscription = await getUserSubscription(auth.currentUser.uid);
        setCurrentSubscription(subscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [router]);

  const checkCompanyRegistration = async (userId: string): Promise<boolean> => {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking company registration:', error);
      return false;
    }
  };

  const handleUpgrade = async () => {
    if (!auth.currentUser) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);
    setCheckingCompany(true);

    try {
      // Check if user has registered a company
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('userId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Please register your company before upgrading to Pro.');
        router.push('/products/new');
        return;
      }

      // Proceed with Stripe checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: auth.currentUser.email,
          userId: auth.currentUser.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error initiating checkout:', error);
      setError('Failed to initiate checkout. Please try again.');
    } finally {
      setLoading(false);
      setCheckingCompany(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackToHome className="absolute top-4 right-4" />
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose the Right Plan for Your Growth
          </h1>
          <p className="text-xl text-gray-600">
            Start for free, upgrade when you're ready to expand globally.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-red-50 text-red-600 p-4 rounded-md">
              {error}
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Plan</h3>
            <p className="text-4xl font-bold text-gray-900 mb-6">£0<span className="text-lg text-gray-500">/month</span></p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Register and list products
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic dashboard access
              </li>
              <li className="flex items-center text-gray-400">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                No AI reports
              </li>
              <li className="flex items-center text-gray-400">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                No buyer matchmaking
              </li>
              <li className="flex items-center text-gray-400">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                No visibility boost tools
              </li>
            </ul>
            <Link
              href="/register"
              className="block w-full text-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-lg shadow-xl p-8 border-2 border-blue-500 relative">
            <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium">
              Popular
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Pro Plan</h3>
            <p className="text-4xl font-bold text-gray-900 mb-6">£9.99<span className="text-lg text-gray-500">/month</span></p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Full AI reports for products
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Buyer matchmaking with contact info
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                SEO and email content generation
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save and export all reports
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Priority customer support
              </li>
            </ul>
            {currentSubscription === 'pro' ? (
              <div className="text-center text-gray-500">Current Plan</div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading || checkingCompany}
                className="block w-full text-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || checkingCompany ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </div>
                ) : (
                  'Upgrade to Pro'
                )}
              </button>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Can I switch plans later?</h3>
              <p className="mt-2 text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes will take effect immediately.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">What payment methods do you accept?</h3>
              <p className="mt-2 text-gray-600">We accept all major credit cards and PayPal. Payment processing is handled securely through Stripe.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Is there a refund policy?</h3>
              <p className="mt-2 text-gray-600">Yes, we offer a 14-day money-back guarantee for Pro subscriptions. No questions asked.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 