'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useSubscription } from '@/hooks/useSubscription';
import AIIcon from '@/components/AIIcon';
import Tooltip from '@/components/Tooltip';
import ExportButton from '@/components/ExportButton';
import ReportEmailSender from '@/components/ReportEmailSender';
import { DashboardLayout, FeatureCard, ContentCard, UpgradeCard } from '@/components/DashboardLayout';

export default function ImageReportPage() {
  const router = useRouter();
  const { isPro, isTrialActive } = useSubscription();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmailSender, setShowEmailSender] = useState(false);

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
      formData.append('targetMarket', 'UK'); // Hardcoded for UK market

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
      <UpgradeCard
        title="Upgrade to Pro"
        description="Get access to advanced image analysis tools and other premium features."
        buttonText="View Pricing Plans"
        buttonHref="/pricing"
      />
    );
  }

  return (
    <DashboardLayout
      title="AI-Powered Image Analysis"
      subtitle="Coming Soon: Get detailed insights about your product images."
    >
      <ContentCard title="Features Preview">
        <ul className="space-y-6">
          <FeatureCard
            title="Image Quality Assessment"
            description="Analyze image quality, resolution, and technical aspects."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            color="green"
          />
          <FeatureCard
            title="Object Detection"
            description="Identify and label objects in your product images."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            color="blue"
          />
          <FeatureCard
            title="Style Analysis"
            description="Analyze image style, composition, and visual appeal."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            }
            color="purple"
          />
          <FeatureCard
            title="Improvement Recommendations"
            description="Get AI-powered suggestions to enhance your images."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            color="yellow"
          />
        </ul>
      </ContentCard>

      <ContentCard
        title="Share Image Report"
        action={
          <button
            onClick={() => setShowEmailSender(!showEmailSender)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            {showEmailSender ? 'Hide Email Form' : 'Share Report'}
          </button>
        }
      >
        {showEmailSender && (
          <div className="mt-6">
            <ReportEmailSender
              reportId="image-report-demo"
              reportType="image-report"
              reportTitle="Image Analysis Report"
              onSuccess={() => {
                alert('Image analysis report sent successfully!');
                setShowEmailSender(false);
              }}
              onError={(error) => {
                alert(`Failed to send image analysis report: ${error}`);
              }}
            />
          </div>
        )}
      </ContentCard>
    </DashboardLayout>
  );
} 