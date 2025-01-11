import { API_URL } from "../../config/config";
import { useStore } from "../../store/useStore";
import { Contest, PortfolioResponse } from "../../types";
import type { SortOptions } from "../../types/sort";
import { checkContestParticipation, logError } from "./utils";

export const contests = {
  getActive: async (): Promise<Contest[]> => {
    const user = useStore.getState().user;

    const response = await fetch(`${API_URL}/contests`, {
      headers: {
        "Content-Type": "application/json",
        "X-Wallet-Address": user?.wallet_address || "",
        "Cache-Control": "no-cache",
      },
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to fetch active contests");

    const data = await response.json();
    const contests: Contest[] = Array.isArray(data)
      ? data
      : data.contests || [];

    return contests.map((contest: Contest) => ({
      ...contest,
      is_participating: false,
    }));
  },

  getAll: async (sortOptions?: SortOptions): Promise<Contest[]> => {
    const user = useStore.getState().user;

    try {
      const response = await fetch(`${API_URL}/contests`, {
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": user?.wallet_address || "",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch contests");
      }

      const data = await response.json();
      let contests: Contest[] = Array.isArray(data)
        ? data
        : data.contests || [];

      // Apply sorting if options are provided
      if (sortOptions) {
        contests.sort((a, b) => {
          let aValue = a[sortOptions.field];
          let bValue = b[sortOptions.field];

          // Convert string numbers to actual numbers for comparison
          if (typeof aValue === "string" && !isNaN(Number(aValue))) {
            aValue = Number(aValue);
            bValue = Number(bValue);
          }

          if (sortOptions.direction === "asc") {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      } else {
        // Default sort: most participants first
        contests.sort(
          (a, b) => Number(b.participant_count) - Number(a.participant_count)
        );
      }

      // Only check participation if user is logged in
      if (!user?.wallet_address) {
        return contests.map((contest) => ({
          ...contest,
          is_participating: false,
        }));
      }

      const processedContests = await Promise.all(
        contests.map(async (contest: Contest) => {
          const isParticipating = await checkContestParticipation(
            contest.id,
            user.wallet_address
          );

          return {
            ...contest,
            is_participating: isParticipating,
          };
        })
      );

      return processedContests;
    } catch (error: any) {
      logError("contests.getAll", error, { userWallet: user?.wallet_address });
      throw error;
    }
  },

  getById: async (contestId: string) => {
    const user = useStore.getState().user;

    try {
      const response = await fetch(`${API_URL}/contests/${contestId}`, {
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": user?.wallet_address || "",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to fetch contest");
      }

      const contest = await response.json();

      // Only check participation if we have both user and contest, and contest is in a valid state
      const shouldCheckParticipation =
        user?.wallet_address &&
        contest?.id &&
        contest.status !== "cancelled" &&
        contest.status !== "completed";

      const isParticipating = shouldCheckParticipation
        ? await checkContestParticipation(contestId, user.wallet_address)
        : false;

      return {
        ...contest,
        is_participating: isParticipating,
      };
    } catch (error: any) {
      logError("contests.getById", error, {
        contestId,
        userWallet: user?.wallet_address,
      });
      throw error;
    }
  },

  enterContest: async (
    contestId: string,
    portfolio: PortfolioResponse
  ): Promise<void> => {
    const user = useStore.getState().user;

    if (!user?.wallet_address) {
      throw new Error("Please connect your wallet first");
    }

    try {
      const portfolioData: PortfolioResponse = {
        tokens: portfolio.tokens.map((token) => ({
          contractAddress: token.contractAddress,
          symbol: token.symbol,
          weight: Number(token.weight),
        })),
      };

      const payload = {
        wallet_address: user.wallet_address,
        tokens: portfolioData.tokens.map((token) => ({
          contractAddress: token.contractAddress,
          symbol: token.symbol,
          weight: Number(token.weight),
        })),
      };

      const response = await fetch(`${API_URL}/contests/${contestId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": user.wallet_address,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const responseText = await response.text();
        let responseData;
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          throw new Error("Server returned invalid response");
        }

        throw new Error(
          responseData.error ||
            responseData.message ||
            `Server error: ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      console.error("[enterContest] Error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to join contest");
    }
  },

  create: async (contestData: Partial<Contest>): Promise<Contest> => {
    console.log("API Service - Contest data before send:", contestData);

    try {
      const response = await fetch(`${API_URL}/contests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": useStore.getState().user?.wallet_address || "",
        },
        credentials: "include",
        body: JSON.stringify(contestData),
      });

      const responseText = await response.text();
      console.log("API Raw Response:", responseText);

      let errorData;
      try {
        errorData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error("Failed to parse response:", responseText);
      }

      if (!response.ok) {
        throw new Error(
          errorData?.message ||
            errorData?.error ||
            `Failed to create contest: ${response.status} ${response.statusText}`
        );
      }

      return errorData;
    } catch (error) {
      console.error("Failed to create contest:", {
        error,
        data: contestData,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },
};
