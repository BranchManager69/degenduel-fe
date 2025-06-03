// src/utils/ogImageUtils.ts

/**
 * OG Image Management Utilities
 * 
 * @description Utility functions for dynamically managing Open Graph meta tags
 * for contest and referral pages with dynamic OG images.
 * 
 * IMPORTANT: Contest OG images are server-generated at /api/og/contest/{contestId}
 * The backend takes the contest's stored image and applies DegenDuel branding/logo
 * to create branded social sharing images. This is separate from the raw contest
 * images displayed on the actual pages.
 * 
 * @author BranchManager69
 * @version 1.0.0
 * @created 2025-01-29
 */

import React from 'react';

interface MetaTagConfig {
  property?: string;
  name?: string;
  content: string;
}

interface OGImageConfig {
  title: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
  imageWidth?: string;
  imageHeight?: string;
}

/**
 * Updates or creates a meta tag with the given property/name and content
 */
function updateMetaTag(config: MetaTagConfig): void {
  const { property, name, content } = config;
  
  let selector = '';
  if (property) {
    selector = `meta[property="${property}"]`;
  } else if (name) {
    selector = `meta[name="${name}"]`;
  } else {
    console.warn('updateMetaTag: Either property or name must be provided');
    return;
  }

  let metaTag = document.querySelector(selector) as HTMLMetaElement;
  
  if (!metaTag) {
    metaTag = document.createElement('meta');
    if (property) {
      metaTag.setAttribute('property', property);
    } else if (name) {
      metaTag.setAttribute('name', name);
    }
    document.head.appendChild(metaTag);
  }
  
  metaTag.setAttribute('content', content);
}

/**
 * Sets up all OG image meta tags for a page
 */
export function setupOGImageMeta(config: OGImageConfig): void {
  const { title, description, imageUrl, pageUrl, imageWidth = '1200', imageHeight = '630' } = config;
  
  // Update page title
  document.title = title;
  
  // Open Graph meta tags
  updateMetaTag({ property: 'og:title', content: title });
  updateMetaTag({ property: 'og:description', content: description });
  updateMetaTag({ property: 'og:image', content: imageUrl });
  updateMetaTag({ property: 'og:image:width', content: imageWidth });
  updateMetaTag({ property: 'og:image:height', content: imageHeight });
  updateMetaTag({ property: 'og:type', content: 'website' });
  updateMetaTag({ property: 'og:url', content: pageUrl });
  
  // Twitter Card meta tags
  updateMetaTag({ name: 'twitter:card', content: 'summary_large_image' });
  updateMetaTag({ name: 'twitter:title', content: title });
  updateMetaTag({ name: 'twitter:description', content: description });
  updateMetaTag({ name: 'twitter:image', content: imageUrl });
}

/**
 * Sets up OG meta tags for a contest page
 */
export function setupContestOGMeta(contestId: string, contestName: string, contestDescription?: string): void {
  const baseUrl = window.location.origin;
  const contestUrl = `${baseUrl}/contests/${contestId}`;
  const ogImageUrl = `${baseUrl}/api/og/contest/${contestId}`;
  
  const title = `${contestName} | DegenDuel Contest`;
  const description = contestDescription || 'Join the ultimate crypto trading competition on DegenDuel!';
  
  setupOGImageMeta({
    title,
    description,
    imageUrl: ogImageUrl,
    pageUrl: contestUrl
  });
}

/**
 * Sets up OG meta tags for a referral page
 */
export function setupReferralOGMeta(walletAddress: string, referrerName?: string): void {
  const baseUrl = window.location.origin;
  const referralUrl = `${baseUrl}/referral/${walletAddress}`;
  const ogImageUrl = `${baseUrl}/api/og/referral/${walletAddress}`;
  
  const title = 'Join DegenDuel - Crypto Trading Competition';
  const description = referrerName 
    ? `You've been invited by ${referrerName} to compete in DegenDuel's trading competition!`
    : `You've been invited to compete in DegenDuel's trading competition!`;
  
  setupOGImageMeta({
    title,
    description,
    imageUrl: ogImageUrl,
    pageUrl: referralUrl
  });
}

/**
 * Resets meta tags to default values
 */
export function resetToDefaultMeta(): void {
  const baseUrl = window.location.origin;
  
  setupOGImageMeta({
    title: 'DegenDuel | Live Crypto Trading Contests',
    description: 'Live crypto trading competitions | DegenDuel is crypto\'s first DFS-style portfolio game. Bet on your bags, best the other degens, and win big Solana prizes.',
    imageUrl: `${baseUrl}/assets/media/og_image.png`,
    pageUrl: baseUrl
  });
}

/**
 * Gets the OG image URL for a contest
 */
export function getContestOGImageUrl(contestId: string): string {
  return `${window.location.origin}/api/og/contest/${contestId}`;
}

/**
 * Gets the OG image URL for a referral
 */
export function getReferralOGImageUrl(walletAddress: string): string {
  return `${window.location.origin}/api/og/referral/${walletAddress}`;
}

/**
 * Gets the OG image URL for a token (LIVE - Backend implemented!)
 */
export function getTokenOGImageUrl(tokenSymbol: string): string {
  return `${window.location.origin}/api/og/token/${tokenSymbol}`;
}

/**
 * Sets up OG meta tags for a token page (LIVE - Routes implemented!)
 */
export function setupTokenOGMeta(tokenSymbol: string, tokenName?: string, tokenPrice?: string): void {
  const baseUrl = window.location.origin;
  const tokenUrl = `${baseUrl}/tokens/${tokenSymbol}`;
  const ogImageUrl = getTokenOGImageUrl(tokenSymbol);
  
  const title = tokenName 
    ? `${tokenName} (${tokenSymbol}) | DegenDuel Tokens`
    : `${tokenSymbol} | DegenDuel Tokens`;
  const description = tokenPrice
    ? `Trade ${tokenSymbol} on DegenDuel! Current price: $${tokenPrice}`
    : `Discover ${tokenSymbol} trading data and analytics on DegenDuel`;
  
  setupOGImageMeta({
    title,
    description,
    imageUrl: ogImageUrl,
    pageUrl: tokenUrl
  });
}

/**
 * Preloads an OG image to check if it's available
 */
export function preloadOGImage(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imageUrl;
  });
}

/**
 * Enhanced OG image component with error handling and fallback
 */
export interface OGImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OGImage: React.FC<OGImageProps> = ({
  src,
  alt,
  className = "",
  fallbackText = "Preview generating...",
  onLoad,
  onError
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const handleLoad = React.useCallback(() => {
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = React.useCallback(() => {
    setImageError(true);
    onError?.();
  }, [onError]);

  if (imageError) {
    return (
      <div className={`bg-dark-400/50 rounded-md border border-brand-400/20 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <svg className="w-6 h-6 text-gray-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs text-gray-500">{fallbackText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-dark-400/50 rounded-md border border-brand-400/20 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-6 h-6 text-gray-500 mx-auto mb-1 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-gray-500">Loading...</p>
          </div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover rounded-md border border-brand-400/20 ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
    </div>
  );
};