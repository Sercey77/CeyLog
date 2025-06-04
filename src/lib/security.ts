export function validateOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) {
    return false;
  }

  // Check if origin matches any allowed origin
  return allowedOrigins.some(allowedOrigin => {
    // Exact match
    if (origin === allowedOrigin) {
      return true;
    }

    // Wildcard subdomain match (e.g., *.ceylog.com)
    if (allowedOrigin.startsWith('*.')) {
      const domain = allowedOrigin.slice(2);
      return origin.endsWith(domain);
    }

    return false;
  });
} 