/**
 * Frontend Token Image Overrides
 * 
 * For tokens that are missing images or have poor quality images,
 * we can provide frontend overrides by contract address.
 */

interface TokenImageOverride {
  contractAddress: string;
  symbol: string;
  image_url: string;
  header_image_url?: string;
  description?: string;
}

export const TOKEN_IMAGE_OVERRIDES: Record<string, TokenImageOverride> = {
  // SOL - Solana's native token
  'So11111111111111111111111111111111111111112': {
    contractAddress: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    image_url: '/assets/media/logos/solana.svg',
    header_image_url: '/assets/media/logos/solana.svg', // Use same image for header for now
    description: 'Solana native token'
  },
  
  // Add more token overrides here as needed
  // 'CONTRACT_ADDRESS': {
  //   contractAddress: 'CONTRACT_ADDRESS',
  //   symbol: 'TOKEN_SYMBOL',
  //   image_url: '/images/tokens/token-logo.png',
  //   header_image_url: '/images/tokens/token-banner.jpg',
  //   description: 'Token description'
  // },
};

/**
 * Get token image override data by contract address
 */
export const getTokenImageOverride = (contractAddress: string): TokenImageOverride | null => {
  return TOKEN_IMAGE_OVERRIDES[contractAddress] || null;
};

/**
 * Apply token image overrides to a token object
 */
export const applyTokenImageOverrides = (token: any): any => {
  const override = getTokenImageOverride(token.address || token.contractAddress);
  
  if (!override) {
    return token;
  }
  
  return {
    ...token,
    image_url: override.image_url,
    header_image_url: override.header_image_url,
    images: {
      ...token.images,
      imageUrl: override.image_url,
      headerImage: override.header_image_url,
    }
  };
};