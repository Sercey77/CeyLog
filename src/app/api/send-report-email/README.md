# Send Report Email API

This API endpoint allows authenticated users to send reports via email in various formats (PDF, CSV, DOCX).

## Authentication

All requests must include a valid Firebase authentication token in the Authorization header:

```http
Authorization: Bearer <firebase-token>
```

## Rate Limiting

The API implements rate limiting:
- Maximum 10 requests per hour per user
- Rate limit status is returned in the response headers:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Request Format

```http
POST /api/send-report-email
Content-Type: application/json
Authorization: Bearer <firebase-token>

{
  "recipient": "user@example.com",
  "format": "pdf", // or "csv" or "docx"
  "reportData": {
    // Your report data here
  },
  "message": "Optional custom message" // Optional
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| recipient | string | Yes | Email address of the recipient |
| format | string | Yes | Report format: "pdf", "csv", or "docx" |
| reportData | object | Yes | The data to be included in the report |
| message | string | No | Custom message to include in the email |

## Response Format

### Success Response

```json
{
  "message": "Report sent successfully",
  "messageId": "email-message-id"
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```
or
```json
{
  "error": "Invalid email format"
}
```
or
```json
{
  "error": "Invalid format. Must be pdf, csv, or docx"
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

#### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to send report email"
}
```

## Example Usage

### JavaScript/TypeScript

```typescript
async function sendReport() {
  const response = await fetch('/api/send-report-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${firebaseToken}`,
    },
    body: JSON.stringify({
      recipient: 'user@example.com',
      format: 'pdf',
      reportData: {
        title: 'Monthly Report',
        data: {
          // Your report data
        }
      },
      message: 'Please find your monthly report attached.'
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error);
  }
  return data;
}
```

### cURL

```bash
curl -X POST \
  'https://your-domain.com/api/send-report-email' \
  -H 'Authorization: Bearer <firebase-token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "recipient": "user@example.com",
    "format": "pdf",
    "reportData": {
      "title": "Monthly Report",
      "data": {}
    },
    "message": "Please find your monthly report attached."
  }'
```

## Report Format Details

### PDF Format
- Includes a title and timestamp
- Automatically paginates content
- Uses consistent formatting and spacing
- Supports multiple pages

### CSV Format
- Includes headers
- Uses proper escaping for special characters
- Maintains data structure

### DOCX Format
- Includes a title and timestamp
- Uses proper document structure
- Maintains formatting and spacing

## Security Considerations

1. All requests must be authenticated with a valid Firebase token
2. Rate limiting is implemented to prevent abuse
3. Email addresses are validated before sending
4. All activity is logged in Firestore for audit purposes
5. IP addresses and user agents are logged for security monitoring

## Error Handling

The API includes comprehensive error handling:
- Input validation
- Authentication verification
- Rate limit checking
- Format conversion error handling
- Email sending error handling

All errors are logged in Firestore for monitoring and debugging purposes. 