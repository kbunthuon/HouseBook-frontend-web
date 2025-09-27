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
import { getPropertyDetails, getProperty, getUserInfoByEmail } from "../../../backend/FetchData";
import { ImageUpload, getPropertyImages } from "../../../backend/ImageUpload";



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
      const imgs = await getPropertyImages(reportConfig.propertyId);
      setPropertyImages(imgs);
      setSelectedImages(imgs.map((img) => img.url)); // default: select all
    })();
  }, [reportConfig.propertyId]);

  // Fetch property details (spaces/assets) and update section selection
  useEffect(() => {
    if (!reportConfig.propertyId) return;
    (async () => {
      const data = await getPropertyDetails(reportConfig.propertyId);
      setProperty(data);
      // Set default section/asset selection
      if (data?.spaces) {
        const newSpaces: { [spaceId: string]: boolean } = {};
        const newAssets: { [assetId: string]: boolean } = {};
        data.spaces.forEach((space: any) => {
          newSpaces[space.space_id] = true;
          (space.assets || []).forEach((asset: any) => {
            newAssets[asset.asset_id] = true;
          });
        });
        setSectionSelection((prev) => ({
          ...prev,
          spaces: newSpaces,
          assets: newAssets,
        }));
      }
    })();
  }, [reportConfig.propertyId]);

  // Handle image selection toggle
  const handleImageSelect = (url: string) => {
    setSelectedImages((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  // Handle section/asset selection toggle
  const handleSectionToggle = (type: "generalInfo" | "plans" | "images", checked: boolean) => {
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

            {/* Section selection checkboxes */}
            <div>
              <Label>Sections to include</Label>
              <div className="flex flex-col gap-1 mt-1">
                <label>
                  <input
                    type="checkbox"
                    checked={sectionSelection.generalInfo}
                    onChange={(e) => handleSectionToggle("generalInfo", e.target.checked)}
                  /> General Information
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={sectionSelection.plans}
                    onChange={(e) => handleSectionToggle("plans", e.target.checked)}
                  /> Plans & Documents
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={sectionSelection.images}
                    onChange={(e) => handleSectionToggle("images", e.target.checked)}
                  /> Property Images
                </label>
              </div>
            </div>

            {/* Image upload and selection */}
            {reportConfig.propertyId && (
              <div>
                <Label>Property Images</Label>
                <ImageUpload
                  propertyId={reportConfig.propertyId}
                  existingImages={propertyImages}
                  onUploadComplete={(imgs) => {
                    setPropertyImages(imgs);
                    // Only add new images to selection, keep user's previous selection
                    setSelectedImages((prev) => {
                      const newUrls = imgs.map((img) => img.url);
                      // Keep selected images that still exist, add any new ones
                      const stillSelected = prev.filter((url) => newUrls.includes(url));
                      const added = newUrls.filter((url) => !stillSelected.includes(url));
                      return [...stillSelected, ...added];
                    });
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {propertyImages.map((img) => (
                    <div key={img.url} className="relative">
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
              <div>
                <Label>Spaces & Assets to include</Label>
                <div className="flex flex-col gap-1 mt-1">
                  {property.spaces.map((space: any) => (
                    <div key={space.space_id} style={{ marginBottom: 4 }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={!!sectionSelection.spaces[space.space_id]}
                          onChange={(e) => handleSpaceToggle(space.space_id, e.target.checked)}
                        />{" "}
                        {space.name}
                      </label>
                      <div className="ml-4 flex flex-col gap-1">
                        {(space.assets || []).map((asset: any) => (
                          <label key={asset.asset_id}>
                            <input
                              type="checkbox"
                              checked={!!sectionSelection.assets[asset.asset_id]}
                              onChange={(e) => handleAssetToggle(asset.asset_id, e.target.checked)}
                            />{" "}
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
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>Review Your Submission</h2>
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
          {sectionSelection.images && selectedImages.length > 0 && (
            <div className="pdf-section">
              <div className="pdf-section-title">Property Images</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {selectedImages.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt="Property"
                    style={{
                      width: 120,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "1px solid #ccc",
                      marginBottom: 6,
                    }}
                  />
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
      </div>
    </div>
  );
}