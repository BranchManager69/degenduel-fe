// This is a shim for the use-sync-external-store package
// It re-exports the module with a default export to fix compatibility issues with ESM imports

import * as originalModule from 'use-sync-external-store/shim/with-selector';

// Re-export everything from the original module
export * from 'use-sync-external-store/shim/with-selector';

// Also provide a default export
export default originalModule;