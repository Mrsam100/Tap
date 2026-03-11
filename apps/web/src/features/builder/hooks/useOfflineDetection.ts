import { useEffect } from 'react';
import { useBuilderStore } from './useBuilderStore';

export function useOfflineDetection() {
  const setIsOffline = useBuilderStore((s) => s.setIsOffline);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOffline]);
}
