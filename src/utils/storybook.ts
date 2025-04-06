// src/utils/storybook.ts

/**
 * Utility functions for Storybook integration
 * This file provides a clean way to check if code is running in Storybook
 * without directly accessing window.STORYBOOK_ENV throughout the codebase
 */

/**
 * Checks if the current environment is Storybook
 * @returns boolean True if running in Storybook environment
 */
export const isStorybook = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).STORYBOOK_ENV;
};

/**
 * Get the Storybook base path (if any)
 * @returns string|undefined The base path when Storybook is served from a subpath
 */
export const getStorybookBasePath = (): string | undefined => {
  return typeof window !== 'undefined' ? (window as any).STORYBOOK_BASE_PATH : undefined;
};

/**
 * Safe check if code is running in Storybook before accessing window properties
 * @returns object with utilities for conditional code execution
 */
export const storybookHelpers = {
  isStorybook,
  getBasePath: getStorybookBasePath,
  
  /**
   * Run code only in non-Storybook environments
   * @param callback Function to execute if not in Storybook
   */
  runIfNotStorybook: (callback: () => void): void => {
    if (!isStorybook()) {
      callback();
    }
  },
  
  /**
   * Run code only in Storybook environment
   * @param callback Function to execute if in Storybook
   */
  runIfStorybook: (callback: () => void): void => {
    if (isStorybook()) {
      callback();
    }
  }
};

export default storybookHelpers;