"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/card";
import { Button } from "@ui/button";
import { Label } from "@ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/select";
import { Checkbox } from "@ui/checkbox";
import { Badge } from "@ui/badge";
import { Progress } from "@ui/progress";
import { FileText, Download, BarChart3 } from "lucide-react";
import {
  //getPropertyDetails,
  getProperty,
  getUserIdByEmail,
  //getAdminProperty
} from "@backend/FetchData";
import { getPropertyImages } from "@backend/ImageUpload";
import { apiClient } from "@shared/api/wrappers";

// Reference to hold the html2pdf library once loaded dynamically
const html2pdfRef = { current: null as any };

// Helper function to wait for all images to load before generating PDF
// This prevents broken images in the final PDF output
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

interface ReportsProps {
  userId: string;
  userType: string;
}

export function Reports({ userId, userType }: ReportsProps) {
  // Dynamically load html2pdf.js library when component mounts
  // This avoids SSR issues since html2pdf requires browser environment
  useEffect(() => {
    if (typeof window === "undefined") return;
    (async () => {
      try {
        const mod = await import("html2pdf.js");
        html2pdfRef.current = (mod as any).default || (mod as any);
        console.log("[Reports] html2pdf loaded:", !!html2pdfRef.current);
      } catch (e) {
        console.error("[Reports] failed to load html2pdf.js", e);
      }
    })();
  }, []);

  // Report configuration state - stores user selections for PDF generation
  const [reportConfig, setReportConfig] = useState({
    propertyId: "",
    reportType: "",
    includeImages: false,
    includePlans: false,
    includeUtilities: false,
    includeFittings: false,
    dateFrom: "",
    dateTo: "",
  });

  // PDF generation state management
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reference to the hidden preview div that gets converted to PDF
  const previewRef = useRef<HTMLDivElement | null>(null);

  // Currently selected property data from backend
  const [property, setProperty] = useState<any>(null);

  // User's properties list for dropdown selection
  const [myProperties, setMyProperties] = useState<
    { id: string; name: string }[]
  >([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Property images state - supports both string URLs and {name, url} objects
  const [propertyImages, setPropertyImages] = useState<
    { name: string; url: string }[]
  >([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Section selection state - controls what appears in the final PDF
  // Implements hierarchical selection where spaces contain assets
  const [sectionSelection, setSectionSelection] = useState<{
    generalInfo: boolean;
    plans: boolean;
    images: boolean;
    spaces: { [spaceId: string]: boolean }; // Parent level - rooms/areas
    assets: { [assetId: string]: boolean }; // Child level - features within spaces
  }>({
    generalInfo: true,
    plans: true,
    images: true,
    spaces: {},
    assets: {},
  });

  // Fetch user's properties on component mount
  useEffect(() => {
  const fetchProperties = async () => {
    setLoadingProperties(true);
    try {
      const props = await apiClient.getAdminProperties(userId, userType);
      if (props && Array.isArray(props)) {
        // Get unique properties by propertyId
        const uniquePropsMap = new Map();
        props.forEach((p) => {
          if (!uniquePropsMap.has(p.propertyId)) {
            uniquePropsMap.set(p.propertyId, {
              id: p.propertyId,
              name: p.name,
            });
          }
        });
        
        setMyProperties(Array.from(uniquePropsMap.values()));
      } else {
        setMyProperties([]);
      }
    } catch (e) {
      console.error(e);
      setMyProperties([]);
    }
    setLoadingProperties(false);
  };
  fetchProperties();
}, [userId]);

  // Available report types for the dropdown
  const reportTypes = [
    { value: "overview", label: "Property Overview" },
    { value: "maintenance", label: "Maintenance History" },
  ];

  // Main PDF generation function
  // Converts the hidden preview div to PDF and downloads it
  const handleGenerateReport = async () => {
    setErrorMsg(null);
    console.log("[Reports] click -> handleGenerateReport");
    const html2pdf = html2pdfRef.current;

    // Validation checks
    if (!html2pdf) {
      setErrorMsg(
        "PDF generator is not ready yet. Please try again in a few seconds."
      );
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

      // Wait for all images to load to prevent broken images in PDF
      await waitForImages(previewRef.current);
      setReportProgress(70);

      const filename = `property_${reportConfig.propertyId}_${reportConfig.reportType}.pdf`;

      // Configure html2pdf with optimal settings for property reports
      await html2pdf()
        .set({
          margin: 0.5,
          filename,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: {
            scale: 2, // High resolution for crisp text
            useCORS: true, // Handle cross-origin images
            allowTaint: false, // Security setting
            logging: false, // Reduce console noise
          },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        })
        .from(previewRef.current)
        .save();

      setReportProgress(100);
      console.log("[Reports] PDF saved:", filename);
    } catch (err) {
      setErrorMsg("Failed to generate PDF. See console for details.");
      console.error("[Reports] Error generating report:", err);
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

  // Fetch detailed property data when property selection changes
  useEffect(() => {
    if (!reportConfig.propertyId) return;
    (async () => {
      const data = await apiClient.getPropertyDetails(reportConfig.propertyId);
      setProperty(data);
    })();
  }, [reportConfig.propertyId]);

  // Fetch property images when property changes
  // Supports both string array and object array formats from backend
  useEffect(() => {
    if (!reportConfig.propertyId) {
      setPropertyImages([]);
      setSelectedImages([]);
      return;
    }
    (async () => {
      const imgs = await getPropertyImages(reportConfig.propertyId);
      // Normalize to {name, url} format regardless of backend response
      let imgObjs: { name: string; url: string }[] = [];
      if (imgs.length > 0 && typeof imgs[0] === "string") {
        imgObjs = imgs.map(img => ({
          name: img.name,
          url: img.url,
        }));
      } else {
        imgObjs = imgs;
      }
      setPropertyImages(imgObjs);
      setSelectedImages(imgObjs.map((img) => img.url)); // Default: select all images

      // Sync initial selection to backend (placeholder for future implementation)
      syncSelectionToBackend(
        reportConfig.propertyId,
        imgObjs.map((img) => img.url),
        sectionSelection
      );
    })();
  }, [reportConfig.propertyId]);

  // Sync selection changes to backend whenever user modifies selections
  useEffect(() => {
    if (!reportConfig.propertyId) return;
    syncSelectionToBackend(
      reportConfig.propertyId,
      selectedImages,
      sectionSelection
    );
  }, [selectedImages, sectionSelection]);

  // Placeholder for backend synchronization
  // TODO: Replace with actual API call to save user preferences
  async function syncSelectionToBackend(
    propertyId: string,
    selectedImages: string[],
    selectedFeatures: { spaces: any; assets: any }
  ) {
    console.log("Syncing selection to backend", {
      propertyId,
      selectedImages,
      selectedFeatures,
    });
  }

  // Toggle individual image selection
  const handleImageSelect = (url: string) => {
    setSelectedImages((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  // Handle basic section toggles (General Info, Plans & Documents)
  const handleSectionToggle = (
    type: "generalInfo" | "plans",
    checked: boolean
  ) => {
    setSectionSelection((prev) => ({ ...prev, [type]: checked }));
  };

  // Handle space (room/area) selection with cascading logic
  // When unchecking a space, automatically uncheck all its child assets
  const handleSpaceToggle = (spaceId: string, checked: boolean) => {
    setSectionSelection((prev) => {
      const newSelection = {
        ...prev,
        spaces: { ...prev.spaces, [spaceId]: checked },
      };

      // Cascade: If unchecking a space, also uncheck all its assets
      if (!checked && property?.spaces) {
        const space = property.spaces.find((s: any) => s.space_id === spaceId);
        if (space?.assets) {
          const newAssets = { ...prev.assets };
          space.assets.forEach((asset: any) => {
            newAssets[asset.asset_id] = false;
          });
          newSelection.assets = newAssets;
        }
      }

      return newSelection;
    });
  };

  // Handle asset (feature) selection with intelligent parent-child relationships
  // Automatically manages parent space selection based on child asset states
  const handleAssetToggle = (assetId: string, checked: boolean) => {
    setSectionSelection((prev) => {
      const newAssets = { ...prev.assets, [assetId]: checked };
      const newSpaces = { ...prev.spaces };

      // Find which space this asset belongs to and manage parent relationship
      if (property?.spaces) {
        for (const space of property.spaces) {
          if (space.assets?.some((asset: any) => asset.asset_id === assetId)) {
            if (checked) {
              // Auto-select parent space when selecting any child asset
              newSpaces[space.space_id] = true;
            } else {
              // Only unselect parent space if no other child assets are selected
              const otherAssetsSelected = space.assets.some(
                (asset: any) =>
                  asset.asset_id !== assetId && newAssets[asset.asset_id]
              );
              if (!otherAssetsSelected) {
                newSpaces[space.space_id] = false;
              }
            }
            break;
          }
        }
      }

      return {
        ...prev,
        spaces: newSpaces,
        assets: newAssets,
      };
    });
  };

  // Bulk selection logic for images
  const allImagesSelected =
    propertyImages.length > 0 &&
    selectedImages.length === propertyImages.length;

  const handleSelectAllImages = (checked: boolean) => {
    setSelectedImages(checked ? propertyImages.map((img) => img.url) : []);
  };

  // Check if all spaces are currently selected
  const allSpacesSelected =
    property?.spaces &&
    Object.values(sectionSelection.spaces).filter(Boolean).length ===
      property.spaces.length;

  // Bulk select/deselect all spaces and their assets
  // Maintains parent-child relationships during bulk operations
  const handleSelectAllSpaces = (checked: boolean) => {
    if (!property?.spaces) return;
    const newSpaces: { [spaceId: string]: boolean } = {};
    const newAssets: { [assetId: string]: boolean } = {};

    property.spaces.forEach((space: any) => {
      newSpaces[space.space_id] = checked;
      // Also select/deselect all assets in each space
      (space.assets || []).forEach((asset: any) => {
        newAssets[asset.asset_id] = checked;
      });
    });

    setSectionSelection((prev) => ({
      ...prev,
      spaces: newSpaces,
      assets: newAssets,
    }));
  };

  // Check if all assets across all spaces are selected
  const allAssetsSelected =
    property?.spaces &&
    property.spaces
      .flatMap((space: any) => space.assets || [])
      .every((asset: any) => sectionSelection.assets[asset.asset_id]);

  // Bulk select/deselect all assets with intelligent space management
  // When selecting assets, auto-select their parent spaces
  const handleSelectAllAssets = (checked: boolean) => {
    if (!property?.spaces) return;
    const newAssets: { [assetId: string]: boolean } = {};
    const newSpaces: { [spaceId: string]: boolean } = {};

    property.spaces.forEach((space: any) => {
      let hasSelectedAsset = false;
      (space.assets || []).forEach((asset: any) => {
        newAssets[asset.asset_id] = checked;
        if (checked) hasSelectedAsset = true;
      });
      // Auto-select space if any of its assets are selected
      newSpaces[space.space_id] = hasSelectedAsset;
    });

    setSectionSelection((prev) => ({
      ...prev,
      spaces: newSpaces,
      assets: newAssets,
    }));
  };

  // *****************************************************************************************

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
              <Select
                onValueChange={(value: string) =>
                  setReportConfig({ ...reportConfig, propertyId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingProperties ? "Loading..." : "Choose your property"
                    }
                  />
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
              <Select
                onValueChange={(value: string) =>
                  setReportConfig({ ...reportConfig, reportType: value })
                }
              >
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
                <Checkbox
                  checked={sectionSelection.generalInfo}
                  onCheckedChange={(e: boolean) =>
                    handleSectionToggle("generalInfo", e)
                  }
                />{" "}
                General Information
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={sectionSelection.plans}
                  onCheckedChange={(e: boolean) =>
                    handleSectionToggle("plans", e)
                  }
                />{" "}
                Plans & Documents
              </label>
            </div>
          </div>

          {/* Property Images selection */}
          {propertyImages.length > 0 && (
            <div className="space-y-2">
              <Label className="block mb-1">Property Images</Label>
              <div className="flex items-center mb-2">
                <Checkbox
                  checked={allImagesSelected}
                  onCheckedChange={(e:boolean) => handleSelectAllImages(e)}
                  id="selectAllImages"
                />
                <Label
                  htmlFor="selectAllImages"
                  className="ml-2 text-sm cursor-pointer"
                >
                  Select All Images
                </Label>
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
                        boxShadow: selectedImages.includes(img.url)
                          ? "0 0 0 2px #0070f3"
                          : undefined,
                        transition: "box-shadow 0.2s",
                      }}
                      onClick={() => handleImageSelect(img.url)}
                      title={
                        selectedImages.includes(img.url) ? "Deselect" : "Select"
                      }
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
                {/* Button 1: Select All SPACES (rooms) 
                <input
                  type="checkbox"
                  checked={!!allSpacesSelected}
                  onChange={(e) => handleSelectAllSpaces(e.target.checked)}
                  id="selectAllSpaces"
                /> */}

                <Checkbox
                  checked={allSpacesSelected && allAssetsSelected}
                  onCheckedChange={(e : boolean) => {
                    handleSelectAllSpaces(e); // Select all rooms
                    handleSelectAllAssets(e); // Select all features
                  }}
                  id="selectEverything"
                />
                <Label htmlFor="selectEverything">Select Everything</Label>

                {/* <Label
                  htmlFor="selectAllSpaces"
                  className="text-sm cursor-pointer"
                >
                  Select All Spaces
                </Label> */}
                {/* Button 2: Select All Assets (features) 
                <input
                  type="checkbox"
                  checked={!!allAssetsSelected}
                  onChange={(e) => handleSelectAllAssets(e.target.checked)}
                  id="selectAllAssets"
                />
                <Label
                  htmlFor="selectAllAssets"
                  className="text-sm cursor-pointer"
                >
                  Select All Assets
                </Label> */}
              </div>
              <div className="flex flex-col gap-2 bg-muted/50 rounded-lg p-3">
                {property.spaces.map((space: any) => (
                  <div key={space.space_id} className="mb-1">
                    <label className="flex items-center gap-2 font-medium">
                      <Checkbox
                        checked={!!sectionSelection.spaces[space.space_id]}
                        onCheckedChange={(e: boolean) =>
                          handleSpaceToggle(space.space_id, e)
                        }
                      />
                      {space.name}
                    </label>
                    <div className="ml-6 flex flex-col gap-1">
                      {(space.assets || []).map((asset: any) => (
                        <label
                          key={asset.asset_id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={!!sectionSelection.assets[asset.asset_id]}
                            onCheckedChange={(e: boolean) =>
                              handleAssetToggle(
                                asset.asset_id,
                                e
                              )
                            }
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
            disabled={
              generatingReport ||
              !reportConfig.propertyId ||
              !reportConfig.reportType
            }
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
          className="pdf-preview"
          ref={previewRef}
          style={{
            width: 794,
            minHeight: 1123,
            background: "#f7f8fa",
            padding: 0,
            color: "#222",
            fontFamily:
              "'Segoe UI', 'Arial', 'Helvetica Neue', Arial, sans-serif",
            boxSizing: "border-box",
          }}
        >
          <style>
            {`
              /* CSS Custom Properties for consistent theming */
              :root, pdf-preview {
                --foreground: #242424 !important;
                --card-foreground: #242424 !important;
                --popover: #ffffff !important;
                --popover-foreground: #242424 !important;
                --primary-foreground: #ffffff !important;
                --secondary: #f0f1f2 !important;
              }

              /* Standard PDF section styling */
              .pdf-section {
                border: 1px solid #ccc;
                border-radius: 12px;
                padding: 18px 24px;
                margin-bottom: 18px;
                /* CRITICAL: Prevent sections from being split across PDF pages */
                page-break-inside: avoid;
                break-inside: avoid;
              }

              /* Special styling for space sections with enhanced page-break protection */
              .pdf-space-section {
                border: 1px solid #ccc;
                border-radius: 12px;
                padding: 18px 24px;
                margin-bottom: 18px;
                /* Prevent space content from being cut between pages */
                page-break-inside: avoid;
                break-inside: avoid;
                page-break-before: auto;  /* Allow natural page breaks before, but not inside */
              }

              /* Typography styles for PDF content */
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

              /* Ensure image galleries don't break across pages */
              .pdf-images-row {
                page-break-inside: avoid;
                break-inside: avoid;
              }

              /* Keep space content together as a cohesive unit */
              .pdf-space-content {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            `}
          </style>
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}
            >
              {/* REPORT */}
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

          {/* Dynamically render selected spaces and their assets */}
          {
            /* Each space is wrapped in pdf-space-section for page-break protection */
            property?.spaces?.map((space: any) =>
              sectionSelection.spaces[space.space_id] ? (
                <div className="pdf-space-section" key={space.space_id}>
                  <div className="pdf-space-content">
                    <div className="pdf-section-title">{space.name}</div>
                    {space.assets && space.assets.length > 0 ? (
                      // Only render assets that are specifically selected
                      space.assets
                        .filter(
                          (asset: any) =>
                            sectionSelection.assets[asset.asset_id]
                        )
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
                </div>
              ) : null
            )
          }
        </div>
        {/* PDF Footer */}
        {/* <div className="pdf-footer">
            Generated by HouseBook &mdash; {new Date().toLocaleDateString()}
          </div> */}
      </div>
    </div>
  );
}
