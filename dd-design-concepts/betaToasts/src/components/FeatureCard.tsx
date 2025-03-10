import React from "react";
interface FeatureCardProps {
  title: string;
  description: string;
  isComingSoon?: boolean;
}
export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  isComingSoon = false
}) => {
  const borderColor = isComingSoon ? "border-blue-500" : "border-purple-500";
  const accentColor = isComingSoon ? "bg-blue-500" : "bg-green-500";
  const titleColor = isComingSoon ? "text-blue-100" : "text-purple-100";
  const descriptionColor = isComingSoon ? "text-blue-200/80" : "text-purple-200/80";
  const bgColor = isComingSoon ? "bg-[rgba(30,26,66,0.7)]" : "bg-[rgba(26,19,51,0.7)]";
  return <div className={`opacity-0 transform translate-y-12 group`} data-animate="true">
      <div className={`relative h-40 overflow-hidden transition-all duration-150 backdrop-blur-md ${bgColor} border-[0.8px] ${borderColor} rounded-xl`}>
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden h-10">
          <canvas width="250" height="40" className="w-full"></canvas>
        </div>
        <div className="relative z-10 p-4 pb-12">
          {isComingSoon && <div className="absolute h-2 w-2 right-2 top-2 bg-blue-400 rounded-full"></div>}
          <h3 className={`text-lg font-bold mb-2 ${titleColor}`}>{title}</h3>
          <p className={`text-sm leading-5 line-clamp-3 ${descriptionColor}`}>
            {description}
          </p>
        </div>
        <div className={`absolute bottom-0 left-0 top-0 ${accentColor} w-1`}></div>
      </div>
    </div>;
};