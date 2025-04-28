import React, { useState } from 'react';
import { SavedSimulation, GenerateReportParams } from '../hooks/websocket/topic-hooks/useLiquiditySim';
import SimulationReportModal from './SimulationReportModal';

interface SavedSimulationsListProps {
  simulations: SavedSimulation[];
  loading: boolean;
  onLoad: (id: string) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onGenerateReport: (id: string, params: GenerateReportParams) => Promise<any>;
  isGenerating: boolean;
  reportUrl: string | null;
}

/**
 * Component to display and manage saved simulations
 */
const SavedSimulationsList: React.FC<SavedSimulationsListProps> = ({
  simulations,
  loading,
  onLoad,
  onDelete,
  onGenerateReport,
  isGenerating,
  reportUrl
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSimulation, setSelectedSimulation] = useState<SavedSimulation | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Filter simulations based on search query
  const filteredSimulations = simulations.filter(sim => 
    sim.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sim.description && sim.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (sim.tags && sim.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Handle opening report generation modal
  const handleReportClick = (simulation: SavedSimulation) => {
    setSelectedSimulation(simulation);
    setReportModalOpen(true);
  };
  
  // Handle generating a report for a saved simulation
  const handleGenerateReport = async (params: GenerateReportParams) => {
    if (selectedSimulation) {
      await onGenerateReport(selectedSimulation.id, params);
      // Keep modal open to show download link
    }
  };
  
  return (
    <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Saved Simulations</h2>
      
      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, description, or tags..."
          className="w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        />
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-t-2 border-brand-400 rounded-full"></div>
          <span className="ml-3 text-gray-400">Loading saved simulations...</span>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && filteredSimulations.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">
            {searchQuery
              ? 'No matching simulations found'
              : 'No saved simulations yet'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-brand-400 hover:text-brand-300"
            >
              Clear search
            </button>
          )}
        </div>
      )}
      
      {/* Simulations list */}
      {!loading && filteredSimulations.length > 0 && (
        <div className="space-y-4">
          {filteredSimulations.map((simulation) => (
            <div
              key={simulation.id}
              className="bg-dark-300/70 border border-dark-400 hover:border-brand-500/30 rounded-lg p-4 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-100">
                    {simulation.name}
                    {simulation.tokenInfo && (
                      <span className="ml-2 text-sm text-brand-400">
                        ({simulation.tokenInfo.symbol})
                      </span>
                    )}
                  </h3>
                  
                  {simulation.description && (
                    <p className="text-sm text-gray-400 mt-1">{simulation.description}</p>
                  )}
                  
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    <span className="mr-4">Created: {formatDate(simulation.createdAt)}</span>
                    <span>By: {simulation.createdBy}</span>
                  </div>
                  
                  {simulation.tags && simulation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {simulation.tags.map((tag) => (
                        <div
                          key={tag}
                          className="bg-brand-500/10 border border-brand-500/30 rounded-full px-2 py-0.5 text-xs text-gray-300"
                        >
                          {tag}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleReportClick(simulation)}
                    title="Generate Report"
                    className="text-gray-400 hover:text-brand-400 p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => onLoad(simulation.id)}
                    title="Load Simulation"
                    className="text-gray-400 hover:text-green-400 p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => setConfirmDeleteId(simulation.id)}
                    title="Delete Simulation"
                    className="text-gray-400 hover:text-red-400 p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Delete confirmation */}
              {confirmDeleteId === simulation.id && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm mb-2">
                    Are you sure you want to delete this simulation?
                  </p>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="bg-dark-400 hover:bg-dark-500 text-gray-300 text-xs font-medium py-1 px-3 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onDelete(simulation.id);
                        setConfirmDeleteId(null);
                      }}
                      className="bg-red-500/80 hover:bg-red-500 text-white text-xs font-medium py-1 px-3 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Report generation modal */}
      {selectedSimulation && (
        <SimulationReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          onSave={() => Promise.resolve()} // Not used in this context
          onGenerateReport={handleGenerateReport}
          isSaving={false}
          isGenerating={isGenerating}
          reportUrl={reportUrl}
          mode="report"
          tokenSymbol={selectedSimulation.tokenInfo?.symbol}
        />
      )}
    </div>
  );
};

export default SavedSimulationsList;