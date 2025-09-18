"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { FileText, Download, BarChart3 } from "lucide-react";
import { getPropertyDetails, getProperty, getUserIdByEmail } from "../../../backend/FetchData";



const html2pdfRef = { current: null as any };


async function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) => {
      const el = img as HTMLImageElement;
      if (el.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        el.addEventListener("load", () => resolve(), { once: true });
        el.addEventListener("error", () => resolve(), { once: true });
      });
    })
  );
}



interface MyReportsProps {
  ownerEmail: string;
}

export function MyReports({ ownerEmail }: MyReportsProps) {

  useEffect(() => {
    if (typeof window === "undefined") return;
    (async () => {
      try {
        const mod = await import("html2pdf.js");
        html2pdfRef.current = (mod as any).default || (mod as any);
        console.log("[MyReports] html2pdf loaded:", !!html2pdfRef.current);
      } catch (e) {
        console.error("[MyReports] failed to load html2pdf.js", e);
      }
    })();
  }, []);


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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [property, setProperty] = useState<any>(null);

  // NEW: State for real properties
  const [myProperties, setMyProperties] = useState<{ id: string; name: string }[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);


  // NEW: Fetch properties for the logged-in owner
  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      try {
        // Get userId from email
        const userId = await getUserIdByEmail(ownerEmail);
        if (!userId) {
          setMyProperties([]);
          setLoadingProperties(false);
          return;
        }
        // Fetch properties from backend
        const props = await getProperty(userId);
        if (props && Array.isArray(props)) {
          setMyProperties(props.map((p) => ({ id: p.property_id, name: p.name })));
        } else {
          setMyProperties([]);
        }
      } catch (e) {
        setMyProperties([]);
      }
      setLoadingProperties(false);
    };
    fetchProperties();
  }, [ownerEmail]);


  const reportTypes = [
    { value: "overview", label: "Property Overview" },
    { value: "maintenance", label: "Maintenance History" }
  ];

  const handleGenerateReport = async () => {
    setErrorMsg(null);
    console.log("[MyReports] click -> handleGenerateReport");
    const html2pdf = html2pdfRef.current;
    console.log("[MyReports] html2pdfRef.current:", html2pdf);
    console.log("[MyReports] previewRef.current:", previewRef.current);
    if (!html2pdf) {
      setErrorMsg("PDF generator is not ready yet. Please try again in a few seconds.");
      return;
    }
    if (!previewRef.current) {
      setErrorMsg("Preview area not found.");
      return;
    }
    if (!reportConfig.propertyId || !reportConfig.reportType) {
      setErrorMsg("Please select both property and report type.");
      return;
    }

    try {
      setGeneratingReport(true);
      setReportProgress(10);

      await waitForImages(previewRef.current);
      setReportProgress(70);

      const filename = `property_${reportConfig.propertyId}_${reportConfig.reportType}.pdf`;

      await html2pdf()
        .set({
          margin: 0.5,
          filename,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: false, logging: false },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
        })
        .from(previewRef.current)
        .save();

      setReportProgress(100);
      console.log("[MyReports] PDF saved:", filename);
    } catch (err) {
      setErrorMsg("Failed to generate PDF. See console for details.");
      console.error("[MyReports] Error generating report:", err);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Stack trace:", err.stack);
      }
    } finally {
      setTimeout(() => setGeneratingReport(false), 250);
    }
  };


  const downloadReport = (reportId: number) => {
    console.log(`Downloading report ${reportId}`);
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

  useEffect(() => {
    if (!reportConfig.propertyId) return;
    (async () => {
      const data = await getPropertyDetails(reportConfig.propertyId);
      setProperty(data);
    })();
  }, [reportConfig.propertyId]);

  return (
    <div className="space-y-6">
      {/* Controls */}
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
              <Select onValueChange={(value: string) => setReportConfig({ ...reportConfig, propertyId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingProperties ? "Loading..." : "Choose your property"} />
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
              <Select onValueChange={(value: string) => setReportConfig({ ...reportConfig, reportType: value })}>
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
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="bg-red-100 text-red-700 p-2 rounded border border-red-300">
          {errorMsg}
        </div>
      )}

      {/* Hidden preview to capture */}
      <div
        style={{
          position: "fixed",
          visibility: "hidden",
          pointerEvents: "none",
          inset: 0,
          background: "#fff",
          color: "#000",
        }}
      >
        <div
          ref={previewRef}
          style={{
            width: 794,
            background: "#fff",
            padding: 24,
            color: "#000",
            fontFamily: "sans-serif",
          }}
        >
          <style>
            {`
              :root, * {
                --background: #fff !important;
                --foreground: #000 !important;
                --card: #fff !important;
                --card-foreground: #000 !important;
                --popover: #fff !important;
                --popover-foreground: #000 !important;
                --primary: #000 !important;
                --primary-foreground: #fff !important;
                --secondary: #eee !important;
                --secondary-foreground: #000 !important;
                --muted: #eee !important;
                --muted-foreground: #888 !important;
                --accent: #eee !important;
                --accent-foreground: #000 !important;
                --destructive: #d4183d !important;
                --destructive-foreground: #fff !important;
                --border: #ccc !important;
                --input: #fff !important;
                --input-background: #fff !important;
                --ring: #000 !important;
                --sidebar: #fff !important;
                --sidebar-foreground: #000 !important;
                --sidebar-primary: #000 !important;
                --sidebar-primary-foreground: #fff !important;
                --sidebar-accent: #eee !important;
                --sidebar-accent-foreground: #000 !important;
                --sidebar-border: #ccc !important;
                --sidebar-ring: #000 !important;
                color: #000 !important;
                background: #fff !important;
              }
              .pdf-section {
                border: 1px solid #ccc;
                border-radius: 12px;
                padding: 18px 24px;
                margin-bottom: 18px;
              }
              .pdf-section-title {
                font-size: 1.1rem;
                font-weight: bold;
                margin-bottom: 8px;
              }
              .pdf-label {
                font-weight: bold;
                margin-right: 6px;
              }
              .pdf-sub {
                color: #444;
                font-size: 0.98rem;
                margin-bottom: 4px;
              }
              .pdf-divider {
                border-bottom: 1px solid #eee;
                margin: 18px 0;
              }
            `}
          </style>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>Review Your Submission</h2>
            <div className="pdf-divider" />
          </div>

          {/* General Information */}
          <div className="pdf-section">
            <div className="pdf-section-title">General Information</div>
            <div className="pdf-sub">
              <span className="pdf-label">Property Name:</span>
              {property?.name || ""}
            </div>
            <div className="pdf-sub">
              <span className="pdf-label">Description:</span>
              {property?.description || ""}
            </div>
            <div className="pdf-sub">
              <span className="pdf-label">Address:</span>
              {property?.address || ""}
            </div>
          </div>

          {/* Plans & Documents */}
          <div className="pdf-section">
            <div className="pdf-section-title">Plans & Documents</div>
            <div className="pdf-sub">
              <span className="pdf-label">Floor Plans:</span>
              No floor plans uploaded
            </div>
            <div className="pdf-sub">
              <span className="pdf-label">Building Plans:</span>
              No building plans uploaded
            </div>
          </div>

          {/* Dynamically render all spaces and their assets */}
          {property?.spaces?.map((space: any) => (
            <div className="pdf-section" key={space.space_id}>
              <div className="pdf-section-title">{space.name}</div>
              {space.assets && space.assets.length > 0 ? (
                space.assets.map((asset: any) => (
                  <div className="pdf-sub" key={asset.asset_id}>
                    <span className="pdf-label">{asset.type}:</span>
                    {asset.description || "No description available"}
                  </div>
                ))
              ) : (
                <div className="pdf-sub">No details available</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}