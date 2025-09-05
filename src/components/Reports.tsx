import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { FileText, Download, Calendar, Filter, BarChart3 } from "lucide-react";

export function Reports() {
  const [reportConfig, setReportConfig] = useState({
    propertyId: "",
    reportType: "",
    includeImages: false,
    includePlans: false,
    includeUtilities: false,
    includeFittings: false,
    dateFrom: "",
    dateTo: ""
  });

  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);

  const recentReports = [
    {
      id: 1,
      name: "Maple Heights - Complete Report",
      property: "Maple Heights Development",
      type: "Complete",
      generatedDate: "2024-01-20",
      size: "2.3 MB",
      status: "ready"
    },
    {
      id: 2,
      name: "Riverside Apartments - Utilities Report",
      property: "Riverside Apartments",
      type: "Utilities",
      generatedDate: "2024-01-19",
      size: "856 KB",
      status: "ready"
    },
    {
      id: 3,
      name: "Oak Grove - Property Overview",
      property: "Oak Grove Complex",
      type: "Overview",
      generatedDate: "2024-01-18",
      size: "1.1 MB",
      status: "generating"
    }
  ];

  const properties = [
    { id: "1", name: "Maple Heights Development" },
    { id: "2", name: "Riverside Apartments" },
    { id: "3", name: "Oak Grove Complex" },
    { id: "4", name: "Pine Valley Homes" }
  ];

  const reportTypes = [
    // { value: "complete", label: "Complete Property Report" },
    { value: "overview", label: "Property Overview" },
    // { value: "utilities", label: "Utilities Report" },
    // { value: "fittings", label: "Fittings & Features" },
    // { value: "financial", label: "Financial Summary" },
    { value: "maintenance", label: "Maintenance History" }
  ];

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setReportProgress(0);

    // Simulate report generation progress
    const interval = setInterval(() => {
      setReportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setGeneratingReport(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const downloadReport = (reportId: number) => {
    console.log(`Downloading report ${reportId}`);
    // In a real app, this would trigger a file download
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "default";
      case "generating":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Reports & Export</h1>
        <p className="text-muted-foreground">
          Generate comprehensive property reports
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Generate New Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="property">Property</Label>
              <Select onValueChange={(value) => setReportConfig({...reportConfig, propertyId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select onValueChange={(value) => setReportConfig({...reportConfig, reportType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Include in Report</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeImages"
                    checked={reportConfig.includeImages}
                    onCheckedChange={(checked) => 
                      setReportConfig({...reportConfig, includeImages: checked as boolean})
                    }
                  />
                  <Label htmlFor="includeImages">Images & Photos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePlans"
                    checked={reportConfig.includePlans}
                    onCheckedChange={(checked) => 
                      setReportConfig({...reportConfig, includePlans: checked as boolean})
                    }
                  />
                  <Label htmlFor="includePlans">Floor Plans & Drawings</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeUtilities"
                    checked={reportConfig.includeUtilities}
                    onCheckedChange={(checked) => 
                      setReportConfig({...reportConfig, includeUtilities: checked as boolean})
                    }
                  />
                  <Label htmlFor="includeUtilities">Utility Information</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeFittings"
                    checked={reportConfig.includeFittings}
                    onCheckedChange={(checked) => 
                      setReportConfig({...reportConfig, includeFittings: checked as boolean})
                    }
                  />
                  <Label htmlFor="includeFittings">Fittings & Features</Label>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={reportConfig.dateFrom}
                  onChange={(e) => setReportConfig({...reportConfig, dateFrom: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={reportConfig.dateTo}
                  onChange={(e) => setReportConfig({...reportConfig, dateTo: e.target.value})}
                />
              </div>
            </div>

            {generatingReport && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generating report...</span>
                  <span>{reportProgress}%</span>
                </div>
                <Progress value={reportProgress} />
              </div>
            )}

            <Button 
              onClick={handleGenerateReport} 
              className="w-full"
              disabled={generatingReport || !reportConfig.propertyId || !reportConfig.reportType}
            >
              {generatingReport ? "Generating..." : "Generate Report"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Report Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="text-center">
                <div className="text-2xl font-bold">47</div>
                <div className="text-sm text-muted-foreground">Total Reports</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-muted-foreground">This Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">2.3</div>
                <div className="text-sm text-muted-foreground">Avg Size (MB)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">98%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Complete Reports</span>
                <span className="text-sm text-muted-foreground">65%</span>
              </div>
              <Progress value={65} />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Utility Reports</span>
                <span className="text-sm text-muted-foreground">25%</span>
              </div>
              <Progress value={25} />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Overview Reports</span>
                <span className="text-sm text-muted-foreground">10%</span>
              </div>
              <Progress value={10} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{report.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {report.property} • {report.generatedDate} • {report.size}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={getStatusColor(report.status)}>
                    {report.status}
                  </Badge>
                  {report.status === "ready" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(report.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}