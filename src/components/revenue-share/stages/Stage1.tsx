import { Player } from '../atoms/Player';

export const Stage1 = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="text-center">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Step 1</p>
      <h3 className="step-label">Players Enter</h3>
    </div>
    <svg width={260} height={260} className="relative">
      <defs>
        <radialGradient id="contestGradient">
          <stop offset="0%" stopColor="rgba(34, 197, 94, 0.1)" />
          <stop offset="100%" stopColor="rgba(147, 51, 234, 0.1)" />
        </radialGradient>
      </defs>
      <g transform="translate(130 130)">
        {[0, 1, 2, 3, 4].map((i) => (
          <Player key={i} idx={i} centre={[0, 0]} />
        ))}
        <circle r={100} className="stroke-gray-600/30 stroke-1" fill="url(#contestGradient)" />
        <text y="-4" textAnchor="middle" className="fill-gray-200 text-xs">
          Dinnertime Duel
        </text>
        <text y="12" textAnchor="middle" className="fill-gray-400 text-[10px]">
          Entry fee 1 SOL
        </text>
      </g>
    </svg>
  </div>
);