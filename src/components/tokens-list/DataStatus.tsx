import React from "react";

interface TokenResponseMetadata {
  timestamp: string;
  _cached?: boolean;
  _stale?: boolean;
  _cachedAt?: string;
}

interface DataStatusProps {
  metadata: TokenResponseMetadata;
}

export const DataStatus: React.FC<DataStatusProps> = ({ metadata }) => {
  const [, forceUpdate] = React.useState({});

  React.useEffect(() => {
    const interval = setInterval(() => forceUpdate({}), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!metadata._cached) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Live
      </div>
    );
  }

  const cachedAt = new Date(metadata._cachedAt || metadata.timestamp);
  const ageSeconds = Math.floor(
    (new Date().getTime() - cachedAt.getTime()) / 1000
  );
  const ageText =
    ageSeconds < 60 ? `${ageSeconds}s` : `${Math.floor(ageSeconds / 60)}m`;

  if (metadata._stale) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        Stale • {ageText}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-medium whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
      Cache • {ageText}
    </div>
  );
};
