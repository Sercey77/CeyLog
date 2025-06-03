'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Product } from '@/lib/firestore-schema';

interface MarketAnalysis {
  marketSize: string;
  growthTrends: string;
  keyCompetitors: string;
  targetMarkets: string;
  recommendations: string;
}

export default function MarketAnalysisPage({
  params
}: {
  params: { productId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const productDoc = await getDoc(doc(db, 'products', params.productId));
        if (!productDoc.exists()) {
          setError('Product not found');
          return;
        }

        const productData = productDoc.data() as Product;
        if (productData.createdBy !== user.uid) {
          setError('You do not have permission to view this product');
          return;
        }

        setProduct(productData);
        await generateAnalysis(productData);
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, params.productId]);

  const generateAnalysis = async (productData: Product) => {
    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/generate-market-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: productData.name,
          description: productData.description,
          sector: productData.sector,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate analysis');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Error generating analysis:', err);
      setError('Failed to generate market analysis');
    } finally {
      setGenerating(false);
    }
  };

  const saveReport = async () => {
    if (!analysis || !product) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const reportData = {
        productId: params.productId,
        productName: product.name,
        analysisText: analysis,
        generatedAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid
      };

      await addDoc(collection(db, 'marketReports'), reportData);
      setSuccess('Market analysis saved successfully');
    } catch (err) {
      console.error('Error saving report:', err);
      setError('Failed to save market analysis');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/products')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Products
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Product Info */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {product?.name}
          </h1>
          <p className="text-sm text-gray-500 capitalize mb-4">
            {product?.sector}
          </p>
          <p className="text-gray-600">{product?.description}</p>
        </div>

        {/* Market Analysis */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Market Analysis
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={() => product && generateAnalysis(product)}
                disabled={generating}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Regenerating...
                  </>
                ) : (
                  'Regenerate Analysis'
                )}
              </button>
              <button
                onClick={saveReport}
                disabled={!analysis || saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save to Report'
                )}
              </button>
            </div>
          </div>

          {success && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {success}
                  </p>
                </div>
              </div>
            </div>
          )}

          {generating ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                Generating market analysis...
              </p>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Market Size
                </h3>
                <p className="text-gray-600">{analysis.marketSize}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Growth Trends
                </h3>
                <p className="text-gray-600">{analysis.growthTrends}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Key Competitors
                </h3>
                <p className="text-gray-600">{analysis.keyCompetitors}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Target Markets
                </h3>
                <p className="text-gray-600">{analysis.targetMarkets}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Recommendations
                </h3>
                <p className="text-gray-600">{analysis.recommendations}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No market analysis available. Please try again.
              </p>
              <button
                onClick={() => product && generateAnalysis(product)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Generate Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 