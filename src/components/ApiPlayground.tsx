import { useState } from "react";
import { BulkPriceHistory } from "./ApiPlaygroundParts/BulkPriceHistory";
import { BulkPrices } from "./ApiPlaygroundParts/BulkPrices";
import { ContestProvider } from "./ApiPlaygroundParts/ContestContext";
import { ContestsList } from "./ApiPlaygroundParts/ContestsList";
import { CreateContest } from "./ApiPlaygroundParts/CreateContest";
import { EndContest } from "./ApiPlaygroundParts/EndContest";
import { GetContestDetail } from "./ApiPlaygroundParts/GetContestDetail";
import { GetPortfolio } from "./ApiPlaygroundParts/GetPortfolio";
import { JoinContest } from "./ApiPlaygroundParts/JoinContest";
import { SetPortfolio } from "./ApiPlaygroundParts/SetPortfolio";
import { StartContest } from "./ApiPlaygroundParts/StartContest";
import { TokensList } from "./ApiPlaygroundParts/TokensList";
import { UpdateContest } from "./ApiPlaygroundParts/UpdateContest";
import { UserDetail } from "./ApiPlaygroundParts/UserDetail";

type Section = "contests" | "portfolios" | "admin" | "tokens";

export default function ApiPlayground() {
  const [activeSection, setActiveSection] = useState<Section>("contests");

  const sections: Record<Section, { title: string; description: string }> = {
    contests: {
      title: "Contest Management",
      description: "Create, update, and manage contests",
    },
    portfolios: {
      title: "Portfolio Management",
      description: "Manage user portfolios within contests",
    },
    admin: {
      title: "Admin Controls",
      description: "Administrative functions for contests",
    },
    tokens: {
      title: "Token Data",
      description: "Token information and price data",
    },
  };

  return (
    <ContestProvider>
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            DegenDuel API Playground
          </h1>
          <p className="text-gray-400">
            Test and interact with the DegenDuel API endpoints.
          </p>
        </div>

        {/* Section Navigation */}
        <div className="flex space-x-2 mb-8">
          {Object.entries(sections).map(([key, { title }]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as Section)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === key
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {title}
            </button>
          ))}
        </div>

        {/* Section Description */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-8">
          <h2 className="text-xl font-semibold text-white mb-2">
            {sections[activeSection].title}
          </h2>
          <p className="text-gray-400">{sections[activeSection].description}</p>
        </div>

        {/* Section Content */}
        <div className="space-y-8">
          {activeSection === "contests" && (
            <>
              <ContestsList />
              <CreateContest />
              <UpdateContest />
              <GetContestDetail />
              <JoinContest />
            </>
          )}

          {activeSection === "portfolios" && (
            <>
              <SetPortfolio />
              <GetPortfolio />
            </>
          )}

          {activeSection === "admin" && (
            <>
              <StartContest />
              <EndContest />
              <UserDetail />
            </>
          )}

          {activeSection === "tokens" && (
            <>
              <TokensList />
              <BulkPrices />
              <BulkPriceHistory />
            </>
          )}
        </div>
      </div>
    </ContestProvider>
  );
}
