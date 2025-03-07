import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/Tabs";
import { systemReportsService } from "../../services/systemReportsService";
import { SystemReport } from "../../types/systemReports";

interface ReportViewerProps {
  report: SystemReport;
  onClose: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  onClose,
}) => {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setActiveTab] = useState("report");

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
    } catch (e) {
      return timestamp;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  useEffect(() => {
    const fetchReportContent = async () => {
      setLoading(true);
      setError(null);
      try {
        if (report.type === "service") {
          const response = await systemReportsService.getServiceReport(
            report.id
          );
          if (response.success) {
            setContent(response.report.content);
          } else {
            setError("Failed to fetch service report content");
          }
        } else if (report.type === "db") {
          const response = await systemReportsService.getDbReport(report.id);
          if (response.success) {
            setContent(response.report.content);
          } else {
            setError("Failed to fetch database report content");
          }
        } else if (report.type === "prisma") {
          const response = await systemReportsService.getPrismaReport(report.id);
          if (response.success) {
            setContent(response.report.content);
          } else {
            setError("Failed to fetch Prisma schema reconciliation report");
          }
        }
      } catch (err) {
        setError("An error occurred while fetching report content");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportContent();
  }, [report.id, report.type]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-dark-200/90 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-dark-300 animate-fade-in">
        <div className="p-6 border-b border-dark-300/70 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-cyber-500/5 opacity-70 pointer-events-none" />
          <div className="flex justify-between items-center relative">
            <div>
              <h2 className="text-xl font-semibold text-gray-100 font-heading">
                {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                <div className="h-1 w-24 bg-gradient-to-r from-brand-500 to-cyber-500 rounded mt-2"></div>
              </h2>
              <p className="text-gray-400 text-sm mt-2 font-mono">
                Generated on {formatTimestamp(report.timestamp)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 bg-dark-300/50 hover:bg-dark-300/70 p-2 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/5 via-transparent to-cyber-500/5 opacity-70 pointer-events-none" />
          
          {loading ? (
            <div className="flex justify-center items-center h-64 relative">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
              <p className="absolute mt-20 text-gray-300">Loading report data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 text-red-400 p-5 rounded-md border border-red-900/40 relative">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              {report.type === "service" ? (
                <ServiceReportView
                  content={content}
                  formatTimestamp={formatTimestamp}
                />
              ) : (
                <DatabaseReportView
                  content={content}
                  hasAiAnalysis={report.hasAiAnalysis}
                  onTabChange={setActiveTab}
                  copyToClipboard={copyToClipboard}
                  title={report.type === "prisma" ? "Prisma Schema Reconciliation" : "Database Report"}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ServiceReportViewProps {
  content: any;
  formatTimestamp: (timestamp: string) => string;
}

const ServiceReportView: React.FC<ServiceReportViewProps> = ({
  content,
  formatTimestamp,
}) => {
  if (!content || !content.report) {
    return (
      <div className="text-center py-8 text-gray-300 bg-dark-300/30 rounded-lg p-6 border border-dark-300/50">
        <svg className="mx-auto h-12 w-12 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg">No service data available</p>
      </div>
    );
  }

  const { report: serviceReport } = content;
  const healthData = serviceReport.service_health;

  const healthStats = {
    healthy: healthData.healthy,
    degraded: healthData.degraded,
    down: healthData.error,
    total: serviceReport.total_services,
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-300/40 backdrop-blur-sm p-4 rounded-lg border border-dark-300/70 transition-all hover:border-brand-500/30 group">
          <div className="text-sm text-gray-400 mb-1">Total Services</div>
          <div className="text-3xl font-semibold text-gray-100 font-mono tabular-nums flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-400 group-hover:text-gray-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
            </svg>
            {healthStats.total}
          </div>
        </div>
        
        <div className="bg-green-900/20 backdrop-blur-sm p-4 rounded-lg border border-green-900/30 transition-all hover:border-green-500/50 group">
          <div className="text-sm text-green-400 mb-1">Healthy</div>
          <div className="text-3xl font-semibold text-green-300 font-mono tabular-nums flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {healthStats.healthy}
          </div>
        </div>
        
        <div className="bg-yellow-900/20 backdrop-blur-sm p-4 rounded-lg border border-yellow-900/30 transition-all hover:border-yellow-500/50 group">
          <div className="text-sm text-yellow-400 mb-1">Degraded</div>
          <div className="text-3xl font-semibold text-yellow-300 font-mono tabular-nums flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {healthStats.degraded}
          </div>
        </div>
        
        <div className="bg-red-900/20 backdrop-blur-sm p-4 rounded-lg border border-red-900/30 transition-all hover:border-red-500/50 group">
          <div className="text-sm text-red-400 mb-1">Down</div>
          <div className="text-3xl font-semibold text-red-300 font-mono tabular-nums flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {healthStats.down}
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-100 font-heading flex items-center">
            <svg className="w-5 h-5 mr-2 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
            </svg>
            Services Detail
          </h3>
          <span className="text-sm text-gray-400 font-mono">Last updated: {formatTimestamp(serviceReport.timestamp)}</span>
        </div>
        
        <div className="bg-dark-200/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-dark-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-300/70">
              <thead className="bg-dark-300/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Check
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-300/50">
                {Object.entries(serviceReport.services).map(
                  ([name, service]: [string, any]) => (
                    <tr key={name} className="hover:bg-dark-300/40 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-200">{name}</div>
                        <div className="text-sm text-gray-400 font-mono">
                          {service.endpoint || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            service.status === "healthy"
                              ? "success"
                              : service.status === "degraded"
                              ? "warning"
                              : "error"
                          }
                        >
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-1.5 animate-pulse ${
                              service.status === "healthy"
                                ? "bg-green-900"
                                : service.status === "degraded"
                                ? "bg-yellow-900"
                                : "bg-red-900"
                            }`}></div>
                            {service.status}
                          </div>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-200 font-mono">
                        {service.response_time 
                          ? `${service.response_time} ms`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                        {service.last_check
                          ? formatTimestamp(service.last_check)
                          : "-"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DatabaseReportViewProps {
  content: any;
  hasAiAnalysis: boolean;
  onTabChange: (tab: string) => void;
  copyToClipboard: (text: string) => void;
  title?: string;
}

const DatabaseReportView: React.FC<DatabaseReportViewProps> = ({
  content,
  hasAiAnalysis,
  onTabChange,
  copyToClipboard,
  title = "Database Report",
}) => {
  if (!content) {
    return (
      <div className="text-center py-8 text-gray-300 bg-dark-300/30 rounded-lg p-6 border border-dark-300/50">
        <svg className="mx-auto h-12 w-12 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        <p className="text-lg">No database report data available</p>
      </div>
    );
  }

  return (
    <div>
      <Tabs 
        defaultValue="report" 
        onValueChange={onTabChange}
        className="relative z-10"
      >
        <TabsList className="bg-dark-300/50 p-1">
          <TabsTrigger 
            value="report"
            className="data-[state=active]:bg-brand-500 data-[state=active]:text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            {title}
          </TabsTrigger>
          {hasAiAnalysis && (
            <TabsTrigger 
              value="ai-analysis"
              className="data-[state=active]:bg-cyber-500 data-[state=active]:text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Analysis
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="report" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-100 font-heading flex items-center">
                <svg className="w-5 h-5 mr-2 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                {title}
              </h3>
              <button
                onClick={() => copyToClipboard(content.report)}
                className="text-sm text-brand-400 hover:text-brand-300 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy to clipboard
              </button>
            </div>
            <div className="bg-dark-300/30 border border-dark-300/70 p-5 rounded-lg shadow-inner overflow-auto max-h-[50vh]">
              <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                {content.report}
              </pre>
            </div>
          </div>
        </TabsContent>
        {hasAiAnalysis && content.aiAnalysis && (
          <TabsContent value="ai-analysis" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-100 font-heading flex items-center">
                  <svg className="w-5 h-5 mr-2 text-cyber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Analysis
                </h3>
                <button
                  onClick={() => copyToClipboard(content.aiAnalysis)}
                  className="text-sm text-cyber-400 hover:text-cyber-300 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy to clipboard
                </button>
              </div>
              <div className="bg-gradient-to-br from-dark-300/40 to-dark-300/20 border border-cyber-500/20 p-5 rounded-lg shadow-inner overflow-auto max-h-[50vh] relative">
                {/* AI glow effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyber-500/5 via-transparent to-cyber-500/5 opacity-70 pointer-events-none animate-pulse-slow" />
                
                <div className="prose prose-invert prose-sm max-w-none relative">
                  {content.aiAnalysis
                    .split("\n")
                    .map((line: string, i: number) => (
                      <p key={i} className={`${line.startsWith('Warning:') ? 'text-yellow-400' : ''} ${line.startsWith('Error:') ? 'text-red-400' : ''} ${line.startsWith('Critical:') ? 'text-red-500 font-bold' : ''}`}>
                        {line}
                      </p>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
