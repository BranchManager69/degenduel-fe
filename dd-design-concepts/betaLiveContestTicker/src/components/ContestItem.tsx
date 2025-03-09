import React from "react";
export interface ContestItemProps {
  id: string;
  status: "ENDED" | "CANCELLED";
  name: string;
  amount: string;
  filled: number;
  total: number;
  timeAgo: string;
  description: string;
}
export const ContestItem: React.FC<ContestItemProps> = ({
  id,
  status,
  name,
  amount,
  filled,
  total,
  timeAgo,
  description
}) => {
  const isEnded = status === "ENDED";
  const statusColor = isEnded ? "rgba(74, 222, 128, 0.5)" : "rgba(248, 113, 113, 0.5)";
  const nameColor = isEnded ? "rgba(134, 239, 172, 0.5)" : "rgba(252, 165, 165, 0.5)";
  const gradientColor = isEnded ? "rgba(22, 163, 74, 0.5)" : "rgba(248, 113, 113, 0.5)";
  const progressWidth = `${filled / total * 64}px`;
  return <a title={description} href={`/contests/${id}`} className={`flex items-center relative transition-all duration-300 p-1 px-2 rounded ${!isEnded ? "line-through opacity-60" : ""}`}>
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 animate-[data-stream_15s_linear_infinite] rounded"></div>
      <span className="ml-2 font-medium transition-colors duration-150" style={{
      color: statusColor
    }}>
        {status}
      </span>
      <span className="ml-2 font-medium transition-colors duration-150" style={{
      color: nameColor
    }}>
        {name}
      </span>
      <div className="flex items-center ml-2 gap-1">
        <span className="text-sm leading-5 bg-clip-text" style={{
        backgroundImage: `linear-gradient(to right, ${gradientColor}, ${gradientColor.replace("0.5", "0")})`,
        color: "rgba(0, 0, 0, 0)"
      }}>
          {amount}
        </span>
      </div>
      <div className="ml-2 flex flex-col items-center gap-0.5">
        <div className="text-gray-400 transition-colors duration-150 text-xs">
          {filled}/{total}
        </div>
        <div className="relative w-16 overflow-hidden bg-opacity-50 bg-[rgba(45,40,68,0.5)] h-1 rounded-full">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent to-50% animate-[scan-fast_3s_linear_infinite]"></div>
          <div className="absolute inset-y-0 left-0 rounded-full" style={{
          backgroundImage: `linear-gradient(to right, ${gradientColor}, ${gradientColor.replace("0.5", "0")})`,
          width: progressWidth,
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
        }}>
            <div className="absolute inset-0 animate-[shine_2s_linear_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 blur"></div>
        </div>
      </div>
      <div className="absolute left-[150px] transform -translate-x-[150px] ml-2 opacity-0 transition-all duration-200 invisible top-[-96px] z-[100] min-w-[300px]">
        <div className="relative backdrop-blur-sm bg-[rgba(33,29,47,0.95)] shadow-lg border-[0.8px] border-[rgba(168,85,247,0.2)] rounded-lg p-3">
          <div className="mb-1 font-bold text-[rgb(153,51,255)] transition-colors duration-150">
            Contest Details
          </div>
          <p className="text-sm text-[rgb(209,213,219)]">{description}</p>
          <div className="absolute left-[149.2px] h-4 w-4 transform rotate-45 -bottom-2 bg-[rgba(33,29,47,0.95)] shadow-lg border-r-[0.8px] border-b-[0.8px] border-[rgba(168,85,247,0.2)]"></div>
        </div>
      </div>
      <span className="ml-2 text-sm text-gray-500 transition-colors duration-150">
        {status.toLowerCase()} {timeAgo}
      </span>
    </a>;
};