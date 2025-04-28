import React, { useState } from 'react';
import { GenerateReportParams, SaveSimulationParams } from '../hooks/websocket/topic-hooks/useLiquiditySim';

interface SimulationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (params: SaveSimulationParams) => Promise<any>;
  onGenerateReport: (params: GenerateReportParams) => Promise<any>;
  isSaving: boolean;
  isGenerating: boolean;
  reportUrl: string | null;
  mode: 'save' | 'report';
  tokenSymbol?: string;
}

/**
 * Modal component for saving simulations and generating reports
 */
const SimulationReportModal: React.FC<SimulationReportModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onGenerateReport,
  isSaving,
  isGenerating,
  reportUrl,
  mode,
  tokenSymbol = 'Token'
}) => {
  // Save simulation state
  const [name, setName] = useState(`${tokenSymbol} Liquidation Analysis`);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Report generation state
  const [reportType, setReportType] = useState<'detailed' | 'summary' | 'comparative'>('detailed');
  const [reportTitle, setReportTitle] = useState(`${tokenSymbol} Liquidation Strategy`);
  const [includeCharts, setIncludeCharts] = useState(true);
  
  // Reset form on close
  const handleClose = () => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setName(`${tokenSymbol} Liquidation Analysis`);
      setDescription('');
      setTags([]);
      setTagInput('');
      setReportType('detailed');
      setReportTitle(`${tokenSymbol} Liquidation Strategy`);
      setIncludeCharts(true);
    }, 300);
  };
  
  // Handle tag input
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'save') {
      await onSave({
        name,
        description,
        tags
      });
    } else {
      await onGenerateReport({
        reportType,
        title: reportTitle,
        includeCharts
      });
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200/90 border border-brand-500/30 rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-100">
            {mode === 'save' ? 'Save Simulation' : 'Generate Report'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {mode === 'save' ? (
            // Save simulation form fields
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tags
                </label>
                <div className="flex mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    className="flex-1 bg-dark-300/50 border border-dark-400 rounded-l-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 px-4 rounded-r-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="bg-brand-500/20 border border-brand-500/40 rounded-full px-3 py-1 text-sm flex items-center gap-1"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-gray-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Report generation form fields
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Report Title
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Report Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReportType('detailed')}
                    className={`py-2 px-3 rounded-lg ${
                      reportType === 'detailed'
                        ? 'bg-brand-500/50 border border-brand-500 text-brand-300'
                        : 'bg-dark-300/50 border border-dark-400 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Detailed
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('summary')}
                    className={`py-2 px-3 rounded-lg ${
                      reportType === 'summary'
                        ? 'bg-brand-500/50 border border-brand-500 text-brand-300'
                        : 'bg-dark-300/50 border border-dark-400 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('comparative')}
                    className={`py-2 px-3 rounded-lg ${
                      reportType === 'comparative'
                        ? 'bg-brand-500/50 border border-brand-500 text-brand-300'
                        : 'bg-dark-300/50 border border-dark-400 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Comparative
                  </button>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeCharts"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="h-5 w-5 text-brand-500 focus:ring-brand-500 border-gray-600 rounded"
                />
                <label htmlFor="includeCharts" className="ml-2 text-gray-300">
                  Include charts and visualizations
                </label>
              </div>
              
              {reportUrl && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-300 text-sm">Report generated successfully!</p>
                  <a
                    href={reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-brand-400 hover:text-brand-300 underline"
                  >
                    Download Report
                  </a>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="bg-dark-300 hover:bg-dark-400 text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isGenerating}
              className="bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving || isGenerating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-t-2 border-white rounded-full mr-2"></div>
                  {mode === 'save' ? 'Saving...' : 'Generating...'}
                </>
              ) : (
                mode === 'save' ? 'Save Simulation' : 'Generate Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimulationReportModal;