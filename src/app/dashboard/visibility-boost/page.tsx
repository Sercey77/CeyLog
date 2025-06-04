'use client';

import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useSubscription } from '@/hooks/useSubscription';
import ReportEmailSender from '@/components/ReportEmailSender';
import { useState } from 'react';
import { DashboardLayout, FeatureCard, ContentCard, UpgradeCard } from '@/components/DashboardLayout';

export default function VisibilityBoostPage() {
  const router = useRouter();
  const { isPro, isTrialActive } = useSubscription();
  const [showEmailSender, setShowEmailSender] = useState(false);

  if (!auth.currentUser) {
    router.push('/login');
    return null;
  }

  if (!isPro && !isTrialActive) {
    return (
      <UpgradeCard
        title="Upgrade to Pro"
        description="Get access to advanced visibility boost tools and other premium features."
        buttonText="View Pricing Plans"
        buttonHref="/pricing"
      />
    );
  }

  return (
    <DashboardLayout
      title="AI-Powered Visibility Boost"
      subtitle="Coming Soon: Enhance your online presence with our advanced visibility tools."
    >
      <ContentCard title="Features Preview">
        <ul className="space-y-6">
          <FeatureCard
            title="LinkedIn Post Generation"
            description="Create engaging LinkedIn posts optimized for maximum visibility."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            }
            color="green"
          />
          <FeatureCard
            title="SEO Optimization"
            description="Optimize your content for better search engine visibility."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            color="blue"
          />
          <FeatureCard
            title="Email Content Creation"
            description="Generate compelling email content for your campaigns."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            color="purple"
          />
          <FeatureCard
            title="Performance Analytics"
            description="Track and analyze your content performance metrics."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            color="yellow"
          />
        </ul>
      </ContentCard>

      <ContentCard
        title="Share Visibility Report"
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
              reportId="visibility-boost-demo"
              reportType="visibility-boost"
              reportTitle="Visibility Boost Report"
              onSuccess={() => {
                alert('Visibility boost report sent successfully!');
                setShowEmailSender(false);
              }}
              onError={(error) => {
                alert(`Failed to send visibility boost report: ${error}`);
              }}
            />
          </div>
        )}
      </ContentCard>
    </DashboardLayout>
  );
} 