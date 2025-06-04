import { AppProps } from 'next/app';
import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Temporarily disable React DevTools in development
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        inject: () => {},
        onCommitFiberRoot: () => {},
        onScheduleFiberRoot: () => {},
        supportsFiber: true,
        onCommitFiberUnmount: () => {},
      };
    }
  }, []);

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
} 