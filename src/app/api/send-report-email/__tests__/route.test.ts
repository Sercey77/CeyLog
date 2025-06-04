import { NextRequest } from 'next/server';
import { POST } from '../route';
import { auth } from '@/lib/firebase-admin';
import { Resend } from 'resend';
import { db } from '@/lib/firebase-admin';

// Mock dependencies
jest.mock('@/lib/firebase-admin', () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
  db: {
    collection: jest.fn(() => ({
      add: jest.fn(),
    })),
  },
}));

jest.mock('resend', () => ({
  Resend: jest.fn(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

describe('POST /api/send-report-email', () => {
  let mockRequest: NextRequest;
  const mockToken = 'mock-token';
  const mockUserId = 'mock-user-id';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Firebase auth
    (auth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: mockUserId });

    // Mock Resend
    (Resend as jest.Mock).mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ data: { id: 'mock-message-id' }, error: null }),
      },
    }));

    // Mock Firestore
    (db.collection as jest.Mock).mockReturnValue({
      add: jest.fn().mockResolvedValue({ id: 'mock-log-id' }),
    });
  });

  it('should return 401 if no authorization header', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 if invalid token format', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
      headers: {
        'Authorization': 'InvalidToken',
      },
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 if token verification fails', async () => {
    (auth.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if request body is invalid', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: 'invalid-email',
        format: 'invalid-format',
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should return 400 if email is too long', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: 'test@example.com',
        format: 'pdf',
        reportData: { test: 'data' },
        message: 'x'.repeat(1001), // Exceeds 1000 character limit
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should return 413 if request is too large', async () => {
    const largeBody = {
      recipient: 'test@example.com',
      format: 'pdf',
      reportData: { data: 'x'.repeat(6 * 1024 * 1024) }, // 6MB
    };

    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
        'Content-Length': '6291456', // 6MB
      },
      body: JSON.stringify(largeBody),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(413);
    expect(data.error).toBe('Request too large');
  });

  it('should return 429 if rate limit is exceeded', async () => {
    // Mock rate limit cache
    const rateLimitCache = new Map();
    rateLimitCache.set(mockUserId, {
      count: 10,
      resetTime: Date.now() + 3600000,
    });

    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: 'test@example.com',
        format: 'pdf',
        reportData: { test: 'data' },
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('Rate limit exceeded. Please try again later.');
  });

  it('should successfully send email in PDF format', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: 'test@example.com',
        format: 'pdf',
        reportData: { test: 'data' },
        message: 'Test message',
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Report sent successfully');
    expect(data.messageId).toBe('mock-message-id');

    // Verify Firestore logging
    expect(db.collection).toHaveBeenCalledWith('email_logs');
    expect(db.collection('email_logs').add).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        recipient: 'test@example.com',
        format: 'pdf',
        status: 'sent',
        messageId: 'mock-message-id',
      })
    );
  });

  it('should successfully send email in CSV format', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: 'test@example.com',
        format: 'csv',
        reportData: { test: 'data' },
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Report sent successfully');
    expect(data.messageId).toBe('mock-message-id');
  });

  it('should successfully send email in DOCX format', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: 'test@example.com',
        format: 'docx',
        reportData: { test: 'data' },
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Report sent successfully');
    expect(data.messageId).toBe('mock-message-id');
  });

  it('should handle email sending error', async () => {
    // Mock Resend error
    (Resend as jest.Mock).mockImplementation(() => ({
      emails: {
        send: jest.fn().mockRejectedValue(new Error('Failed to send email')),
      },
    }));

    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: 'test@example.com',
        format: 'pdf',
        reportData: { test: 'data' },
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to send report email');

    // Verify error logging
    expect(db.collection).toHaveBeenCalledWith('email_logs');
    expect(db.collection('email_logs').add).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        status: 'error',
        error: 'Failed to send email',
      })
    );
  });

  it('should handle format conversion error', async () => {
    // Mock PDF conversion error
    jest.spyOn(global, 'Buffer').mockImplementationOnce(() => {
      throw new Error('Failed to convert to PDF');
    });

    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: 'test@example.com',
        format: 'pdf',
        reportData: { test: 'data' },
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to convert report format');
  });

  it('should handle Firestore logging error', async () => {
    // Mock Firestore error
    (db.collection as jest.Mock).mockReturnValue({
      add: jest.fn().mockRejectedValue(new Error('Failed to log activity')),
    });

    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: 'test@example.com',
        format: 'pdf',
        reportData: { test: 'data' },
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    // Should still return success even if logging fails
    expect(response.status).toBe(200);
    expect(data.message).toBe('Report sent successfully');
  });

  it('should handle malformed JSON in request body', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: 'invalid-json',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should handle missing content type header', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/send-report-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
      body: JSON.stringify({
        recipient: 'test@example.com',
        format: 'pdf',
        reportData: { test: 'data' },
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
}); 