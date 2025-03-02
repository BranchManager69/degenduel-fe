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

  const handleGenerateReport = async (withAi: boolean) => {
    try {
      await systemReportsService.generateReport({ withAi });
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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">System Reports</h1>
        <button
          onClick={() => setIsGenerationModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Generate Report
        </button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium">Report Type</label>
              <Tabs
                defaultValue={filters.type || "all"}
                onValueChange={(value) => handleFilterChange("type", value)}
                className="w-[300px]"
              >
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="service">Service</TabsTrigger>
                  <TabsTrigger value="db">Database</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium">Date</label>
              <input
                type="date"
                value={selectedDate || ""}
                onChange={handleDateChange}
                className="border rounded-md p-2"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="mb-1 text-sm font-medium">
                AI Analysis Only
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.withAiOnly || false}
                  onChange={(e) =>
                    handleFilterChange("withAiOnly", e.target.checked)
                  }
                  className="mr-2"
                />
                <span>Show only reports with AI analysis</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading reports...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-8">No reports found</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Files
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Analysis
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => handleReportClick(report)}
                  className="hover:bg-gray-100 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatTimestamp(report.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        report.type === "service" ? "default" : "secondary"
                      }
                    >
                      {report.type === "service" ? "Service" : "Database"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {report.files.length} file(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {report.hasAiAnalysis ? (
                      <Badge variant="gold">AI Analysis</Badge>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
