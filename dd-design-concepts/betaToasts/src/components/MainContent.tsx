import React, { useEffect } from "react";
import { Icon1 } from "./Icon1";
import { Icon2 } from "./Icon2";
import { FeatureCard } from "./FeatureCard";
import { useToast } from "./toast/ToastContext";
export const MainContent = () => {
  const {
    addToast
  } = useToast();
  useEffect(() => {
    // Animation for feature cards
    const animateElements = document.querySelectorAll('[data-animate="true"]');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.remove("opacity-0", "translate-y-12");
            entry.target.classList.add("opacity-100", "translate-y-0");
          }, 100 * Array.from(animateElements).indexOf(entry.target));
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });
    animateElements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  const demoToasts = () => {
    // Success examples
    addToast("success", "Successfully entered the trading competition!", "Competition Entry");
    // Delayed error example
    setTimeout(() => {
      addToast("error", "Insufficient balance to join this competition", "Transaction Failed");
    }, 1000);
    // Delayed warning example
    setTimeout(() => {
      addToast("warning", "5 minutes remaining in current trading round", "Time Warning");
    }, 2000);
    // Delayed info example
    setTimeout(() => {
      addToast("info", "New high-stakes competition starting in 10 minutes", "Upcoming Event");
    }, 3000);
  };
  return <div className="w-full min-h-screen bg-black text-white font-[Inter,system-ui,sans-serif]">
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.7;
          }
          50% {
            opacity: 0.3;
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes sparkle {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.5);
          }
        }
        @keyframes scan-fast {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 300% 0;
          }
        }
        @keyframes scan-vertical {
          0% {
            background-position: 0 -100%;
          }
          100% {
            background-position: 0 200%;
          }
        }
        @keyframes randomSlide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
      <section className="relative flex-grow flex-shrink flex-basis-0 pb-20 z-10 w-full bg-transparent text-black text-base leading-6">
        <div className="mx-auto max-w-7xl px-8 py-16">
          <div className="text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="mb-8 flex items-center justify-center">
                <h1 className="text-6xl font-black leading-[60px] tracking-[-3px] m-0">
                  <span className="relative inline-block transform scale-[1.038]">
                    <span className="relative z-10 bg-gradient-to-br from-[#9933ff] via-[#7f00ff] to-[#6600cc] bg-clip-text text-transparent">
                      DEGEN
                    </span>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-300/20 to-purple-300/0 blur-xl transform scale-[1.063]"></div>
                  </span>
                  <span className="relative inline-block transform rotate-[-86deg] mx-4 text-[#22d3ee] font-[Rajdhani,sans-serif] font-bold">
                    ×
                  </span>
                  <span className="relative inline-block transform scale-[1.049]">
                    <span className="relative z-10 text-gray-400">DUEL</span>
                  </span>
                </h1>
              </div>
              <div className="relative mb-6 overflow-hidden">
                <h2 className="text-3xl font-black bg-gradient-to-br from-[#b266ff] via-[#9933ff] to-[#6600cc] bg-clip-text text-transparent leading-9 m-0">
                  High-Stakes Trading Competitions on Solana
                </h2>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-[347px]"></div>
              </div>
              <div className="mt-8 flex flex-col gap-6 items-center justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
                  <button onClick={() => addToast("success", "Position opened successfully", "Trade Executed")} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg font-medium text-white hover:opacity-90 transition-opacity">
                    Success Toast
                  </button>
                  <button onClick={() => addToast("error", "Failed to place limit order", "Trade Error")} className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg font-medium text-white hover:opacity-90 transition-opacity">
                    Error Toast
                  </button>
                  <button onClick={() => addToast("warning", "High volatility detected", "Market Alert")} className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg font-medium text-white hover:opacity-90 transition-opacity">
                    Warning Toast
                  </button>
                  <button onClick={() => addToast("info", "New trading pair added: SOL/USDC")} className="px-6 py-3 bg-gradient-to-r from-[#9933ff] to-[#6600cc] rounded-lg font-medium text-white hover:opacity-90 transition-opacity">
                    Info Toast
                  </button>
                </div>
                <button onClick={demoToasts} className="px-8 py-3 bg-gradient-to-r from-[#9933ff] to-[#6600cc] rounded-lg font-bold text-white hover:opacity-90 transition-opacity border border-purple-500/20">
                  Show All Notifications
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                  <button onClick={() => addToast("success", "+500 USDC profit from BTC long position")} className="px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 border border-emerald-500/50 rounded-lg font-medium text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                    Toast without Title
                  </button>
                  <button onClick={() => {
                  addToast("info", "Your trading strategy 'Moon Shot' is now live", "Strategy Activated");
                  setTimeout(() => {
                    addToast("success", "First trade executed successfully", "Strategy Update");
                  }, 1000);
                }} className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-600/20 border border-purple-500/50 rounded-lg font-medium text-purple-400 hover:bg-purple-500/30 transition-colors">
                    Sequential Toasts
                  </button>
                </div>
              </div>
              <div className="mt-8 flex flex-row items-center justify-center gap-6">
                <a href="/contests" className="text-black w-64 perspective-1000">
                  <button className="w-full transform-gpu transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                    <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 p-[1px] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.2)] group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 blur-sm" />
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                      <div className="relative backdrop-blur-sm bg-[rgba(33,29,47,0.9)] px-8 py-4 rounded-xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/20" />
                        <div className="relative flex items-center justify-between text-xl">
                          <span className="bg-gradient-to-r from-emerald-200 to-teal-400 bg-clip-text text-transparent font-semibold">
                            START DUELING
                          </span>
                          <Icon1 style={{
                          color: "rgb(52, 211, 153)",
                          filter: "drop-shadow(0 0 8px rgba(52, 211, 153, 0.3))"
                        }} />
                        </div>
                      </div>
                    </div>
                  </button>
                </a>
                <a href="/how-it-works" className="text-black w-60 perspective-1000">
                  <button className="w-full transform-gpu transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                    <div className="relative backdrop-blur-sm bg-[rgba(33,29,47,0.9)] border-[0.8px] border-purple-400/30 px-8 py-4 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(153,51,255,0.15)] group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#9933ff]/5 to-[#6600cc]/5 blur-sm" />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                      <div className="relative flex items-center justify-between text-xl">
                        <span className="bg-gradient-to-r from-[#b266ff] to-[#9933ff] bg-clip-text text-transparent font-semibold">
                          HOW TO PLAY
                        </span>
                        <Icon2 style={{
                        color: "rgb(153, 51, 255)",
                        filter: "drop-shadow(0 0 8px rgba(153, 51, 255, 0.3))"
                      }} />
                      </div>
                    </div>
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>;
};