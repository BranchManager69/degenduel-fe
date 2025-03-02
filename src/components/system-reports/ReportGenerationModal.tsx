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
      console.error("Failed to generate report:", err);
      setError("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-dark-200/90 rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-dark-300 animate-fade-in">
        <div className="p-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-cyber-500/5 opacity-70 pointer-events-none" />
          
          <div className="relative">
            <h2 className="text-xl font-semibold mb-2 text-gray-100 font-heading">Generate System Report</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-brand-500 to-cyber-500 rounded mb-4"></div>
            
            <p className="text-gray-300 mb-6">
              Generate a new system report to analyze the current state of the
              application.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-900/20 text-red-400 rounded-md text-sm border border-red-900/40">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="bg-dark-300/50 rounded-lg p-4 mb-6 border border-dark-300/70">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="withAi"
                  checked={withAi}
                  onChange={(e) => setWithAi(e.target.checked)}
                  className="mr-3 h-5 w-5 accent-brand-500"
                />
                <label htmlFor="withAi" className="text-gray-200 font-medium flex items-center">
                  <svg className="w-5 h-5 mr-2 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Include AI analysis
                </label>
              </div>
              {withAi && (
                <p className="text-gray-400 text-sm mt-3 ml-8">
                  AI will analyze the report data and provide insights on system performance and potential issues.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-dark-300 rounded-md text-gray-300 hover:bg-dark-300/50 hover:text-gray-100 transition-colors"
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="px-5 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50 transition-all duration-200 ease-out transform hover:-translate-y-1 shadow-lg hover:shadow-brand-500/20 relative group overflow-hidden"
                disabled={isGenerating}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/30 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
                <span className="relative flex items-center">
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Report
                      <svg className="ml-2 -mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
