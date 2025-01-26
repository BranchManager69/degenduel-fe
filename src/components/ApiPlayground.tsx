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
      <div className="min-h-screen bg-dark-100 text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-100 to-dark-200 opacity-50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="max-w-7xl mx-auto p-8 relative">
          <div className="mb-8 space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-400 to-cyber-400 bg-clip-text text-transparent mb-4 group">
              <span className="inline-block group-hover:animate-glitch">
                DegenDuel
              </span>{" "}
              <span className="inline-block group-hover:animate-glitch">
                API
              </span>{" "}
              <span className="inline-block group-hover:animate-glitch">
                Playground
              </span>
            </h1>
            <p className="text-neon-300 animate-cyber-pulse">
              Test and interact with the DegenDuel API endpoints.
            </p>
          </div>

          {/* Section Navigation */}
          <div className="flex flex-wrap gap-4 mb-8">
            {Object.entries(sections).map(([key, { title, icon }]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key as Section)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 hover:scale-105 group ${
                  activeSection === key
                    ? "bg-gradient-to-r from-brand-500 to-cyber-500 text-white shadow-lg shadow-brand-500/20 animate-cyber-pulse"
                    : "bg-dark-200/80 text-gray-400 hover:bg-dark-300 hover:text-white backdrop-blur-sm border border-dark-300/50"
                }`}
              >
                <span className="text-xl group-hover:animate-bounce">
                  {icon}
                </span>
                <span className="group-hover:animate-glitch">{title}</span>
              </button>
            ))}
          </div>

          {/* Section Description */}
          <div className="bg-dark-200/80 rounded-lg p-6 mb-8 border border-dark-300/50 animate-fade-in shadow-lg backdrop-blur-sm group hover:bg-dark-200 transition-all duration-300">
            <div className="flex items-center gap-3">
              <span className="text-3xl group-hover:animate-bounce">
                {sections[activeSection].icon}
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-cyber-400 mb-2 group-hover:animate-glitch">
                  {sections[activeSection].title}
                </h2>
                <p className="text-neon-300 group-hover:animate-cyber-pulse">
                  {sections[activeSection].description}
                </p>
              </div>
            </div>
          </div>

          {/* Section Content */}
          <div className="space-y-8 animate-fade-in">
            <div
              className={`transition-all duration-500 ${
                activeSection === "contests"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4 pointer-events-none absolute"
              }`}
            >
              {activeSection === "contests" && (
                <div className="space-y-6">
                  <ContestsList />
                  <CreateContest />
                  <UpdateContest />
                  <GetContestDetail />
                  <JoinContest />
                </div>
              )}
            </div>

            <div
              className={`transition-all duration-500 ${
                activeSection === "portfolios"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4 pointer-events-none absolute"
              }`}
            >
              {activeSection === "portfolios" && (
                <div className="space-y-6">
                  <SetPortfolio />
                  <GetPortfolio />
                </div>
              )}
            </div>

            <div
              className={`transition-all duration-500 ${
                activeSection === "admin"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4 pointer-events-none absolute"
              }`}
            >
              {activeSection === "admin" && (
                <div className="space-y-6">
                  <StartContest />
                  <EndContest />
                  <UserDetail />
                </div>
              )}
            </div>

            <div
              className={`transition-all duration-500 ${
                activeSection === "tokens"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4 pointer-events-none absolute"
              }`}
            >
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
      </div>
    </ContestProvider>
  );
}
