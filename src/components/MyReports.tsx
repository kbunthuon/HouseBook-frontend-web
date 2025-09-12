import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { FileText, Download, BarChart3 } from "lucide-react";

interface MyReportsProps {
  ownerEmail: string;
}

export function MyReports({ ownerEmail }: MyReportsProps) {
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

  // Mock data filtered by owner
  const getMyProperties = () => {
    if (ownerEmail.includes('john') || ownerEmail.includes('smith')) {
      return [
        { id: "1", name: "Rose Wood Retreat" },
        { id: "5", name: "Sunset Villa" }
      ];
    } else if (ownerEmail.includes('sarah')) {
      return [
        { id: "2", name: "Riverside Apartments" }
      ];
    } else {
      return [
        { id: "3", name: "Oak Grove Complex" }
      ];
    }
  };

  const getMyRecentReports = () => {
    if (ownerEmail.includes('john') || ownerEmail.includes('smith')) {
      return [
        {
          id: 1,
          name: "Rose Wood Retreat - Complete Report",
          property: "Rose Wood Retreat",
          type: "Complete",
          generatedDate: "2024-01-20",
          size: "2.3 MB",
          status: "ready"
        },
        {
          id: 2,
          name: "Sunset Villa - Utilities Report",
          property: "Sunset Villa",
          type: "Utilities",
          generatedDate: "2024-01-18",
          size: "756 KB",
          status: "ready"
        }
      ];
    } else {
      return [
        {
          id: 3,
          name: "Property Overview Report",
          property: ownerEmail.includes('sarah') ? "Riverside Apartments" : "Oak Grove Complex",
          type: "Overview",
          generatedDate: "2024-01-19",
          size: "1.1 MB",
          status: "ready"
        }
      ];
    }
  };

  const myProperties = getMyProperties();
  const myRecentReports = getMyRecentReports();

  const reportTypes = [
    // { value: "complete", label: "Complete Property Report" },
    { value: "overview", label: "Property Overview" },
    // { value: "utilities", label: "Utilities Report" },
    // { value: "fittings", label: "Fittings & Features" },
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
        <h1>My Reports</h1>
        <p className="text-muted-foreground">
          Generate reports for your properties
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
              <Label htmlFor="property">Select Property</Label>
              <Select onValueChange={(value) => setReportConfig({...reportConfig, propertyId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your property" />
                </SelectTrigger>
                <SelectContent>
                  {myProperties.map((property) => (
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
                  <Label htmlFor="includeImages">Property Images</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePlans"
                    checked={reportConfig.includePlans}
                    onCheckedChange={(checked) => 
                      setReportConfig({...reportConfig, includePlans: checked as boolean})
                    }
                  />
                  <Label htmlFor="includePlans">Floor Plans</Label>
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

        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Report Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="text-center">
                <div className="text-2xl font-bold">{myRecentReports.length}</div>
                <div className="text-sm text-muted-foreground">Total Reports</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{myProperties.length}</div>
                <div className="text-sm text-muted-foreground">Properties</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4>Report Types Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Complete Reports</span>
                  <span className="text-sm text-muted-foreground">50%</span>
                </div>
                <Progress value={50} />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Utility Reports</span>
                  <span className="text-sm text-muted-foreground">30%</span>
                </div>
                <Progress value={30} />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Overview Reports</span>
                  <span className="text-sm text-muted-foreground">20%</span>
                </div>
                <Progress value={20} />
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myRecentReports.map((report) => (
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
            {myRecentReports.length === 0 && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Reports Yet</h3>
                <p className="text-muted-foreground">Generate your first property report to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}