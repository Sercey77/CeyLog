'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useSubscription } from '@/hooks/useSubscription';
import BackToHome from '@/components/BackToHome';
import AIIcon from '@/components/AIIcon';
import Tooltip from '@/components/Tooltip';
import ExportButton from '@/components/ExportButton';

export default function ImageIntelReportPage() {
  const router = useRouter();
  const { isPro, isTrialActive } = useSubscription();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [targetMarket, setTargetMarket] = useState('UK');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image/(jpeg|png)')) {
      setError('Please upload a JPG or PNG image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setImage(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !image) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('description', description);
      formData.append('targetMarket', targetMarket);

      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/analyze-image-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate report');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
                Get access to our AI-powered image intelligence tool and other premium features.
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
              <h1 className="text-2xl font-bold text-gray-900">Image Intelligence Report</h1>
            </div>
            {report && (
              <ExportButton
                data={report}
                filename={`image-report-${new Date().toISOString().split('T')[0]}`}
              />
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Tooltip text="Upload a clear image of your product (JPG or PNG, max 5MB)">
                <label className="block text-sm font-medium text-gray-700">
                  Product Image
                </label>
              </Tooltip>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-32 w-32 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImage(null);
                          setImagePreview(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full text-red-600 hover:bg-red-200"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="image-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="image-upload"
                        name="image-upload"
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png"
                        onChange={handleImageChange}
                        ref={fileInputRef}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                </div>
              </div>
            </div>

            <div>
              <Tooltip text="Add any additional details about your product to help with analysis">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Product Description (Optional)
                </label>
              </Tooltip>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Add any additional details about your product..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Tooltip text="Select the target market for your product analysis">
                <label htmlFor="targetMarket" className="block text-sm font-medium text-gray-700">
                  Target Market
                </label>
              </Tooltip>
              <div className="mt-1">
                <select
                  id="targetMarket"
                  name="targetMarket"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                >
                  <option value="UK">United Kingdom</option>
                  <option value="EU">European Union</option>
                  <option value="US">United States</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !image}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Generating Report...' : 'Generate Market Report from Image'}
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Product Name</h4>
                    <p className="mt-1 text-gray-900">{report.productName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Category</h4>
                    <p className="mt-1 text-gray-900">{report.category}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Quality Assessment</h4>
                    <p className="mt-1 text-gray-900">{report.quality}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Key Features</h4>
                    <ul className="mt-1 list-disc pl-5 space-y-1">
                      {report.features.map((feature: string, index: number) => (
                        <li key={index} className="text-gray-900">{feature}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Materials</h4>
                    <ul className="mt-1 list-disc pl-5 space-y-1">
                      {report.materials.map((material: string, index: number) => (
                        <li key={index} className="text-gray-900">{material}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Use Cases</h4>
                    <ul className="mt-1 list-disc pl-5 space-y-1">
                      {report.useCases.map((useCase: string, index: number) => (
                        <li key={index} className="text-gray-900">{useCase}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customs & Taxes</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">HTS/HS Code</h4>
                    <p className="mt-1 text-gray-900">{report.htsCode}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Import Duty</h4>
                    <p className="mt-1 text-gray-900">{report.importDuty}%</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">VAT</h4>
                    <p className="mt-1 text-gray-900">{report.vat}%</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Tax Exemptions</h4>
                    <p className="mt-1 text-gray-900">{report.taxExemptions || 'None'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Regulatory Notes</h4>
                    <p className="mt-1 text-gray-900">{report.regulatoryNotes}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Market Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Price Range</h4>
                    <p className="mt-1 text-gray-900">
                      {report.priceRange.min} - {report.priceRange.max} {report.priceRange.currency}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{report.priceRange.notes}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Market Trends</h4>
                    <div className="mt-2 space-y-2">
                      <p><span className="font-medium">Demand:</span> {report.marketTrends.demand}</p>
                      <p><span className="font-medium">Growth:</span> {report.marketTrends.growth}</p>
                      <p><span className="font-medium">Competition:</span> {report.marketTrends.competition}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Target Demographics</h4>
                    <div className="mt-2 space-y-4">
                      {report.targetDemographics.map((demographic: any, index: number) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <p className="font-medium">{demographic.segment}</p>
                          <p className="text-sm text-gray-600 mt-1">{demographic.reasoning}</p>
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Recommended Channels:</p>
                            <ul className="mt-1 list-disc pl-5 space-y-1">
                              {demographic.channels.map((channel: string, idx: number) => (
                                <li key={idx} className="text-sm text-gray-600">{channel}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Visibility & Positioning</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Suggested Channels</h4>
                    <div className="mt-2 space-y-4">
                      {report.suggestedChannels.map((channel: any, index: number) => (
                        <div key={index} className="border-l-4 border-green-500 pl-4">
                          <p className="font-medium">{channel.channel}</p>
                          <p className="text-sm text-gray-600 mt-1">{channel.reasoning}</p>
                          <p className="text-sm text-gray-500 mt-1">Estimated Reach: {channel.estimatedReach}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Positioning Tips</h4>
                    <div className="mt-2 space-y-4">
                      {report.positioningTips.map((tip: any, index: number) => (
                        <div key={index} className="border-l-4 border-purple-500 pl-4">
                          <p className="font-medium">{tip.tip}</p>
                          <p className="text-sm text-gray-600 mt-1">{tip.implementation}</p>
                          <p className="text-sm text-gray-500 mt-1">Expected Impact: {tip.expectedImpact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Market Entry Strategy</h4>
                    <p className="mt-1 text-gray-900">{report.marketEntryStrategy}</p>
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