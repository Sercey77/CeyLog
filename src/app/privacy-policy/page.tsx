import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="prose prose-blue">
        <h1>Privacy Policy</h1>
        <p><strong>Effective Date:</strong> June 3, 2025</p>
        <p>This Privacy Policy outlines how we collect, use, and protect your information when you use the CeyLog platform.</p>
        <h2>1. Information We Collect</h2>
        <ul>
          <li><strong>Account Information:</strong> Name, email address, company name (if corporate), and password.</li>
          <li><strong>Uploaded Content:</strong> Product images and descriptions submitted by users.</li>
          <li><strong>Generated Reports:</strong> Data derived from AI services such as market analysis, buyer matchmaking, and content generation.</li>
          <li><strong>Usage Data:</strong> Logs of user activity, including timestamps and selected services.</li>
        </ul>
        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>Provide AI-powered services like market reports and buyer suggestions.</li>
          <li>Personalize the dashboard based on user profile and interests.</li>
          <li>Improve our algorithms and user experience.</li>
          <li>Send service-related emails and product updates.</li>
        </ul>
        <h2>3. Data Sharing</h2>
        <p>We do not share your data with third parties, except:</p>
        <ul>
          <li>When required by law or legal request.</li>
          <li>To trusted sub-processors (e.g., Stripe, Firebase) for service provision.</li>
        </ul>
        <h2>4. Data Storage &amp; Security</h2>
        <ul>
          <li>Your data is stored securely in encrypted form using Firebase services.</li>
          <li>Authentication is handled via secure protocols.</li>
          <li>Uploaded product images are used solely for report generation purposes.</li>
        </ul>
        <h2>5. Your Rights</h2>
        <ul>
          <li>Access or update your profile.</li>
          <li>Request data deletion or export.</li>
          <li>Opt-out from promotional communication.</li>
        </ul>
        <h2>6. Contact</h2>
        <p>For any privacy-related concerns, contact: <a href="mailto:contact@ceylanlogistics.co.uk">contact@ceylanlogistics.co.uk</a></p>
      </div>
    </main>
  );
} 