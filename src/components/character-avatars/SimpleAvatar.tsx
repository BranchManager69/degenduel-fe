import React from 'react';
import { motion } from 'framer-motion';

// Avatar types
export type AvatarType = 'degen' | 'trader' | 'winner' | 'loser' | 'admin' | 'default';

// Avatar colors
export type AvatarColorScheme = 'green' | 'blue' | 'purple' | 'red' | 'orange' | 'gray';

interface SimpleAvatarProps {
  type?: AvatarType;
  colorScheme?: AvatarColorScheme;
  size?: string | number;
  name?: string; // For deterministic generation
  animate?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

// Simple hash function for deterministic colors/types
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

// Color schemes for avatars
const COLOR_SCHEMES: Record<AvatarColorScheme, { bg: string, accent: string, text: string }> = {
  green: { bg: '#10B981', accent: '#059669', text: '#ECFDF5' },
  blue: { bg: '#3B82F6', accent: '#2563EB', text: '#EFF6FF' },
  purple: { bg: '#8B5CF6', accent: '#7C3AED', text: '#F5F3FF' },
  red: { bg: '#EF4444', accent: '#DC2626', text: '#FEF2F2' },
  orange: { bg: '#F97316', accent: '#EA580C', text: '#FFF7ED' },
  gray: { bg: '#6B7280', accent: '#4B5563', text: '#F9FAFB' },
};

// Type-specific emoji and style additions
const TYPE_SPECS: Record<AvatarType, { emoji: string, className: string }> = {
  degen: { emoji: '🚀', className: 'border-2 border-purple-500' },
  trader: { emoji: '📊', className: 'border-2 border-blue-500' },
  winner: { emoji: '🏆', className: 'border-2 border-green-500' },
  loser: { emoji: '📉', className: 'border-2 border-red-500' },
  admin: { emoji: '⚙️', className: 'border-2 border-orange-500' },
  default: { emoji: '👤', className: 'border-2 border-gray-500' },
};

// This creates a simple, colorful avatar with initials and optional emoji
const SimpleAvatar: React.FC<SimpleAvatarProps> = ({
  type = 'default',
  colorScheme,
  size = '64px',
  name,
  animate = false,
  onClick,
  className = '',
  style = {},
}) => {
  // Deterministic generation based on name
  let finalType = type;
  let finalColorScheme = colorScheme;
  
  if (name) {
    // Hash the name to get deterministic values
    const hash = hashString(name);
    
    // If no specific type provided, generate from name
    if (type === 'default') {
      const typeKeys = Object.keys(TYPE_SPECS) as AvatarType[];
      finalType = typeKeys[hash % typeKeys.length];
    }
    
    // If no specific color provided, generate from name
    if (!colorScheme) {
      const colorKeys = Object.keys(COLOR_SCHEMES) as AvatarColorScheme[];
      finalColorScheme = colorKeys[(hash + 3) % colorKeys.length];
    }
  }
  
  // Use provided or deterministic values
  const colorSet = COLOR_SCHEMES[finalColorScheme || 'gray'];
  const typeSpec = TYPE_SPECS[finalType];
  
  // Get initial letters from name (up to 2 characters)
  let initials = '??';
  if (name) {
    const parts = name.split(/[^a-zA-Z0-9]/); // Split by non-alphanumeric chars
    initials = parts
      .filter(part => part.length > 0)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('');
    
    // If only one initial, duplicate it
    if (initials.length === 1) {
      initials = initials[0];
    }
    
    // If no valid initials, use default
    if (initials.length === 0) {
      initials = '??';
    }
  }
  
  // Optional animation
  const animationProps = animate ? {
    animate: { 
      y: [0, -3, 0],
      rotate: [0, 3, 0, -3, 0],
    },
    transition: { 
      duration: 3, 
      repeat: Infinity,
      repeatType: "mirror" as const,
    }
  } : {};

  // Handling sizes
  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  const fontSize = parseInt(sizeValue, 10) * 0.4; // 40% of size for text
  const emojiSize = parseInt(sizeValue, 10) * 0.3; // 30% of size for emoji
  
  return (
    <motion.div 
      className={`simple-avatar relative rounded-full flex items-center justify-center overflow-hidden ${typeSpec.className} ${className}`}
      style={{
        width: sizeValue,
        height: sizeValue,
        backgroundColor: colorSet.bg,
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      onClick={onClick}
      {...animationProps}
    >
      {/* Main avatar with initials */}
      <span 
        style={{ 
          color: colorSet.text,
          fontSize: `${fontSize}px`,
          fontWeight: 'bold',
          lineHeight: 1
        }}
      >
        {initials}
      </span>
      
      {/* Type indicator with emoji */}
      <div 
        className="absolute bottom-0 right-0 rounded-full flex items-center justify-center"
        style={{
          width: `${emojiSize * 1.2}px`, 
          height: `${emojiSize * 1.2}px`,
          backgroundColor: colorSet.accent,
          fontSize: `${emojiSize}px`,
          lineHeight: 1
        }}
      >
        {typeSpec.emoji}
      </div>
    </motion.div>
  );
};

export default SimpleAvatar;