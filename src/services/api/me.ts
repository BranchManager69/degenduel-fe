/**
 * User Profile API - /me endpoint
 */

import { authDebug } from '../../config/config';
import { API_URL } from '../../config/config';

/**
 * Fetch the current user's full profile data
 * Including profile_image_url and all other user data
 */
export async function fetchUserProfile(token: string): Promise<any> {
  try {
    authDebug('fetchUserProfile', 'Fetching user profile from /me endpoint');
    
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }

    const userData = await response.json();
    authDebug('fetchUserProfile', 'User profile fetched successfully', {
      nickname: userData.nickname,
      hasProfileImage: !!userData.profile_image_url,
      activeContests: userData.active_contests?.length || 0
    });

    return userData;
  } catch (error) {
    authDebug('fetchUserProfile', 'Error fetching user profile', error);
    throw error;
  }
}