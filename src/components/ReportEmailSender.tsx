'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface ReportEmailSenderProps {
  reportId: string;
  reportType: 'market-analysis' | 'buyer-matches' | 'visibility-boost' | 'image-report';
  reportTitle: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type ExportFormat = 'pdf' | 'csv' | 'docx';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'default',
    name: 'Default',
    subject: '${reportTitle} - Ceylog Report',
    body: 'Please find your requested report attached.\n\nBest regards,\nThe Ceylog Team',
  },
  {
    id: 'formal',
    name: 'Formal',
    subject: '${reportTitle} - Ceylog Business Report',
    body: 'Dear recipient,\n\nPlease find attached the requested ${reportTitle}.\n\nWe hope this information is valuable for your business needs.\n\nBest regards,\nThe Ceylog Team',
  },
  {
    id: 'brief',
    name: 'Brief',
    subject: '${reportTitle}',
    body: 'Here\'s your report.\n\nBest,\nCeylog',
  },
];

export default function ReportEmailSender({
  reportId,
  reportType,
  reportTitle,
  onSuccess,
  onError,
}: ReportEmailSenderProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [recentRecipients, setRecentRecipients] = useState<string[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  useEffect(() => {
    // Fetch recent recipients from Firestore
    const fetchRecentRecipients = async () => {
      setIsLoadingRecipients(true);
      setError(null);

      try {
        // Check if user is authenticated
        const user = auth.currentUser;
        if (!user) {
          console.warn('User not authenticated. Skipping recent recipients fetch.');
          return;
        }

        const emailLogsRef = collection(db, 'emailLogs');
        const q = query(
          emailLogsRef,
          where('userId', '==', user.uid),
          where('reportType', '==', reportType),
          orderBy('sentAt', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        const recipients = new Set<string>();
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.recipientEmail) {
            recipients.add(data.recipientEmail);
          }
        });
        
        setRecentRecipients(Array.from(recipients));
      } catch (error) {
        console.error('Error fetching recent recipients:', error);
        setError('Failed to load recent recipients');
      } finally {
        setIsLoadingRecipients(false);
      }
    };

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchRecentRecipients();
      } else {
        setRecentRecipients([]);
      }
    });

    return () => unsubscribe();
  }, [reportType]);

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const validateEmailList = (emails: string) => {
    if (!emails) return true;
    return emails.split(',').every(email => validateEmail(email.trim()));
  };

  const handleTemplateChange = (templateId: string) => {
    const template = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setMessage(template.body.replace('${reportTitle}', reportTitle));
      setSelectedTemplate(templateId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter a recipient email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (cc && !validateEmailList(cc)) {
      setError('Please enter valid CC email addresses (comma-separated)');
      return;
    }

    if (bcc && !validateEmailList(bcc)) {
      setError('Please enter valid BCC email addresses (comma-separated)');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/send-report-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          reportType,
          reportTitle,
          recipientEmail: email,
          cc: cc ? cc.split(',').map(e => e.trim()) : [],
          bcc: bcc ? bcc.split(',').map(e => e.trim()) : [],
          format,
          message,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send report');
      }

      onSuccess?.();
      setEmail('');
      setCc('');
      setBcc('');
      setMessage('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send report';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Send Report via Email</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Template Selection */}
        <div>
          <label htmlFor="template" className="block text-sm font-medium text-gray-700">
            Email Template
          </label>
          <select
            id="template"
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={isSending}
          >
            {DEFAULT_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Recipient Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter recipient's email address"
            disabled={isSending}
          />
        </div>

        {/* Recent Recipients */}
        {isLoadingRecipients ? (
          <div className="text-sm text-gray-500">Loading recent recipients...</div>
        ) : recentRecipients.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {recentRecipients.map((recipient) => (
              <button
                key={recipient}
                type="button"
                onClick={() => setEmail(recipient)}
                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {recipient}
              </button>
            ))}
          </div>
        ) : null}

        {/* Advanced Options Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-4">
            {/* CC Input */}
            <div>
              <label htmlFor="cc" className="block text-sm font-medium text-gray-700">
                CC (comma-separated)
              </label>
              <input
                type="text"
                id="cc"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="cc1@example.com, cc2@example.com"
                disabled={isSending}
              />
            </div>

            {/* BCC Input */}
            <div>
              <label htmlFor="bcc" className="block text-sm font-medium text-gray-700">
                BCC (comma-separated)
              </label>
              <input
                type="text"
                id="bcc"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="bcc1@example.com, bcc2@example.com"
                disabled={isSending}
              />
            </div>
          </div>
        )}

        {/* Format Selection */}
        <div>
          <label htmlFor="format" className="block text-sm font-medium text-gray-700">
            Export Format
          </label>
          <select
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={isSending}
          >
            <option value="pdf">PDF Document</option>
            <option value="csv">CSV Spreadsheet</option>
            <option value="docx">Word Document</option>
          </select>
        </div>

        {/* Optional Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Optional Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Add a personal message to your email..."
            disabled={isSending}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSending}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${isSending 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
          >
            {isSending ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              'Send Report'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 