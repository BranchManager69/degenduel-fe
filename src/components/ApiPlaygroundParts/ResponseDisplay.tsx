import React from 'react';

interface ResponseDisplayProps {
  response: any;
  error?: any;
}

// Placeholder component to satisfy imports
export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response, error }) => {
  return (
    <div className="mt-4 p-4 rounded-md bg-gray-800 text-white font-mono overflow-auto">
      {error ? (
        <pre className="text-red-400">{JSON.stringify(error, null, 2)}</pre>
      ) : (
        <pre>{JSON.stringify(response, null, 2)}</pre>
      )}
    </div>
  );
};

export default ResponseDisplay;