import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { ReportGenerationModal } from "../../components/system-reports/ReportGenerationModal";
import { ReportViewer } from "../../components/system-reports/ReportViewer";
import { Badge } from "../../components/ui/Badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/Tabs";
import { systemReportsService } from "../../services/systemReportsService";
import { SystemReport, SystemReportFilters } from "../../types/systemReports";

export const SystemReports: React.FC = () => {
  const [reports, setReports] = useState<SystemReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SystemReportFilters>({
    type: "all",
    withAiOnly: false,
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SystemReport | null>(
    null
  );

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await systemReportsService.getReports(filters);
      if (response.success) {
        setReports(response.reports);
      } else {
        setError("Failed to fetch reports");
      }
    } catch (err) {
      setError("An error occurred while fetching reports");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const handleFilterChange = (
    key: keyof SystemReportFilters,
    value: string | boolean | number
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    setSelectedDate(date);
    handleFilterChange("date", date);
  };

  const handleGenerateReport = async (withAi: boolean, reportType: "service" | "db" | "prisma") => {
    try {
      await systemReportsService.generateReport({ withAi, reportType });
      fetchReports();
      setIsGenerationModalOpen(false);
    } catch (err) {
      console.error("Failed to generate report:", err);
    }
  };

  const handleReportClick = (report: SystemReport) => {
    setSelectedReport(report);
  };

  const handleCloseReportViewer = () => {
    setSelectedReport(null);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, "MMM dd, yyyy HH:mm:ss");
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative group">
          <h1 className="text-3xl font-bold font-heading text-gray-100 relative z-10 group-hover:animate-glitch">
            System Reports
          </h1>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <button
          onClick={() => setIsGenerationModalOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-md shadow-lg transition-all duration-200 ease-out transform hover:-translate-y-1 hover:shadow-brand-500/20 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/30 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
          <span className="relative flex items-center font-medium">
            Generate Report
            <svg 
              className="w-5 h-5 ml-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </span>
        </button>
      </div>

      <Card className="mb-6 bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors">
        <CardHeader className="border-b border-dark-300/50">
          <CardTitle className="text-gray-100">Filters</CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col">
              <label className="mb-2 text-sm font-medium text-gray-300">Report Type</label>
              <Tabs
                defaultValue={filters.type || "all"}
                onValueChange={(value) => handleFilterChange("type", value)}
                className="w-[300px]"
              >
                <TabsList className="grid grid-cols-4 bg-dark-300/50">
                  <TabsTrigger value="all" className="data-[state=active]:bg-brand-500 data-[state=active]:text-white">All</TabsTrigger>
                  <TabsTrigger value="service" className="data-[state=active]:bg-brand-500 data-[state=active]:text-white">Service</TabsTrigger>
                  <TabsTrigger value="db" className="data-[state=active]:bg-brand-500 data-[state=active]:text-white">Database</TabsTrigger>
                  <TabsTrigger value="prisma" className="data-[state=active]:bg-brand-500 data-[state=active]:text-white">Prisma</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-col">
              <label className="mb-2 text-sm font-medium text-gray-300">Date</label>
              <input
                type="date"
                value={selectedDate || ""}
                onChange={handleDateChange}
                className="border border-dark-300 bg-dark-300/30 text-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="mb-2 text-sm font-medium text-gray-300">
                AI Analysis Only
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.withAiOnly || false}
                  onChange={(e) =>
                    handleFilterChange("withAiOnly", e.target.checked)
                  }
                  className="mr-2 accent-brand-500 h-4 w-4"
                />
                <span className="text-gray-200">Show only reports with AI analysis</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-4 text-gray-300">Loading reports...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400 bg-red-900/20 rounded-lg border border-red-900/50 p-4">
          <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-gray-300 bg-dark-200/50 rounded-lg border border-dark-300/50 p-6">
          <svg className="mx-auto h-12 w-12 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg">No reports found</p>
          <p className="text-sm mt-2 text-gray-400">Try adjusting your filters or generate a new report</p>
        </div>
      ) : (
        <div className="bg-dark-200/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-dark-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-300/70">
              <thead className="bg-dark-300/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Files
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    AI Analysis
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-300/50">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => handleReportClick(report)}
                    className="hover:bg-dark-300/40 cursor-pointer group transition-colors relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
                    <td className="px-6 py-4 whitespace-nowrap text-gray-200 font-mono text-sm">
                      {formatTimestamp(report.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          report.type === "service" 
                            ? "default" 
                            : report.type === "db" 
                              ? "secondary" 
                              : "outline"
                        }
                      >
                        {report.type === "service" 
                          ? "Service" 
                          : report.type === "db" 
                            ? "Database" 
                            : "Prisma Schema"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-200">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {report.files.length} file(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.hasAiAnalysis ? (
                        <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-dark-300 font-semibold animate-pulse-slow">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          AI Analysis
                        </Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isGenerationModalOpen && (
        <ReportGenerationModal
          onClose={() => setIsGenerationModalOpen(false)}
          onGenerate={handleGenerateReport}
        />
      )}

      {selectedReport && (
        <ReportViewer
          report={selectedReport}
          onClose={handleCloseReportViewer}
        />
      )}
    </div>
  );
};
