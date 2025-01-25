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

  const sections: Record<
    Section,
    { title: string; description: string; icon: string }
  > = {
    contests: {
      title: "Contest Management",
      description: "Create, update, and manage contests",
      icon: "🏆",
    },
    portfolios: {
      title: "Portfolio Management",
      description: "Manage user portfolios within contests",
      icon: "📊",
    },
    admin: {
      title: "Admin Controls",
      description: "Administrative functions for contests",
      icon: "⚙️",
    },
    tokens: {
      title: "Token Data",
      description: "Token information and price data",
      icon: "🪙",
    },
  };

  return (
    <ContestProvider>
      <div className="min-h-screen bg-dark-100 text-white">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-400 to-cyber-400 bg-clip-text text-transparent mb-4">
              DegenDuel API Playground
            </h1>
            <p className="text-neon-300">
              Test and interact with the DegenDuel API endpoints.
            </p>
          </div>

          {/* Section Navigation */}
          <div className="flex flex-wrap gap-4 mb-8">
            {Object.entries(sections).map(([key, { title, icon }]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key as Section)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 hover:scale-105 ${
                  activeSection === key
                    ? "bg-gradient-to-r from-brand-500 to-cyber-500 text-white shadow-lg shadow-brand-500/20"
                    : "bg-dark-200 text-gray-400 hover:bg-dark-300 hover:text-white"
                }`}
              >
                <span className="text-xl">{icon}</span>
                {title}
              </button>
            ))}
          </div>

          {/* Section Description */}
          <div className="bg-dark-200 rounded-lg p-6 mb-8 border border-dark-300 animate-fade-in shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{sections[activeSection].icon}</span>
              <div>
                <h2 className="text-2xl font-semibold text-cyber-400 mb-2">
                  {sections[activeSection].title}
                </h2>
                <p className="text-neon-300">
                  {sections[activeSection].description}
                </p>
              </div>
            </div>
          </div>

          {/* Section Content */}
          <div className="space-y-8 animate-fade-in">
            {activeSection === "contests" && (
              <div className="space-y-6">
                <ContestsList />
                <CreateContest />
                <UpdateContest />
                <GetContestDetail />
                <JoinContest />
              </div>
            )}

            {activeSection === "portfolios" && (
              <div className="space-y-6">
                <SetPortfolio />
                <GetPortfolio />
              </div>
            )}

            {activeSection === "admin" && (
              <div className="space-y-6">
                <StartContest />
                <EndContest />
                <UserDetail />
              </div>
            )}

            {activeSection === "tokens" && (
              <div className="space-y-6">
                <TokensList />
                <BulkPrices />
                <BulkPriceHistory />
              </div>
            )}
          </div>
        </div>
      </div>
    </ContestProvider>
  );
}
