// src/hooks/analytics/legacy/useEnhancedDiagnostics.ts
// This is a placeholder for the legacy enhanced diagnostics hook

import { useEffect } from 'react';

/**
 * @deprecated This hook is deprecated. Use the topic-hooks/useService.ts hook instead.
 */
export function useEnhancedDiagnostics() {
  // Display deprecation warning
  useEffect(() => {
    console.warn(
      "⚠️ DEPRECATED: useEnhancedDiagnostics is deprecated and will be removed in a future version.\n" +
      "Please use hooks/websocket/topic-hooks/useService.ts instead."
    );
  }, []);
  
  return {
    isLoading: false,
    error: null,
    diagnostics: {
      cpu: 0,
      memory: 0,
      network: 0,
      disk: 0,
      uptime: 0
    },
    recordDiagnostic: (_metric: string, _value: number) => {
      console.warn('Enhanced diagnostics recording is deprecated');
    },
    getMetric: (_metric: string) => 0
  };
}