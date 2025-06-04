'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useSubscription } from '@/hooks/useSubscription';
import BackToHome from '@/components/BackToHome';
import AIIcon from '@/components/AIIcon';
import Tooltip from '@/components/Tooltip';
import ExportButton from '@/components/ExportButton';

export default function VisibilityBoostPage() {
  const router = useRouter();
  const { isPro, isTrialActive } = useSubscription();
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/generate-visibility-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productName, productDescription }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate visibility content');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
                Get access to our AI-powered visibility boost tool and other premium features.
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <AIIcon className="h-10 w-10 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Visibility Boost</h1>
            </div>
            {report && (
              <ExportButton
                data={report}
                filename={`visibility-content-${new Date().toISOString().split('T')[0]}`}
              />
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Tooltip text="Enter your product name to generate targeted marketing content">
                <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
                  Product Name
                </label>
              </Tooltip>
              <div className="mt-1">
                <input
                  type="text"
                  id="productName"
                  name="productName"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter your product name..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Tooltip text="Provide a brief description of your product to help generate more relevant content">
                <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700">
                  Product Description
                </label>
              </Tooltip>
              <div className="mt-1">
                <textarea
                  id="productDescription"
                  name="productDescription"
                  rows={4}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Describe your product's key features and benefits..."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Generating Content...' : 'Boost Product Visibility'}
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

          {report && (
            <div className="mt-8 space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">LinkedIn Post</h3>
                  <button
                    onClick={() => copyToClipboard(report.linkedinPost)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{report.linkedinPost}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">SEO Snippet</h3>
                  <button
                    onClick={() => copyToClipboard(report.seoSnippet)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{report.seoSnippet}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Email Pitch</h3>
                  <button
                    onClick={() => copyToClipboard(report.emailPitch)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{report.emailPitch}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 