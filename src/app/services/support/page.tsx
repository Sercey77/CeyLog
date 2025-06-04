'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { useSubscription } from '@/hooks/useSubscription';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import BackToHome from '@/components/BackToHome';
import AIIcon from '@/components/AIIcon';
import Tooltip from '@/components/Tooltip';

export default function SupportPage() {
  const router = useRouter();
  const { isPro, isTrialActive } = useSubscription();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supportRequest = {
        userId: auth.currentUser.uid,
        subject,
        message,
        priority,
        status: 'open',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'supportRequests'), supportRequest);
      setSuccess(true);
      setSubject('');
      setMessage('');
      setPriority('normal');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit support request');
    } finally {
      setIsLoading(false);
    }
  };

  if (!auth.currentUser) {
    router.push('/login');
    return null;
  }

  if (!isPro && !isTrialActive) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <BackToHome />
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
        <BackToHome />
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <AIIcon className="h-10 w-10 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Priority Support</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Tooltip text="Enter a clear subject line to help us understand your request">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
              </Tooltip>
              <div className="mt-1">
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="What do you need help with?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Tooltip text="Provide detailed information about your issue or question">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message
                </label>
              </Tooltip>
              <div className="mt-1">
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Describe your issue or question in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Tooltip text="Select the priority level of your request">
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
              </Tooltip>
              <div className="mt-1">
                <select
                  id="priority"
                  name="priority"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Support Request'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success</h3>
                  <div className="mt-2 text-sm text-green-700">
                    Your support request has been submitted. We'll get back to you soon.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 