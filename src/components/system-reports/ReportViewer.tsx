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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("report");

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
            setReportContent(response.report);
          } else {
            setError("Failed to fetch service report");
          }
        } else if (report.type === "db") {
          const response = await systemReportsService.getDbReport(report.id);
          if (response.success) {
            setReportContent(response.report);
          } else {
            setError("Failed to fetch database report");
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
  }, [report]);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, "MMM dd, yyyy HH:mm:ss");
    } catch (e) {
      return timestamp;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const renderServiceReport = () => {
    if (
      !reportContent ||
      !reportContent.content ||
      !reportContent.content.report
    ) {
      return <div>No report data available</div>;
    }

    const { report: serviceReport } = reportContent.content;
    const healthData = serviceReport.service_health;

    return (
      <div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="text-2xl font-bold">
              {serviceReport.total_services}
            </div>
            <div className="text-sm text-gray-600">Total Services</div>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {healthData.healthy}
            </div>
            <div className="text-sm text-green-700">Healthy</div>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">
              {healthData.degraded}
            </div>
            <div className="text-sm text-yellow-700">Degraded</div>
          </div>
          <div className="bg-red-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-700">
              {healthData.error}
            </div>
            <div className="text-sm text-red-700">Error</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Services</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(serviceReport.services).map(
                  ([name, service]: [string, any]) => (
                    <tr key={name}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            service.status === "healthy"
                              ? "default"
                              : service.status === "degraded"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {service.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">{service.message || "-"}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDbReport = () => {
    if (!reportContent || !reportContent.content) {
      return <div>No report data available</div>;
    }

    const { report: dbReport, aiAnalysis } = reportContent.content;

    return (
      <div>
        <Tabs defaultValue="report" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="report">Report</TabsTrigger>
            {aiAnalysis && <TabsTrigger value="ai">AI Analysis</TabsTrigger>}
          </TabsList>
          <TabsContent value="report">
            <div className="relative">
              <button
                onClick={() => copyToClipboard(dbReport)}
                className="absolute top-2 right-2 bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                title="Copy to clipboard"
              >
                📋
              </button>
              <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto max-h-[600px]">
                {dbReport}
              </pre>
            </div>
          </TabsContent>
          {aiAnalysis && (
            <TabsContent value="ai">
              <div className="relative">
                <button
                  onClick={() => copyToClipboard(aiAnalysis)}
                  className="absolute top-2 right-2 bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                  title="Copy to clipboard"
                >
                  📋
                </button>
                <div className="prose max-w-none bg-white p-4 rounded-lg overflow-auto max-h-[600px]">
                  {/* This would ideally be rendered as markdown */}
                  <pre>{aiAnalysis}</pre>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">
              {report.type === "service" ? "Service Report" : "Database Report"}
            </h2>
            <p className="text-gray-600">{formatTimestamp(report.timestamp)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading report content...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <div>
            {report.type === "service"
              ? renderServiceReport()
              : renderDbReport()}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
