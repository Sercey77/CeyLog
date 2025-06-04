import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { Resend } from 'resend';
import { PDFDocument, rgb, StandardFonts, RotationTypes } from 'pdf-lib';
import { Parser } from 'json2csv';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { db } from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { rateLimit } from '@/lib/rate-limit';
import { validateOrigin } from '@/lib/security';
import { logActivity } from '@/lib/logging';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Constants
const MAX_REQUEST_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_EMAIL_LENGTH = 1000; // characters
const MAX_REPORT_SIZE = 100 * 1024; // 100KB
const ALLOWED_ORIGINS = ['https://ceylog.com', 'https://app.ceylog.com'];
const ALLOWED_EMAIL_DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];

// Request validation schema with enhanced security
const requestSchema = z.object({
  recipient: z.string()
    .email()
    .refine((email) => {
      const domain = email.split('@')[1];
      return ALLOWED_EMAIL_DOMAINS.includes(domain);
    }, 'Email domain not allowed'),
  format: z.enum(['pdf', 'csv', 'docx']),
  reportData: z.record(z.any())
    .refine(
      (data) => JSON.stringify(data).length <= MAX_REPORT_SIZE,
      'Report data exceeds maximum size'
    )
    .refine(
      (data) => !containsSensitiveData(data),
      'Report contains sensitive data'
    ),
  message: z.string()
    .max(MAX_EMAIL_LENGTH)
    .transform((msg) => sanitizeHtml(msg, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a'],
      allowedAttributes: {
        a: ['href']
      }
    }))
    .optional(),
});

// Check for sensitive data in report
function containsSensitiveData(data: any): boolean {
  const sensitivePatterns = [
    /\b\d{16}\b/, // Credit card numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
    /\b[A-Z]{2}\d{2}[A-Z]{2}\d{4}\b/, // Vehicle numbers
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP addresses
  ];

  const jsonString = JSON.stringify(data);
  return sensitivePatterns.some(pattern => pattern.test(jsonString));
}

// Convert report data to PDF with enhanced formatting and security
async function convertToPDF(reportData: any): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  // Add security features
  pdfDoc.setTitle('Ceylog Report');
  pdfDoc.setAuthor('Ceylog');
  pdfDoc.setCreationDate(new Date());
  pdfDoc.setModificationDate(new Date());
  
  // Add watermark
  page.drawText('CONFIDENTIAL', {
    x: width / 2 - 50,
    y: height / 2,
    size: 40,
    font,
    color: rgb(0.9, 0.9, 0.9),
    rotate: { type: RotationTypes.Degrees, angle: 45 },
  });

  // Add title
  page.drawText('Ceylog Report', {
    x: 50,
    y: height - 50,
    size: 20,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Add timestamp
  page.drawText(`Generated on: ${new Date().toLocaleString()}`, {
    x: 50,
    y: height - 80,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Add content with better formatting
  const content = JSON.stringify(reportData, null, 2);
  const lines = content.split('\n');
  let y = height - 120;
  
  for (const line of lines) {
    if (y < 50) {
      // Add new page if content exceeds page height
      const newPage = pdfDoc.addPage();
      y = newPage.getSize().height - 50;
    }
    
    page.drawText(line, {
      x: 50,
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 15;
  }

  return Buffer.from(await pdfDoc.save());
}

// Convert report data to CSV with enhanced formatting and security
function convertToCSV(reportData: any): string {
  const parser = new Parser({
    header: true,
    delimiter: ',',
    quote: '"',
  });
  
  // Sanitize data before parsing
  const sanitizedData = JSON.parse(JSON.stringify(reportData, (key, value) => {
    if (typeof value === 'string') {
      return value.replace(/[<>]/g, '');
    }
    return value;
  }));
  
  return parser.parse(sanitizedData);
}

// Convert report data to DOCX with enhanced formatting and security
async function convertToDOCX(reportData: any): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: 'Ceylog Report',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 200,
          },
        }),
        new Paragraph({
          text: `Generated on: ${new Date().toLocaleString()}`,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 200,
          },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: JSON.stringify(reportData, null, 2),
              size: 24,
            }),
          ],
        }),
      ],
    }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function POST(request: Request) {
  let authHeader: string | null = null;
  let decodedToken: any = null;
  let body: any = null;

  try {
    // Validate origin
    const origin = request.headers.get('origin');
    if (!validateOrigin(origin, ALLOWED_ORIGINS)) {
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403 }
      );
    }

    // Check request size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    // Get authorization header
    authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify Firebase token
    const token = authHeader.split('Bearer ')[1];
    decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check rate limit
    const rateLimitResult = await rateLimit(userId);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    // Parse request body
    body = await request.json();

    // Validate request body using Zod schema
    try {
      const validatedData = requestSchema.parse(body);
      body = validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        );
      }
      throw error;
    }

    const { recipient, format, reportData, message } = body;

    // Convert report data to requested format
    let attachment: { filename: string; content: Buffer | string };
    try {
      switch (format) {
        case 'pdf':
          attachment = {
            filename: 'report.pdf',
            content: await convertToPDF(reportData),
          };
          break;
        case 'csv':
          attachment = {
            filename: 'report.csv',
            content: convertToCSV(reportData),
          };
          break;
        case 'docx':
          attachment = {
            filename: 'report.docx',
            content: await convertToDOCX(reportData),
          };
          break;
        default:
          throw new Error('Invalid format');
      }
    } catch (error) {
      console.error('Error converting report format:', error);
      return NextResponse.json(
        { error: 'Failed to convert report format' },
        { status: 500 }
      );
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Ceylog Reports <reports@ceylog.com>',
      to: recipient,
      subject: 'Your Report from Ceylog',
      text: message || 'Please find your requested report attached.',
      attachments: [attachment],
    });

    if (error) {
      throw error;
    }

    // Get request headers
    const requestHeaders = await headers();
    const ipAddress = requestHeaders.get('x-forwarded-for') || 'unknown';
    const userAgent = requestHeaders.get('user-agent') || 'unknown';

    // Log successful email activity
    await logActivity({
      userId,
      recipient,
      format,
      status: 'sent',
      messageId: data?.id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      message: 'Report sent successfully',
      messageId: data?.id,
    });

  } catch (error) {
    console.error('Error sending report email:', error);
    
    // Get request headers
    const requestHeaders = await headers();
    const ipAddress = requestHeaders.get('x-forwarded-for') || 'unknown';
    const userAgent = requestHeaders.get('user-agent') || 'unknown';
    
    // Log error
    if (error instanceof Error) {
      await logActivity({
        userId: authHeader ? decodedToken?.uid : 'unknown',
        recipient: body?.recipient,
        format: body?.format,
        status: 'error',
        error: error.message,
        ipAddress,
        userAgent,
      });
    }

    return NextResponse.json(
      { error: 'Failed to send report email' },
      { status: 500 }
    );
  }
} 