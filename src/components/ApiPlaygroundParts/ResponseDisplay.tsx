import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ResponseDisplayProps } from "./types";

export function ResponseDisplay({ response, error }: ResponseDisplayProps) {
  if (!response && !error) return null;

  return (
    <div className="mt-4 rounded-lg overflow-hidden">
      {error ? (
        <div className="bg-red-900/50 p-4 rounded-lg border border-red-500">
          <h3 className="text-red-500 font-semibold mb-2">Error</h3>
          <SyntaxHighlighter
            language="json"
            style={atomDark}
            customStyle={{ margin: 0, background: "transparent" }}
          >
            {JSON.stringify(error, null, 2)}
          </SyntaxHighlighter>
        </div>
      ) : (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 font-semibold mb-2">Response</h3>
          <SyntaxHighlighter
            language="json"
            style={atomDark}
            customStyle={{ margin: 0, background: "transparent" }}
          >
            {JSON.stringify(response, null, 2)}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}
