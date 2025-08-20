import React from 'react';
import { TokenGodView } from '../components/tokens/TokenGodView';

const TokenGodViewPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300">
      <div className="container mx-auto px-4 py-8">
        <TokenGodView />
      </div>
    </div>
  );
};

export default TokenGodViewPage;