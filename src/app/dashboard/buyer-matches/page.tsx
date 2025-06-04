'use client';

import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useSubscription } from '@/hooks/useSubscription';
import ReportEmailSender from '@/components/ReportEmailSender';
import { useState, useEffect } from 'react';
import { DashboardLayout, FeatureCard, ContentCard, UpgradeCard } from '@/components/DashboardLayout';

export default function BuyerMatchesPage() {
  const router = useRouter();
  const { isPro, isTrialActive } = useSubscription();
  const [showEmailSender, setShowEmailSender] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      router.push('/login');
    }
  }, []);

  if (!auth.currentUser) {
    return null;
  }

  if (!isPro && !isTrialActive) {
    return (
      <UpgradeCard
        title="Upgrade to Pro"
        description="Get access to advanced buyer matching tools and other premium features."
        buttonText="View Pricing Plans"
        buttonHref="/pricing"
      />
    );
  }

  return (
    <DashboardLayout
      title="AI-Powered Buyer Matching"
      subtitle="Coming Soon: Find your perfect buyers with our advanced matching algorithm."
    >
      <ContentCard title="Features Preview">
        <ul className="space-y-6">
          <FeatureCard
            title="Smart Matching"
            description="Our AI analyzes buyer preferences and behavior to find the best matches."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="green"
          />
          <FeatureCard
            title="Preference Analysis"
            description="Understand buyer preferences and requirements in detail."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            color="blue"
          />
          <FeatureCard
            title="Match Scoring"
            description="Get detailed match scores and compatibility analysis."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            }
            color="purple"
          />
          <FeatureCard
            title="Contact Management"
            description="Easily manage and track your buyer interactions."
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            color="yellow"
          />
        </ul>
      </ContentCard>

      <ContentCard
        title="Share Buyer Matches"
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
              reportId="buyer-matches-demo"
              reportType="buyer-matches"
              reportTitle="Buyer Matches Report"
              onSuccess={() => {
                alert('Buyer matches report sent successfully!');
                setShowEmailSender(false);
              }}
              onError={(error) => {
                alert(`Failed to send buyer matches report: ${error}`);
              }}
            />
          </div>
        )}
      </ContentCard>
    </DashboardLayout>
  );
} 