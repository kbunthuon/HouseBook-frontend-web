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
<<<<<<< HEAD
import { getPropertyDetails, getProperty, getUserIdByEmail, getPropertyImages } from "../../../backend/FetchData";
=======
import { getPropertyDetails, getProperty, getUserInfoByEmail } from "../../../backend/FetchData";
import { ImageUpload, getPropertyImages } from "../../../backend/ImageUpload";
>>>>>>> main



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

  // State for property images and selected images
  const [propertyImages, setPropertyImages] = useState<{ name: string; url: string }[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // State for section selection
  const [sectionSelection, setSectionSelection] = useState<{
    generalInfo: boolean;
    plans: boolean;
    images: boolean;
    spaces: { [spaceId: string]: boolean };
    assets: { [assetId: string]: boolean };
  }>({
    generalInfo: true,
    plans: true,
    images: true,
    spaces: {},
    assets: {},
  });


  // NEW: Fetch properties for the logged-in owner
  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      try {
        // Get userId from email
        const userData = await getUserInfoByEmail(ownerEmail);
        if (!userData) {
          setMyProperties([]);
          setLoadingProperties(false);
          return;
        }
        // Fetch properties from backend
        const props = await getProperty(userData.user_id);
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

  // Fetch property images when property changes
  useEffect(() => {
    if (!reportConfig.propertyId) {
      setPropertyImages([]);
      setSelectedImages([]);
      return;
    }
    (async () => {
      // getPropertyImages returns array of URLs or {name, url}
      const imgs = await getPropertyImages(reportConfig.propertyId);
      // Support both string[] and {name, url}[]
      let imgObjs: { name: string; url: string }[] = [];
      if (imgs.length > 0 && typeof imgs[0] === "string") {
        imgObjs = imgs.map((url: string, idx: number) => ({ name: `Image ${idx + 1}`, url }));
      } else {
        imgObjs = imgs;
      }
      setPropertyImages(imgObjs);
      setSelectedImages(imgObjs.map((img) => img.url)); // default: select all
      // Sync to backend
      syncSelectionToBackend(reportConfig.propertyId, imgObjs.map((img) => img.url), sectionSelection);
    })();
    // eslint-disable-next-line
  }, [reportConfig.propertyId]);

  // Sync image/feature selection to backend whenever they change
  useEffect(() => {
    if (!reportConfig.propertyId) return;
    syncSelectionToBackend(reportConfig.propertyId, selectedImages, sectionSelection);
    // eslint-disable-next-line
  }, [selectedImages, sectionSelection]);

  // Add this placeholder for backend sync (replace with real API call as needed)
  async function syncSelectionToBackend(propertyId: string, selectedImages: string[], selectedFeatures: {spaces: any, assets: any}) {
    // TODO: Implement backend sync logic here
    // For now, just log
    console.log("Syncing selection to backend", { propertyId, selectedImages, selectedFeatures });
  }

  // Handle image selection toggle
  const handleImageSelect = (url: string) => {
    setSelectedImages((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  // Handle section/asset selection toggle
  const handleSectionToggle = (type: "generalInfo" | "plans", checked: boolean) => {
    setSectionSelection((prev) => ({ ...prev, [type]: checked }));
  };
  const handleSpaceToggle = (spaceId: string, checked: boolean) => {
    setSectionSelection((prev) => ({
      ...prev,
      spaces: { ...prev.spaces, [spaceId]: checked },
    }));
  };
  const handleAssetToggle = (assetId: string, checked: boolean) => {
    setSectionSelection((prev) => ({
      ...prev,
      assets: { ...prev.assets, [assetId]: checked },
    }));
  };

  // Add select all logic for images and spaces/assets
  const allImagesSelected = propertyImages.length > 0 && selectedImages.length === propertyImages.length;
  const handleSelectAllImages = (checked: boolean) => {
    setSelectedImages(checked ? propertyImages.map(img => img.url) : []);
  };

  const allSpacesSelected = property?.spaces && Object.values(sectionSelection.spaces).filter(Boolean).length === property.spaces.length;
  const handleSelectAllSpaces = (checked: boolean) => {
    if (!property?.spaces) return;
    const newSpaces: { [spaceId: string]: boolean } = {};
    property.spaces.forEach((space: any) => {
      newSpaces[space.space_id] = checked;
    });
    setSectionSelection(prev => ({
      ...prev,
      spaces: newSpaces,
    }));
  };

  const allAssetsSelected = property?.spaces && property.spaces
    .flatMap((space: any) => space.assets || [])
    .every((asset: any) => sectionSelection.assets[asset.asset_id]);
  const handleSelectAllAssets = (checked: boolean) => {
    if (!property?.spaces) return;
    const newAssets: { [assetId: string]: boolean } = {};
    property.spaces.forEach((space: any) => {
      (space.assets || []).forEach((asset: any) => {
        newAssets[asset.asset_id] = checked;
      });
    });
    setSectionSelection(prev => ({
      ...prev,
      assets: newAssets,
    }));
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Generate New Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property & Report Type */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="property">Select Property</Label>
              <Select onValueChange={(value: string) => setReportConfig({...reportConfig, propertyId: value})}>
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
          </div>

          {/* Section selection checkboxes */}
          <div className="space-y-2">
            <Label className="block mb-1">Sections to include</Label>
            <div className="flex flex-col gap-2 bg-muted/50 rounded-lg p-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sectionSelection.generalInfo}
                  onChange={(e) => handleSectionToggle("generalInfo", e.target.checked)}
                /> General Information
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sectionSelection.plans}
                  onChange={(e) => handleSectionToggle("plans", e.target.checked)}
                /> Plans & Documents
              </label>
            </div>
          </div>

          {/* Property Images selection */}
          {propertyImages.length > 0 && (
            <div className="space-y-2">
              <Label className="block mb-1">Property Images</Label>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={allImagesSelected}
                  onChange={e => handleSelectAllImages(e.target.checked)}
                  id="selectAllImages"
                />
                <Label htmlFor="selectAllImages" className="ml-2 text-sm cursor-pointer">Select All Images</Label>
              </div>
              <div className="flex flex-wrap gap-3 bg-muted/50 rounded-lg p-3">
                {propertyImages.map((img) => (
                  <div key={img.url} className="relative group">
                    <img
                      src={img.url}
                      alt={img.name}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: selectedImages.includes(img.url)
                          ? "2px solid #0070f3"
                          : "1px solid #ccc",
                        cursor: "pointer",
                        boxShadow: selectedImages.includes(img.url) ? "0 0 0 2px #0070f3" : undefined,
                        transition: "box-shadow 0.2s"
                      }}
                      onClick={() => handleImageSelect(img.url)}
                      title={selectedImages.includes(img.url) ? "Deselect" : "Select"}
                    />
                    {selectedImages.includes(img.url) && (
                      <span
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          background: "#0070f3",
                          color: "#fff",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Space/asset selection */}
          {property?.spaces && (
            <div className="space-y-2">
              <Label className="block mb-1">Spaces & Assets to include</Label>
              <div className="flex items-center gap-4 mb-2">
                <input
                  type="checkbox"
                  checked={!!allSpacesSelected}
                  onChange={e => handleSelectAllSpaces(e.target.checked)}
                  id="selectAllSpaces"
                />
                <Label htmlFor="selectAllSpaces" className="text-sm cursor-pointer">Select All Spaces</Label>
                <input
                  type="checkbox"
                  checked={!!allAssetsSelected}
                  onChange={e => handleSelectAllAssets(e.target.checked)}
                  id="selectAllAssets"
                />
                <Label htmlFor="selectAllAssets" className="text-sm cursor-pointer">Select All Assets</Label>
              </div>
              <div className="flex flex-col gap-2 bg-muted/50 rounded-lg p-3">
                {property.spaces.map((space: any) => (
                  <div key={space.space_id} className="mb-1">
                    <label className="flex items-center gap-2 font-medium">
                      <input
                        type="checkbox"
                        checked={!!sectionSelection.spaces[space.space_id]}
                        onChange={(e) => handleSpaceToggle(space.space_id, e.target.checked)}
                      />
                      {space.name}
                    </label>
                    <div className="ml-6 flex flex-col gap-1">
                      {(space.assets || []).map((asset: any) => (
                        <label key={asset.asset_id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!sectionSelection.assets[asset.asset_id]}
                            onChange={(e) => handleAssetToggle(asset.asset_id, e.target.checked)}
                          />
                          {asset.type}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            minHeight: 1123,
            background: "#f7f8fa",
            padding: 0,
            color: "#222",
            fontFamily: "'Segoe UI', 'Arial', 'Helvetica Neue', Arial, sans-serif",
            boxSizing: "border-box",
          }}
        >
          <style>
            {`
              :root, * {
                --background: #fff !important;
                --foreground: #222 !important;
                --card: #fff !important;
                --card-foreground: #222 !important;
                --popover: #fff !important;
                --popover-foreground: #222 !important;
                --primary: #1a237e !important;
                --primary-foreground: #fff !important;
                --secondary: #f3f6fa !important;
                --secondary-foreground: #222 !important;
                --muted: #ececf0 !important;
                --muted-foreground: #717182 !important;
                --accent: #e9ebef !important;
                --accent-foreground: #222 !important;
                --destructive: #d4183d !important;
                --destructive-foreground: #fff !important;
                --border: #e5e7eb !important;
                --input: #fff !important;
                --input-background: #fff !important;
                --ring: #1a237e !important;
                --sidebar: #fff !important;
                --sidebar-foreground: #222 !important;
                --sidebar-primary: #1a237e !important;
                --sidebar-primary-foreground: #fff !important;
                --sidebar-accent: #f3f6fa !important;
                --sidebar-accent-foreground: #222 !important;
                --sidebar-border: #e5e7eb !important;
                --sidebar-ring: #1a237e !important;
                color: #222 !important;
                background: #fff !important;
              }
              @media print {
                .pdf-header, .pdf-footer { position: fixed; width: 100%; left: 0; }
                .pdf-header { top: 0; }
                .pdf-footer { bottom: 0; }
              }
              .pdf-header {
                background: #fff;
                border-bottom: 2px solid #e5e7eb;
                padding: 24px 40px 12px 40px;
                display: flex;
                align-items: center;
                justify-content: space-between;
              }
              .pdf-logo {
                font-size: 1.3rem;
                font-weight: 700;
                color: #1a237e;
                letter-spacing: 1px;
              }
              .pdf-title {
                font-size: 1.1rem;
                font-weight: 600;
                color: #222;
                letter-spacing: 0.5px;
              }
              .pdf-footer {
                background: #fff;
                border-top: 1px solid #e5e7eb;
                color: #888;
                font-size: 0.95rem;
                text-align: right;
                padding: 10px 40px 10px 0;
              }
              .pdf-content {
                padding: 36px 40px 24px 40px;
              }
              .pdf-section {
                background: #fff;
                border: 1px solid #e5e7eb;
                box-shadow: 0 2px 8px rgba(30, 41, 59, 0.04);
                border-radius: 10px;
                padding: 24px 32px 20px 32px;
                margin-bottom: 28px;
                margin-top: 0;
              }
              .pdf-section-title {
                font-size: 1.18rem;
                font-weight: 600;
                margin-bottom: 14px;
                color: #1a237e;
                letter-spacing: 0.2px;
                border-left: 4px solid #1a237e;
                padding-left: 12px;
                background: #f3f6fa;
              }
              .pdf-label {
                font-weight: 500;
                margin-right: 6px;
                color: #374151;
              }
              .pdf-sub {
                color: #222;
                font-size: 1.01rem;
                margin-bottom: 7px;
                line-height: 1.7;
              }
              .pdf-divider {
                border-bottom: 2px solid #e5e7eb;
                margin: 18px 0 24px 0;
              }
              .pdf-images-row {
                display: flex;
                flex-wrap: wrap;
                gap: 18px;
                margin-top: 8px;
              }
              .pdf-image-container {
                background: #f3f6fa;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(30, 41, 59, 0.07);
                padding: 8px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 220px;
                min-height: 160px;
                max-width: 260px;
                max-height: 180px;
              }
              .pdf-image {
                width: 220px;
                height: 150px;
                object-fit: cover;
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(30, 41, 59, 0.10);
                border: 1px solid #e5e7eb;
                background: #fff;
              }
              .pdf-space-title {
                font-size: 1.05rem;
                font-weight: 500;
                color: #374151;
                margin-bottom: 8px;
                margin-top: 8px;
              }
            `}
          </style>
          {/* PDF Header */}
          <div className="pdf-header">
            <span className="pdf-logo">HouseBook</span>
            <span className="pdf-title">Property Report</span>
          </div>
          <div className="pdf-content">
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: "1.45rem", fontWeight: 700, marginBottom: 4, color: "#1a237e" }}>
                Review Your Submission
              </h2>
              <div className="pdf-divider" />
            </div>

            {/* General Information */}
            {sectionSelection.generalInfo && (
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
            )}

            {/* Plans & Documents */}
            {sectionSelection.plans && (
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
            )}

            {/* Property Images */}
            {selectedImages.length > 0 && (
              <div className="pdf-section">
                <div className="pdf-section-title">Property Images</div>
                <div className="pdf-images-row">
                  {selectedImages.map((url, idx) => (
                    <div className="pdf-image-container" key={url + idx}>
                      <img
                        src={url}
                        alt={`Property ${idx + 1}`}
                        className="pdf-image"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamically render all spaces and their assets */}
            {property?.spaces?.map((space: any) =>
              sectionSelection.spaces[space.space_id] ? (
                <div className="pdf-section" key={space.space_id}>
                  <div className="pdf-section-title">{space.name}</div>
                  {space.assets && space.assets.length > 0 ? (
                    space.assets
                      .filter((asset: any) => sectionSelection.assets[asset.asset_id])
                      .map((asset: any) => (
                        <div className="pdf-sub" key={asset.asset_id}>
                          <span className="pdf-label">{asset.type}:</span>
                          {asset.description || "No description available"}
                        </div>
                      ))
                  ) : (
                    <div className="pdf-sub">No details available</div>
                  )}
                </div>
              ) : null
            )}
          </div>
          {/* PDF Footer */}
          {/* <div className="pdf-footer">
            Generated by HouseBook &mdash; {new Date().toLocaleDateString()}
          </div> */}
        </div>
      </div>
    </div>
  );
}