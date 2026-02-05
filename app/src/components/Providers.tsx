'use client';

import { type ReactNode, useEffect } from 'react';
import { ToastProvider, useToast } from '@/components/ui';

function ToastEventListener({ children }: { children: ReactNode }) {
  const { addToast } = useToast();

  useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      const { message, type } = event.detail;
      addToast(message, type);
    };

    window.addEventListener('toast', handleToast as EventListener);
    return () => {
      window.removeEventListener('toast', handleToast as EventListener);
    };
  }, [addToast]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ToastEventListener>{children}</ToastEventListener>
    </ToastProvider>
  );
}
