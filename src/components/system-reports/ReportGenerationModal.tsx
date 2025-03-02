import React, { useState } from "react";

interface ReportGenerationModalProps {
  onClose: () => void;
  onGenerate: (withAi: boolean) => Promise<void>;
}

export const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({
  onClose,
  onGenerate,
}) => {
  const [withAi, setWithAi] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      await onGenerate(withAi);
    } catch (err) {
      setError("Failed to generate report. Please try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Generate System Report</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isGenerating}
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Generate a new system report with the current state of all services
            and databases.
          </p>

          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="withAi"
              checked={withAi}
              onChange={(e) => setWithAi(e.target.checked)}
              className="mr-2"
              disabled={isGenerating}
            />
            <label htmlFor="withAi">Include AI analysis</label>
          </div>

          <p className="text-xs text-gray-500">
            AI analysis will take longer but provides insights about potential
            issues.
          </p>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>
    </div>
  );
};
