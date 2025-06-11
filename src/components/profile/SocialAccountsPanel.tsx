import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FaCheck, FaTwitter, FaUnlink } from "react-icons/fa";

// import { useAuthContext } from "../../contexts/AuthContext"; // Legacy
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth"; // Use new hook
import { formatDate } from "../../lib/utils";
import TwitterLoginButton from "../auth/TwitterLoginButton";
import { Button } from "../ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";

interface SocialAccount {
  platform: string;
  username: string;
  verification_date: string;
}

/**
 * Social Accounts Panel Component
 *
 * Displays user's linked social accounts and provides options to link/unlink
 * Styled with cyberspace aesthetics to match the DegenDuel theme
 */
const SocialAccountsPanel = () => {
  const { user } = useMigratedAuth(); // Changed to useMigratedAuth
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSocialAccounts() {
      if (!user?.wallet_address) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/users/${user.wallet_address}/social-profiles`,
          {
            credentials: "include",
          },
        );

        if (response.ok) {
          const data = await response.json();
          setSocialAccounts(data);
        } else {
          console.warn(
            `Social profiles endpoint returned ${response.status}`,
            await response.text(),
          );
          // For now, use empty array to prevent UI errors
          setSocialAccounts([]);
        }
      } catch (error) {
        console.error("Failed to fetch social accounts:", error);
        // For now, don't show error toast since this is expected until backend is ready
        // toast.error('Failed to load linked social accounts');

        // Use empty array to prevent UI errors
        setSocialAccounts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSocialAccounts();
  }, [user]);

  const handleUnlinkAccount = async (platform: string) => {
    if (!user?.wallet_address) return;
    if (!confirm(`Are you sure you want to unlink your ${platform} account?`))
      return;

    try {
      const response = await fetch(
        `/api/users/${user.wallet_address}/social-profiles/${platform}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.ok) {
        setSocialAccounts(
          socialAccounts.filter((account) => account.platform !== platform),
        );
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
  const twitterAccount = socialAccounts.find(
    (account) => account.platform === "twitter",
  );

  return (
    <Card className="bg-dark-300/50 backdrop-blur-sm relative overflow-hidden">
      {/* Gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-brand-800/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(153,51,255,0.15),transparent_70%)]" />

      <CardHeader className="relative">
        <CardTitle className="text-xl font-cyber bg-gradient-to-r from-brand-200 to-brand-400 bg-clip-text text-transparent">
          Linked Social Accounts
        </CardTitle>
        <CardDescription className="text-gray-400">
          Connect your social media accounts for easier login and more features
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        {loading ? (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-400"></div>
            <p className="mt-2 text-brand-300/70">Loading accounts...</p>
          </div>
        ) : (
          <>
            {/* Twitter Account */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-dark-400/30 hover:bg-dark-400/40 transition-all duration-300 group relative overflow-hidden">
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

              <div className="flex items-center gap-3">
                <div className="p-2 bg-dark-500/60 rounded-full shadow-lg">
                  <FaTwitter className="text-[#1DA1F2] text-xl" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Twitter</h4>
                  {twitterAccount ? (
                    <div>
                      <div className="text-sm text-brand-200">
                        @{twitterAccount.username}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <FaCheck /> Verified on{" "}
                        {formatDate(twitterAccount.verification_date)}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Not connected</p>
                  )}
                </div>
              </div>

              <div>
                {twitterAccount ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnlinkAccount("twitter")}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <FaUnlink className="mr-1" /> Unlink
                  </Button>
                ) : (
                  <TwitterLoginButton linkMode={true} />
                )}
              </div>
            </div>

            {/* Discord and Passkey Integration */}
            <div className="rounded-lg p-4 bg-dark-400/10">
              <h4 className="text-white font-medium mb-3">Additional Account Links</h4>
              <p className="text-gray-400 text-sm mb-4">
                Link Discord and Passkey for faster login options
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Discord - Coming Soon */}
                <div className="p-3 rounded-lg text-center bg-gray-800/30">
                  <div className="text-[#5865F2] mb-1">🎮</div>
                  <div className="text-xs text-gray-400">Discord</div>
                  <div className="text-xs text-gray-500">Coming Soon</div>
                </div>
                
                {/* Passkey - Coming Soon */}
                <div className="p-3 rounded-lg text-center bg-gray-800/30">
                  <div className="text-blue-400 mb-1">🔐</div>
                  <div className="text-xs text-gray-400">Passkey</div>
                  <div className="text-xs text-gray-500">Coming Soon</div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialAccountsPanel;
