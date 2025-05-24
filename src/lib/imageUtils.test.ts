/**
 * Tests for image utility functions
 */

import { getContestImageUrl, getFullImageUrl } from './imageUtils';

// Mock the API_URL for testing
jest.mock('../config/config', () => ({
  API_URL: 'https://degenduel.me/api'
}));

describe('Image Utils', () => {
  describe('getFullImageUrl', () => {
    it('should return undefined for undefined input', () => {
      expect(getFullImageUrl(undefined)).toBeUndefined();
    });

    it('should return full URLs unchanged', () => {
      const httpsUrl = 'https://example.com/image.png';
      const httpUrl = 'http://example.com/image.png';

      expect(getFullImageUrl(httpsUrl)).toBe(httpsUrl);
      expect(getFullImageUrl(httpUrl)).toBe(httpUrl);
    });

    it('should convert absolute paths to full server URLs', () => {
      const relativePath = '/images/contests/DUEL-20250524-1600.png';
      const expected = 'https://degenduel.me/images/contests/DUEL-20250524-1600.png';

      expect(getFullImageUrl(relativePath)).toBe(expected);
    });

    it('should handle relative paths without leading slash', () => {
      const relativePath = 'images/contests/DUEL-20250524-1600.png';
      const expected = 'https://degenduel.me/images/contests/DUEL-20250524-1600.png';

      expect(getFullImageUrl(relativePath)).toBe(expected);
    });
  });

  describe('getContestImageUrl', () => {
    it('should work the same as getFullImageUrl', () => {
      const relativePath = '/images/contests/DUEL-20250524-1600.png';
      const expected = 'https://degenduel.me/images/contests/DUEL-20250524-1600.png';

      expect(getContestImageUrl(relativePath)).toBe(expected);
    });

    it('should return undefined for undefined input', () => {
      expect(getContestImageUrl(undefined)).toBeUndefined();
    });
  });
}); 