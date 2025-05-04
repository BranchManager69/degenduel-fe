/**
 * Declaration file for degenduel-shared package
 * 
 * This provides type declarations to satisfy TypeScript during build
 * without needing the actual package in CI environments.
 */

declare module 'degenduel-shared' {
  // Re-export all the types from our local shared-types.ts
  export * from '../types/shared-types';
}