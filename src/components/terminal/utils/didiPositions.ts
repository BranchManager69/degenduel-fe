/**
 * Didi Position Configuration
 * Defines where Didi should be positioned on different pages
 */

export interface DidiPosition {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  transform?: string;
  scale?: number;
  transition?: string;
}

export interface PositionConfig {
  pattern: RegExp | string;
  position: DidiPosition;
  description: string;
}

// Default position
export const DEFAULT_POSITION: DidiPosition = {
  left: '62.5%',
  bottom: '2px',
  transform: 'translateX(-50%) scale(0.665)',
};

// Page-specific positions
export const POSITION_CONFIGS: PositionConfig[] = [
  {
    pattern: /^\/contests$/,
    position: {
      right: '5px',
      bottom: '5px',
      transform: 'scale(0.665)',
    },
    description: 'Contests browser page - bottom right corner',
  },
  {
    pattern: /\/contests\/\d+\/submit-portfolio/,
    position: {
      right: '20px',
      top: '80px',
      transform: 'scale(0.665)',
    },
    description: 'Submit portfolio page - top right to avoid modal overlap',
  },
  {
    pattern: /\/contests\/\d+\/live/,
    position: {
      right: '5px',
      bottom: '5px',
      transform: 'scale(0.665)',
    },
    description: 'Contest live page - bottom right corner',
  },
  {
    pattern: /\/tokens\/[^\/]+$/,
    position: {
      right: '5px',
      top: '75%',
      transform: 'translateY(-50%) scale(0.665)',
    },
    description: 'Token detail page - lower right (75% down)',
  },
  {
    pattern: /\/tokens$/,
    position: {
      right: '5px',
      top: '50%',
      transform: 'translateY(-50%) scale(0.665)',
    },
    description: 'Tokens page - middle right',
  },
  {
    pattern: /\/profile/,
    position: {
      right: '20px',
      top: '50%',
      transform: 'translateY(-50%) scale(0.665)',
    },
    description: 'Profile pages - middle right',
  },
  {
    pattern: /^\/me$/,
    position: {
      right: '20px',
      top: '50%',
      transform: 'translateY(-50%) scale(0.665)',
    },
    description: 'Private profile page - middle right',
  },
  {
    pattern: /^\/$/,
    position: {
      right: '5px',
      bottom: '5px',
      transform: 'scale(0.665)',
    },
    description: 'Landing page - bottom right corner',
  },
  {
    pattern: /\/admin/,
    position: {
      right: '20px',
      bottom: '80px',
      transform: 'scale(0.665)',
    },
    description: 'Admin pages - bottom right, higher up',
  },
  {
    pattern: /\/contests\/\d+$/,
    position: {
      right: '5px',
      bottom: '5px',
      transform: 'scale(0.665)',
    },
    description: 'Contest detail page - bottom right corner',
  },
  {
    pattern: /\/my-portfolios/,
    position: {
      right: '20px',
      bottom: '20px',
      transform: 'scale(0.665)',
    },
    description: 'My portfolios page - bottom right corner',
  },
  {
    pattern: /\/wallet/,
    position: {
      right: '5px',
      bottom: '80px',
      transform: 'scale(0.665)',
    },
    description: 'Wallet page - bottom right, slightly elevated',
  },
  {
    pattern: /\/contest-credits/,
    position: {
      right: '20px',
      bottom: '80px',
      transform: 'scale(0.665)',
    },
    description: 'Contest credits page - bottom right, higher up',
  },
  {
    pattern: /\/contests\/create/,
    position: {
      right: '20px',
      top: '180px',
      transform: 'scale(0.665)',
    },
    description: 'Create contest page - right side upper middle',
  },
  {
    pattern: /\/contests\/\d+\/select-tokens/,
    position: {
      right: '5px',
      bottom: '50%',
      transform: 'scale(0.665)',
    },
    description: 'Token selection page - middle right (50% up)',
  },
];

/**
 * Get Didi's position based on the current pathname
 */
export function getDidiPosition(pathname: string): DidiPosition {
  // Find matching position config
  const config = POSITION_CONFIGS.find(cfg => {
    if (typeof cfg.pattern === 'string') {
      return pathname === cfg.pattern;
    }
    return cfg.pattern.test(pathname);
  });

  return config?.position || DEFAULT_POSITION;
}

/**
 * Calculate animation duration based on distance
 */
export function calculateTransitionDuration(
  oldPos: DidiPosition,
  newPos: DidiPosition
): number {
  // Base duration
  const baseDuration = 0.8;
  
  // If positions are very different, use longer duration
  const hasPositionChange = 
    oldPos.left !== newPos.left ||
    oldPos.right !== newPos.right ||
    oldPos.top !== newPos.top ||
    oldPos.bottom !== newPos.bottom;

  return hasPositionChange ? baseDuration : 0.3;
}

/**
 * Generate CSS transition string for smooth movement
 */
export function generateTransition(duration: number): string {
  return `all ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`;
}