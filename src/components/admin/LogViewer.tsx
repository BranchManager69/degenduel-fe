import React, { useEffect, useState } from 'react';
import { ddApi } from '../../services/dd-api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

interface LogFile {
  name: string;
  size: number;
  created: string;
  modified: string;
}

export const LogViewer: React.FC = () => {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [logContent, setLogContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format file size to human readable format
  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Load available log files
  useEffect(() => {
    const fetchLogFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ddApi.admin.getLogs();
        setLogFiles(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load log files');
      } finally {
        setLoading(false);
      }
    };

    fetchLogFiles();
  }, []);

  // Load specific log file content
  const handleLogSelect = async (filename: string) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedLog(filename);
      const response = await ddApi.admin.getLogContent(filename);
      setLogContent(response.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load log content');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedLog) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !selectedLog) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Log Files List */}
        <div className="w-full md:w-1/3 space-y-4">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Log Files</h2>
          <div className="space-y-2">
            {logFiles.map((file) => (
              <button
                key={file.name}
                onClick={() => handleLogSelect(file.name)}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  selectedLog === file.name
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <div className="font-medium">{file.name}</div>
                <div className="text-sm opacity-75 space-y-1">
                  <div>Size: {formatFileSize(file.size)}</div>
                  <div>Modified: {new Date(file.modified).toLocaleString()}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Log Content */}
        <div className="w-full md:w-2/3">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            {selectedLog ? `Log Content: ${selectedLog}` : 'Select a log file'}
          </h2>
          {loading && selectedLog ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : error && selectedLog ? (
            <ErrorMessage message={error} />
          ) : selectedLog ? (
            <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm text-gray-300 max-h-[600px] overflow-y-auto">
              {logContent}
            </pre>
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
              Select a log file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
