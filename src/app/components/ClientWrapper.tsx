'use client';

import { useEffect } from 'react';
import { patchReactDevTools } from '@/lib/debug-devtools';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      patchReactDevTools();
    }
  }, []);

  return <>{children}</>;
} 