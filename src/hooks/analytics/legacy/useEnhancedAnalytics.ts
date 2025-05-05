// src/hooks/analytics/legacy/useEnhancedAnalytics.ts
// This is a placeholder for the legacy enhanced analytics hook

import { useEffect } from 'react';

/**
 * @deprecated This hook is deprecated. Use the topic-hooks/useAnalytics.ts hook instead.
 */
export function useEnhancedAnalytics() {
  // Display deprecation warning
  useEffect(() => {
    console.warn(
      "⚠️ DEPRECATED: useEnhancedAnalytics is deprecated and will be removed in a future version.\n" +
      "Please use hooks/websocket/topic-hooks/useAnalytics.ts instead."
    );
  }, []);
  
  return {
    isLoading: false,
    error: null,
    trackEvent: (_event: string, _data?: any) => {
      console.warn('Enhanced analytics tracking is deprecated');
    },
    pageView: (_page: string) => {
      console.warn('Enhanced analytics page view tracking is deprecated');
    }
  };
}