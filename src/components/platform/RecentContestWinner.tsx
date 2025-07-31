import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';
import { getContestImageUrl } from '../../lib/imageUtils';

interface RecentContestWinnerData {
  portfolio_value_usd: number;
  portfolio_value_sol: number;
  initial_balance_usd: number;
  initial_balance_sol: number;
  percentage_gain: number;
  contest_id: number;
  contest_name: string;
  contest_image_url: string;
  contest_start_time: string;
  historical_sol_price: {
    price: number;
    timestamp: string;
  };
  user_id: number;
  nickname: string;
  profile_image_url: string;
  experience_points: number;
  user_level_id: number;
  level: number;
  level_title: string;
}

interface RecentContestWinnerProps {
  data: RecentContestWinnerData;
  delay?: number;
}

export const RecentContestWinner: React.FC<RecentContestWinnerProps> = ({ data, delay = 0.6 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className="relative bg-gradient-to-br from-purple-950/90 via-violet-950/80 to-purple-900/90 border-2 border-purple-600/60 hover:border-purple-400/80 transition-all duration-300 overflow-hidden backdrop-blur-sm shadow-[0_0_40px_rgba(147,51,234,0.4)]"
      style={{
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))'
      }}
    >
      {/* Crown background pattern */}
      <div className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity duration-500">
        <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
          <path d="M20 80 L40 20 L60 80 L80 30 L100 80 L120 25 L140 80 L160 35 L180 80" 
            stroke="#9333ea" strokeWidth="0.5" fill="none" strokeDasharray="2,2" />
          <circle cx="100" cy="50" r="25" fill="none" stroke="#9333ea" strokeWidth="0.3" strokeDasharray="3,3" />
        </svg>
      </div>

      {/* Purple corner accents */}
      <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-purple-400/60 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 bg-gradient-to-tr from-purple-400/60 to-transparent"></div>

      {/* Title Section - Moved to Top */}
      <div className="text-center p-4 relative z-20">
        <h3 className="text-2xl font-bold text-purple-200 mb-2 whitespace-nowrap" style={{
          textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
        }}>
          LATEST WINNER
        </h3>
        <div className="flex flex-col items-center mb-4">
          <div className="relative mb-3">
            {/* Circular glow behind profile picture */}
            <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-purple-400/40 to-violet-400/40 blur-md scale-150"></div>
            <img 
              src={data.profile_image_url} 
              alt={data.nickname}
              className="relative w-16 h-16 rounded-full border-3 border-purple-400/80 shadow-lg"
            />
            {/* Username overlapping bottom of profile picture */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-full -translate-y-1/2">
              <h4 className="text-xl font-bold text-white whitespace-nowrap" style={{
                textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
              }}>{data.nickname}</h4>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            {/* Level Info */}
            <div className="flex items-center gap-2">
              <span className="text-purple-300 text-sm font-bold" style={{
                textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
              }}>
                Level {data.level} - {data.level_title}
              </span>
              <span className="text-purple-200 text-sm" style={{
                textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
              }}>
                ({data.experience_points.toLocaleString()} XP)
              </span>
            </div>
            
            {/* Contest Info with Date */}
            <div className="flex flex-col items-center gap-1">
              <Link 
                to={`/contests/${data.contest_id}`}
                className="text-purple-200 text-xl sm:text-2xl font-bold hover:text-white underline decoration-purple-400/50 hover:decoration-white transition-all cursor-pointer"
                style={{
                  textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                }}
              >
                {data.contest_name}
              </Link>
              <span className="text-purple-300/90 text-xs font-medium" style={{
                textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
              }}>
                {new Date(data.contest_start_time).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })} at {new Date(data.contest_start_time).toLocaleTimeString('en-US', { 
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
          </div>
        </div>
        
        {/* Performance Stats - Centered across full width */}
        <div className="flex gap-4 justify-center">
          <div className="text-center">
            <span className="text-purple-300/80 text-xs block">Start</span>
            <div className="text-white font-bold text-sm">
              <span className="inline-flex items-center gap-1">
                {parseFloat(data.initial_balance_sol.toFixed(2)).toString()}
                <img 
                  src="/assets/media/logos/solana.svg" 
                  alt="SOL" 
                  className="w-5 h-5 inline-block"
                />
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <span className="text-purple-300/80 text-xs block">End</span>
            <div className="text-white font-bold text-sm">
              <span className="inline-flex items-center gap-1">
                {parseFloat(data.portfolio_value_sol.toFixed(2)).toString()}
                <img 
                  src="/assets/media/logos/solana.svg" 
                  alt="SOL" 
                  className="w-5 h-5 inline-block"
                />
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <span className="text-purple-300/80 text-xs block">Gain</span>
            <div className={`text-xl font-bold ${data.percentage_gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.percentage_gain >= 0 ? '+' : ''}{data.percentage_gain.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Contest Banner Image */}
      {data.contest_image_url && (
        <div 
          className="absolute inset-x-0 top-0 h-40 overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)'
          }}
        >
          <style>{`
            @keyframes globalHighScoreScan {
              0%, 100% { transform: translateY(0); }
              40% { transform: translateY(-20%); }
              60% { transform: translateY(-20%); }
            }
          `}</style>
          <img 
            src={getContestImageUrl(data.contest_image_url) || ""} 
            alt={data.contest_name}
            className="w-full h-56 object-cover object-top group-hover:scale-110"
            style={{
              animation: 'globalHighScoreScan 20s ease-in-out infinite',
              transition: 'transform 0.7s ease-out',
              filter: 'brightness(0.85) saturate(1.1)'
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Purple glow effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/0 via-purple-500/0 to-purple-400/0 hover:from-purple-600/5 hover:via-purple-500/3 hover:to-purple-400/5 mix-blend-screen transition-all duration-500" />
    </motion.div>
  );
};