import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import TwitterLoginButton from '../auth/TwitterLoginButton';
import { useAuthContext } from '../../contexts/AuthContext';
import { FaTwitter, FaCheck, FaUnlink } from 'react-icons/fa';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/formatters';

/**
 * Social Accounts Panel Component
 * 
 * Displays user's linked social accounts and provides options to link/unlink
 */
const SocialAccountsPanel = () => {
  const { user } = useAuthContext();
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSocialAccounts() {
      if (!user?.wallet_address) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${user.wallet_address}/social-profiles`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setSocialAccounts(data);
        }
      } catch (error) {
        console.error('Failed to fetch social accounts:', error);
        toast.error('Failed to load linked social accounts');
      } finally {
        setLoading(false);
      }
    }
    
    fetchSocialAccounts();
  }, [user]);
  
  const handleUnlinkAccount = async (platform) => {
    if (!user?.wallet_address) return;
    if (!confirm(`Are you sure you want to unlink your ${platform} account?`)) return;
    
    try {
      const response = await fetch(`/api/users/${user.wallet_address}/social-profiles/${platform}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setSocialAccounts(socialAccounts.filter(account => account.platform !== platform));
        toast.success(`${platform} account unlinked successfully`);
      } else {
        toast.error(`Failed to unlink ${platform} account`);
      }
    } catch (error) {
      console.error(`Failed to unlink ${platform} account:`, error);
      toast.error(`Failed to unlink ${platform} account`);
    }
  };
  
  // Check if Twitter is linked
  const twitterAccount = socialAccounts.find(account => account.platform === 'twitter');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Social Accounts</CardTitle>
        <CardDescription>
          Connect your social media accounts for easier login and more features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4">Loading social accounts...</div>
        ) : (
          <>
            {/* Twitter Account */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FaTwitter className="text-[#1DA1F2] text-xl" />
                <div>
                  <h4 className="font-medium">Twitter</h4>
                  {twitterAccount ? (
                    <div className="text-sm text-gray-500">
                      @{twitterAccount.username}
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <FaCheck /> Verified on {formatDate(twitterAccount.verification_date)}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not connected</p>
                  )}
                </div>
              </div>
              
              <div>
                {twitterAccount ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleUnlinkAccount('twitter')}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <FaUnlink className="mr-1" /> Unlink
                  </Button>
                ) : (
                  <TwitterLoginButton linkMode={true} />
                )}
              </div>
            </div>
            
            {/* Placeholder for future social integrations */}
            <div className="border border-dashed rounded-lg p-4 text-center text-gray-500">
              More social integrations coming soon!
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialAccountsPanel; 