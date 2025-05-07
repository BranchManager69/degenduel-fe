// src/hooks/index.ts
// Main hooks barrel file

// Re-export all hooks by category
export * from './analytics';
export * from './auth';
export * from './data';
export * from './social';
export * from './ui';
export * from './utilities';

// Direct exports for backward compatibility with existing imports
// These will be removed in a future release

/** @deprecated - Import from hooks/ui instead */
export { useScrollFooter } from './ui';

/** @deprecated - Import from hooks/ui instead */
export { useScrollHeader } from './ui';

/** @deprecated - Import from hooks/ui instead */
export { useScrollTicker } from './ui';

/** @deprecated - Import from hooks/ui instead */
export { useScrollbarVisibility } from './ui';

/** @deprecated - Import from hooks/utilities instead */
export { useDebounce } from './utilities';

/** @deprecated - Import from hooks/utilities instead */
export { useInterval } from './utilities';

/** @deprecated - Import from hooks/data instead */
export { useStandardizedTokenData } from './data';

/** @deprecated - Import from hooks/data instead */
export { useSolanaTokenData } from './data';

/** @deprecated - Use useMigratedAuth from hooks/auth instead */
export { useMigratedAuth } from './auth';
