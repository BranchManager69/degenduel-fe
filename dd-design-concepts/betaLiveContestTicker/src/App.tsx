import React from "react";
import ContestTicker from "./components/ContestTicker";
export function App() {
  const contests = [{
    id: "1",
    status: "LIVE",
    name: "Current Showdown",
    amount: "0.5 SOL",
    filled: 15,
    total: 20,
    timeAgo: "ongoing"
  }, {
    id: "2",
    status: "PENDING",
    name: "Next Battle",
    amount: "1.0 SOL",
    filled: 0,
    total: 30,
    timeAgo: "starts soon"
  }, {
    id: "30",
    status: "ENDED",
    name: "Inaugural Showdown",
    amount: "0.01 SOL",
    filled: 20,
    total: 20,
    timeAgo: "2 days ago"
  }, {
    id: "34",
    status: "CANCELLED",
    name: "Lost Money Club",
    amount: "0.01 SOL",
    filled: 1,
    total: 20,
    timeAgo: "1 day ago"
  }];
  return <div className="w-full min-h-screen bg-black font-space-grotesk">
      <div className="group h-12 md:hover:h-20 flex items-stretch border-b border-purple-500/20 transition-all duration-300 ease-in-out overflow-hidden bg-[rgba(33,29,47,0.3)]">
        <div className="w-[100px] md:w-[180px] flex items-center justify-center">
          {/* Logo space */}
        </div>
        <div className="flex-1">
          <ContestTicker contests={contests} />
        </div>
        <div className="w-[100px] md:w-[180px] flex items-center justify-center">
          {/* Login area */}
        </div>
      </div>
    </div>;
}