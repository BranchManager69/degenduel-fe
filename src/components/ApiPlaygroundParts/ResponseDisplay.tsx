import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import { ResponseDisplayProps } from "./types";

export function ResponseDisplay({ response, error }: ResponseDisplayProps) {
  if (!response && !error) return null;

  return (
    <div className="mt-6 rounded-lg overflow-hidden relative group">
      {error ? (
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-brand-500 rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-300" />
          <div className="bg-dark-400/30 p-6 rounded-lg border border-red-500/30 backdrop-blur-sm relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl group-hover:animate-bounce">⚠️</span>
              <h3 className="text-red-400 font-semibold group-hover:animate-glitch">
                Error Response
              </h3>
            </div>
            <div className="bg-dark-300/50 rounded-lg overflow-hidden border border-red-500/20">
              <SyntaxHighlighter
                language="json"
                style={atomDark}
                customStyle={{
                  margin: 0,
                  background: "transparent",
                  padding: "1rem",
                }}
                className="group-hover:animate-data-stream"
              >
                {JSON.stringify(error, null, 2)}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-cyber-500 rounded-lg blur opacity-20 group-hover:opacity-30 transition duration-300" />
          <div className="bg-dark-400/30 p-6 rounded-lg border border-brand-500/30 backdrop-blur-sm relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl group-hover:animate-bounce">✨</span>
              <h3 className="text-cyber-400 font-semibold group-hover:animate-glitch">
                Success Response
              </h3>
            </div>
            <div className="bg-dark-300/50 rounded-lg overflow-hidden border border-brand-500/20">
              <SyntaxHighlighter
                language="json"
                style={atomDark}
                customStyle={{
                  margin: 0,
                  background: "transparent",
                  padding: "1rem",
                }}
                className="group-hover:animate-data-stream"
              >
                {JSON.stringify(response, null, 2)}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
