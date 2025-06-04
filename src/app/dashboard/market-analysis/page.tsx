'use client';

import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useSubscription } from '@/hooks/useSubscription';
import ReportEmailSender from '@/components/ReportEmailSender';
import { useState } from 'react';
import { DashboardLayout, FeatureCard, ContentCard, UpgradeCard } from '@/components/DashboardLayout';
import MarketTrendAnalysisForm from '@/components/MarketTrendAnalysisForm';

export default function MarketAnalysisPage() {
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
        description="Get access to advanced market analysis tools and other premium features."
        buttonText="View Pricing Plans"
        buttonHref="/pricing"
      />
    );
  }

  return (
    <DashboardLayout
      title="AI-Powered Market Analysis"
      subtitle="Analyze market trends, demand cycles, and keyword popularity for your product."
    >
      <ContentCard title="Market Trend Analysis Tool">
        <MarketTrendAnalysisForm />
      </ContentCard>
      <ContentCard title="Features Preview">
        <ul className="space-y-6">
          <FeatureCard
            title="Market Trend Analysis"
            description="Get real-time insights into market trends and consumer behavior."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            color="green"
          />
          <FeatureCard
            title="Competitor Insights"
            description="Analyze competitor strategies and market positioning."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="blue"
          />
          <FeatureCard
            title="Growth Opportunities"
            description="Identify untapped markets and growth potential."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            color="purple"
          />
          <FeatureCard
            title="Custom Reports"
            description="Generate detailed reports tailored to your specific needs."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            color="yellow"
          />
        </ul>
      </ContentCard>

      <ContentCard
        title="Share Market Analysis"
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
              reportId="market-analysis-demo"
              reportType="market-analysis"
              reportTitle="Market Analysis Report"
              onSuccess={() => {
                alert('Market analysis report sent successfully!');
                setShowEmailSender(false);
              }}
              onError={(error) => {
                alert(`Failed to send market analysis report: ${error}`);
              }}
            />
          </div>
        )}
      </ContentCard>
    </DashboardLayout>
  );
} 