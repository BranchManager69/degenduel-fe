/**
 * Declaration file for degenduel-shared package
 * 
 * This provides type declarations to satisfy TypeScript during build
 * without needing the actual package in CI environments.
 * 
 * This file ensures that any imports from 'degenduel-shared' will resolve
 * to our local type definitions in shared-types.ts.
 */

declare module 'degenduel-shared' {
  // Re-export all the types from our local shared-types.ts
  export * from '../types/shared-types';
  
  // Ensure DDWebSocketMessageType is exported properly
  export { DDWebSocketMessageType } from '../types/shared-types';
  
  // Ensure DDWebSocketTopic is exported properly  
  export { DDWebSocketTopic } from '../types/shared-types';
}