import React, { useEffect, useState } from "react";
import { Portfolio, User } from "../../types";
import { Card } from "../ui/Card";

interface UserPortfolioManagementProps {
  users: User[];
}

interface UserPortfolio extends Portfolio {
  wallet_address: string;
}

export const UserPortfolioManagement: React.FC<
  UserPortfolioManagementProps
> = ({ users }) => {
  const [portfolios, setPortfolios] = useState<Record<string, UserPortfolio>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const portfolioData: Record<string, UserPortfolio> = {};

        for (const user of users) {
          try {
            const response = await fetch(
              `/api/users/${user.wallet_address}/portfolio`
            );
            if (!response.ok) {
              throw new Error("Failed to fetch portfolio");
            }
            const userPortfolio = await response.json();
            portfolioData[user.wallet_address] = {
              ...userPortfolio,
              wallet_address: user.wallet_address,
            };
          } catch (error) {
            console.error(
              `Failed to fetch portfolio for user ${user.wallet_address}:`,
              error
            );
          }
        }

        setPortfolios(portfolioData);
      } catch (error) {
        console.error("Failed to fetch portfolios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolios();
  }, [users]);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">User Portfolios</h2>
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.wallet_address}
              className="border border-gray-700 rounded-lg p-4"
            >
              <h3 className="text-lg font-medium text-gray-200 mb-2">
                {user.nickname}'s Portfolio
              </h3>
              {portfolios[user.wallet_address] ? (
                <div className="space-y-2">
                  <p className="text-gray-400">
                    Total Value: ${portfolios[user.wallet_address].total_value}
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {portfolios[user.wallet_address].tokens.map(
                      (token, index) => (
                        <div key={index} className="bg-dark-200 p-3 rounded">
                          <p className="text-gray-300">{token.symbol}</p>
                          <p className="text-gray-400">
                            Amount: {token.amount}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">No portfolio data available</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default UserPortfolioManagement;
