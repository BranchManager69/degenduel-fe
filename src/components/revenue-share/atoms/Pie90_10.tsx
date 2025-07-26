export const Pie90_10 = () => {
  // Fixed PnL values matching Step 2
  const playerPnL = [+40, -23, +3, +22, -50];
  // Sort players by PnL to get rankings
  const rankings = playerPnL
    .map((pnl, idx) => ({ pnl, idx }))
    .sort((a, b) => b.pnl - a.pnl);
  
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Contest circle - matching Stages 1 & 2 */}
      <svg width={260} height={260} className="relative">
        <defs>
          <radialGradient id="contestGradient3">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.1)" />
            <stop offset="100%" stopColor="rgba(147, 51, 234, 0.1)" />
          </radialGradient>
        </defs>
        <g transform="translate(130 130)">
          {/* Contest circle background */}
          <circle r={100} className="stroke-gray-600/30 stroke-1" fill="url(#contestGradient3)" />
          
          {/* Contest name - centered like other stages */}
          <text y="-4" textAnchor="middle" className="fill-gray-200 text-xs">
            Dinnertime Duel
          </text>
          <text y="12" textAnchor="middle" className="fill-gray-400 text-[10px]">
            Complete
          </text>
          
          {/* Pie chart overlay */}
          <path d="M 0,0 L 58.8,-80.9 A 100,100 1 1,1 0,-100 z" className="fill-emerald-500/20" stroke="#374151" strokeWidth="1" strokeLinejoin="round" />
          <path d="M 0,0 L 0,-100 A 100,100 1 0,1 58.8,-80.9 z" className="fill-purple-900/20" stroke="#374151" strokeWidth="1" strokeLinejoin="round" />
          
          <text x="55" y="70" textAnchor="middle" className="fill-white text-sm font-bold">90%</text>
        </g>
      </svg>
      
      {/* Olympic Podium with stick figures */}
      <div className="relative w-60 h-16">
        {/* Podium blocks - centered in the container */}
        <div className="absolute bottom-0 left-20 w-8 h-8 bg-gradient-to-b from-gray-600 to-gray-700 border border-gray-500"></div>
        <div className="absolute bottom-0 left-28 w-8 h-10 bg-gradient-to-b from-yellow-600 to-yellow-700 border border-yellow-500"></div>
        <div className="absolute bottom-0 left-36 w-8 h-6 bg-gradient-to-b from-orange-700 to-orange-800 border border-orange-600"></div>
        
        {/* Stick figures on podium */}
        {/* 2nd place (silver) */}
        <div className="absolute left-20 bottom-8">
          <svg width="30" height="60" viewBox="0 0 30 60">
            <g transform="translate(15, 42)">
              <circle cx="0" cy="-10" r="5" className="fill-gray-500" />
              <line x1="0" y1="-5" x2="0" y2="7" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="-1" x2="-6" y2="5" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="-1" x2="6" y2="5" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="7" x2="-4" y2="18" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="7" x2="4" y2="18" stroke="#6B7280" strokeWidth="2" />
              <text x="0" y="-18" textAnchor="middle" className="fill-green-400 text-[9px] font-bold">
                +{rankings[1].pnl}%
              </text>
            </g>
          </svg>
        </div>
        
        {/* 1st place (gold) */}
        <div className="absolute left-28 bottom-10">
          <svg width="30" height="60" viewBox="0 0 30 60">
            <g transform="translate(15, 42)">
              <circle cx="0" cy="-10" r="5" className="fill-gray-500" />
              <line x1="0" y1="-5" x2="0" y2="7" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="-1" x2="-6" y2="5" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="-1" x2="6" y2="5" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="7" x2="-4" y2="18" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="7" x2="4" y2="18" stroke="#6B7280" strokeWidth="2" />
              <text x="0" y="-18" textAnchor="middle" className="fill-green-400 text-[9px] font-bold">
                +{rankings[0].pnl}%
              </text>
              {/* Crown */}
              <g transform="translate(-5, -20)">
                <path d="M1 8 L2 3 L4 6 L6 1 L8 6 L10 3 L11 8 L10 9 L1 9 Z" 
                      fill="#FFD700" 
                      stroke="#B8860B" 
                      strokeWidth="0.3" />
                <rect x="1" y="8" width="10" height="1.5" fill="#FFD700" stroke="#B8860B" strokeWidth="0.2" />
                <circle cx="3" cy="5" r="0.4" fill="#DC143C" />
                <circle cx="6" cy="3" r="0.4" fill="#4169E1" />
                <circle cx="9" cy="5" r="0.4" fill="#DC143C" />
              </g>
            </g>
          </svg>
        </div>
        
        {/* 3rd place (bronze) */}
        <div className="absolute left-36 bottom-6">
          <svg width="30" height="60" viewBox="0 0 30 60">
            <g transform="translate(15, 42)">
              <circle cx="0" cy="-10" r="5" className="fill-gray-500" />
              <line x1="0" y1="-5" x2="0" y2="7" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="-1" x2="-6" y2="5" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="-1" x2="6" y2="5" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="7" x2="-4" y2="18" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="7" x2="4" y2="18" stroke="#6B7280" strokeWidth="2" />
              <text x="0" y="-18" textAnchor="middle" className="fill-green-400 text-[9px] font-bold">
                +{rankings[2].pnl}%
              </text>
            </g>
          </svg>
        </div>
        
        {/* Non-placing players */}
        <div className="absolute right-8 bottom-0">
          <svg width="30" height="60" viewBox="0 0 30 60">
            <g transform="translate(15, 42)">
              <circle cx="0" cy="-10" r="5" className="fill-gray-500" />
              <line x1="0" y1="-5" x2="0" y2="7" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="-1" x2="-6" y2="5" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="-1" x2="6" y2="5" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="7" x2="-4" y2="18" stroke="#6B7280" strokeWidth="2" />
              <line x1="0" y1="7" x2="4" y2="18" stroke="#6B7280" strokeWidth="2" />
              <text x="0" y="-18" textAnchor="middle" className="fill-red-400 text-[9px] font-bold">
                {rankings[3].pnl}%
              </text>
            </g>
          </svg>
        </div>
        
        {/* 5th place - in a trash can */}
        <div className="absolute -right-4 bottom-0">
          <svg width="50" height="60" viewBox="0 0 50 60">
            <g transform="translate(25, 35)">
              {/* Trash can */}
              <rect x="-10" y="0" width="20" height="22" fill="#4B5563" stroke="#374151" strokeWidth="1" rx="1" />
              <rect x="-12" y="-2" width="24" height="4" fill="#6B7280" stroke="#374151" strokeWidth="1" rx="1" />
              <line x1="-6" y1="5" x2="-6" y2="17" stroke="#374151" strokeWidth="0.5" />
              <line x1="0" y1="5" x2="0" y2="17" stroke="#374151" strokeWidth="0.5" />
              <line x1="6" y1="5" x2="6" y2="17" stroke="#374151" strokeWidth="0.5" />
              
              {/* Stick figure in trash - only upper body visible */}
              <g transform="translate(0, -5)">
                <circle cx="0" cy="-10" r="5" className="fill-gray-500" />
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#6B7280" strokeWidth="2" />
                <line x1="0" y1="-1" x2="-6" y2="3" stroke="#6B7280" strokeWidth="2" />
                <line x1="0" y1="-1" x2="6" y2="3" stroke="#6B7280" strokeWidth="2" />
                <text x="0" y="-18" textAnchor="middle" className="fill-red-400 text-[9px] font-bold">
                  {rankings[4].pnl}%
                </text>
              </g>
              
              {/* Smell lines with CSS animation */}
              <g className="animate-pulse">
                <path d="M -15,-15 Q -17,-18 -15,-21" fill="none" stroke="#84CC16" strokeWidth="1" opacity="0.6" />
                <path d="M 0,-15 Q -2,-18 0,-21" fill="none" stroke="#84CC16" strokeWidth="1" opacity="0.7" />
                <path d="M 15,-15 Q 17,-18 15,-21" fill="none" stroke="#84CC16" strokeWidth="1" opacity="0.6" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};