"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { FileText, Download, BarChart3 } from "lucide-react";
// Import QRCodeCanvas for generating QR codes in PDF reports
// This allows property QR codes to be included in reports for easy property identification
import { QRCodeCanvas } from "qrcode.react";

import {
  fetchJobsInfo,
  Job,
  JobAsset,
  fetchJobAssetsWithDetails,
  fetchJobAssets,
  upsertJobAssets,
} from "../../../backend/JobService";

import { apiClient } from "../api/wrappers";

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

interface MyReportsProps {
  ownerEmail: string;
}

export function MyReports({ ownerEmail }: MyReportsProps) {
  // Dynamically load html2pdf.js library when component mounts
  // This avoids SSR issues since html2pdf requires browser environment
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

  // Report configuration state - stores user selections for PDF generation
  const [reportConfig, setReportConfig] = useState({
    propertyId: "",
    reportType: "",
    jobId: "", // Add jobId for job-specific reports
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

  // Jobs for the selected property
  const [propertyJobs, setPropertyJobs] = useState<Job[]>([]);
  const [jobAssets, setJobAssets] = useState<JobAsset[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobAccessibleAssets, setJobAccessibleAssets] = useState<any[]>([]);

  // Property images state - supports both string URLs and {name, url} objects
  const [propertyImages, setPropertyImages] = useState<
    { name: string; url: string }[]
  >([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // QR code inclusion state - controls whether QR code appears in the report
  // Added to allow users to optionally include/exclude the property QR code in PDF reports
  // Default is true to include QR code by default for property identification
  const [includeQRCode, setIncludeQRCode] = useState<boolean>(true);

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
  // Gets userId from email, then fetches all properties owned by that user
  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      try {
        const { user_id, first_name, last_name, phone } =
          await apiClient.getUserInfoByEmail(ownerEmail);
        console.log("Fetched userId for email", ownerEmail, user_id);
        if (!user_id) {
          setMyProperties([]);
          setLoadingProperties(false);
          return;
        }
        const props = await apiClient.getPropertyList(user_id);
        if (props && Array.isArray(props)) {
          setMyProperties(
            props.map((p) => ({ id: p.propertyId, name: p.name }))
          );
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

  // Available report types for the dropdown - now includes job-based reports
  const reportTypes = [
    { value: "overview", label: "Property Overview" },
    // Add job-based report types
    ...propertyJobs.map((job) => ({
      value: `job-${job.id}`,
      label: `Job Access Report: ${job.title}`,
      jobId: job.id,
      pin: job.pin,
    })),
  ];

  // Main PDF generation function
  // Converts the hidden preview div to PDF and downloads it
  const handleGenerateReport = async () => {
    setErrorMsg(null);
    console.log("[MyReports] click -> handleGenerateReport");
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

    // For job-based reports, ensure we have job data
    if (reportConfig.reportType.startsWith("job-") && !selectedJob) {
      setErrorMsg(
        "Selected job data not available. Please try selecting the job again."
      );
      return;
    }

    try {
      setGeneratingReport(true);
      setReportProgress(10);

      // Wait for all images to load to prevent broken images in PDF
      await waitForImages(previewRef.current);
      setReportProgress(70);

      // Generate appropriate filename based on report type
      let filename: string;
      if (reportConfig.reportType.startsWith("job-") && selectedJob) {
        filename = `property_${
          reportConfig.propertyId
        }_job_${selectedJob.title.replace(/[^a-zA-Z0-9]/g, "_")}_pin_${
          selectedJob.pin
        }.pdf`;
      } else {
        filename = `property_${reportConfig.propertyId}_${reportConfig.reportType}.pdf`;
      }

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

  // Fetch detailed property data when property selection changes
  useEffect(() => {
    if (!reportConfig.propertyId) return;
    (async () => {
      const data = await apiClient.getPropertyDetails(reportConfig.propertyId);
      setProperty(data);
    })();
  }, [reportConfig.propertyId]);

  // Filter property data to show only accessible sections for job reports
  const displayProperty = useMemo(() => {
    if (!property) return null;

    // For non-job reports, show all property data
    if (!selectedJob || !reportConfig.reportType.startsWith("job-")) {
      return property;
    }

    console.log("Filtering property for job:", selectedJob.title);
    console.log("Job accessible assets:", jobAccessibleAssets);
    console.log("Original property spaces:", property.spaces);

    // For job reports, filter to show only accessible spaces and assets
    const accessibleSpaceIds = new Set();
    const accessibleAssetIds = new Set();

    jobAccessibleAssets.forEach((item: any) => {
      if (item.Assets?.id) {
        accessibleSpaceIds.add(item.Assets.id);
        accessibleAssetIds.add(item.id);
      }
    });

    console.log("Accessible space IDs:", Array.from(accessibleSpaceIds));
    console.log("Accessible asset IDs:", Array.from(accessibleAssetIds));

    const filteredSpaces =
      property.spaces
        ?.filter((space: any) => accessibleSpaceIds.has(space.id))
        .map((space: any) => ({
          ...space,
          assets:
            space.assets?.filter((asset: any) =>
              accessibleAssetIds.has(asset.id)
            ) || [],
        })) || [];

    console.log("Filtered spaces:", filteredSpaces);

    return {
      ...property,
      spaces: filteredSpaces,
    };
  }, [property, selectedJob, reportConfig.reportType, jobAccessibleAssets]);

  // Fetch jobs for the selected property
  useEffect(() => {
    if (!reportConfig.propertyId) {
      setPropertyJobs([]);
      setJobAssets([]);
      setSelectedJob(null);
      return;
    }

    const fetchJobs = async () => {
      setLoadingJobs(true);
      try {
        const [jobs, assets] = await fetchJobsInfo({
          property_id: reportConfig.propertyId,
        });
        setPropertyJobs(jobs);
        setJobAssets(assets);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setPropertyJobs([]);
        setJobAssets([]);
      }
      setLoadingJobs(false);
    };

    fetchJobs();
  }, [reportConfig.propertyId]);

  // Handle job selection and fetch accessible assets for the job
  useEffect(() => {
    if (
      !reportConfig.reportType ||
      !reportConfig.reportType.startsWith("job-")
    ) {
      setSelectedJob(null);
      setJobAccessibleAssets([]);

      // Reset section selection to show all spaces/assets for regular property reports
      if (
        property?.spaces &&
        reportConfig.reportType &&
        !reportConfig.reportType.startsWith("job-")
      ) {
        console.log("Resetting to full property view for non-job report");
        const allSpacesSelection: { [spaceId: string]: boolean } = {};
        const allAssetsSelection: { [assetId: string]: boolean } = {};

        property.spaces.forEach((space: any) => {
          allSpacesSelection[space.id] = true;
          (space.assets || []).forEach((asset: any) => {
            allAssetsSelection[asset.id] = true;
          });
        });

        setSectionSelection({
          generalInfo: true,
          plans: true,
          images: true,
          spaces: allSpacesSelection,
          assets: allAssetsSelection,
        });
      }
      return;
    }

    const jobId = reportConfig.reportType.replace("job-", "");
    const job = propertyJobs.find((j) => j.id === jobId);

    if (job) {
      setSelectedJob(job);

      // Fetch detailed asset information for this job
      const fetchJobAssetsForJob = async () => {
        try {
          console.log("Fetching assets for job ID:", jobId);

          // First, try to get basic job assets
          const basicJobAssets = await fetchJobAssets(jobId);
          console.log("Basic job assets:", basicJobAssets);

          // Then get detailed information
          let accessibleAssets: any[] = [];

          /*Recent update: Added separate try-catch for fetchJobAssetsWithDetails to ensure 
            fallback logic always executes when detailed fetch fails or throws error*/
          try {
            accessibleAssets = await fetchJobAssetsWithDetails(jobId);
            console.log("Fetched accessible assets:", accessibleAssets);
          } catch (detailError) {
            console.log(
              "Failed to fetch detailed assets, will use fallback matching:",
              detailError
            );
            accessibleAssets = []; // Ensure it's empty to trigger fallback
          }

          /*Recent update: Enhanced fallback logic to reliably match basic job assets with 
            property space/asset data when detailed fetch fails, ensuring job reports show accessible sections*/
          // If we have no detailed assets but have basic assets, use fallback matching
          if (accessibleAssets.length === 0 && basicJobAssets.length > 0) {
            console.log(
              "No detailed assets found, but basic assets exist. Using fallback matching."
            );

            // Fallback: get property details and match assets manually
            if (property) {
              const matchedAssets: any[] = [];
              basicJobAssets.forEach((jobAsset: any) => {
                property.spaces?.forEach((space: any) => {
                  space.assets?.forEach((asset: any) => {
                    if (asset.id === jobAsset.id) {
                      matchedAssets.push({
                        id: jobAsset.id,
                        job_id: jobAsset.job_id,
                        Assets: {
                          id: asset.id,
                          type: asset.type,
                          description: asset.description,
                          Spaces: {
                            id: space.id,
                            name: space.name,
                          },
                        },
                      });
                    }
                  });
                });
              });
              console.log("Manually matched assets:", matchedAssets);
              accessibleAssets = matchedAssets; // Use matched assets as accessible assets
            }
          }

          // Set the accessible assets for this job
          setJobAccessibleAssets(accessibleAssets);

          // Update section selection to ONLY show accessible assets for this job
          // This ensures tradees can only see sections they have access to
          const newSectionSelection = {
            generalInfo: true,
            plans: true,
            images: true,
            spaces: {} as { [spaceId: string]: boolean },
            assets: {} as { [assetId: string]: boolean },
          };

          // Pre-select ONLY the accessible spaces and assets for this job
          accessibleAssets.forEach((item: any) => {
            console.log("Pre-selecting accessible asset for job:", item);
            if (item.Assets && item.Assets.id) {
              newSectionSelection.spaces[item.Assets.id] = true;
              newSectionSelection.assets[item.id] = true;
            }
          });

          console.log(
            "Job-specific section selection (only accessible):",
            newSectionSelection
          );
          console.log(
            "Total accessible assets for this job:",
            accessibleAssets.length
          );
          setSectionSelection(newSectionSelection);
        } catch (error) {
          console.error("Error fetching job assets:", error);
          setJobAccessibleAssets([]);
        }
      };

      fetchJobAssetsForJob();
    }
  }, [reportConfig.reportType, propertyJobs, property]);

  // Fetch property images when property changes
  // Supports both string array and object array formats from backend
  useEffect(() => {
    if (!reportConfig.propertyId) {
      setPropertyImages([]);
      setSelectedImages([]);
      return;
    }
    (async () => {
      const imgs = await apiClient.getPropertyImages(reportConfig.propertyId);

      // imgs might be { images: [...] }
      const urls: string[] = Array.isArray(imgs) ? imgs : imgs.images || [];

      const imgObjs: { name: string; url: string }[] = urls.map((url, idx) => ({
        name: `Image ${idx + 1}`,
        url,
      }));

      setPropertyImages(imgObjs);
      setSelectedImages(imgObjs.map((img) => img.url));

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
    checked: boolean | "indeterminate"
  ) => {
    setSectionSelection((prev) => ({ ...prev, [type]: checked === true }));
  };

  // Handle space (room/area) selection with cascading logic
  // When unchecking a space, automatically uncheck all its child assets

  const handleSpaceToggle = (spaceId: string, checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setSectionSelection((prev) => {
      const newSelection = {
        ...prev,
        spaces: { ...prev.spaces, [spaceId]: isChecked },
        assets: { ...prev.assets }, // Start with existing assets
      };

      // Find the specific space being toggled
      if (displayProperty?.spaces) {
        const space = displayProperty.spaces.find(
          (s: any) => s.id === spaceId
        );
        
        if (space?.assets) {
          // Only update assets for THIS space
          space.assets.forEach((asset: any) => {
            newSelection.assets[asset.id] = isChecked;
          });
        }
      }

      return newSelection;
    });
  };

  // Handle asset (feature) selection with intelligent parent-child relationships
  // Automatically manages parent space selection based on child asset states
  const handleAssetToggle = (assetId: string, checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setSectionSelection((prev) => {
      const newAssets = { ...prev.assets, [assetId]: isChecked };
      const newSpaces = { ...prev.spaces };

      if (displayProperty?.spaces) {
        for (const space of displayProperty.spaces) {
          if (space.assets?.some((asset: any) => asset.id === assetId)) {
            if (isChecked) {
              newSpaces[space.id] = true;
            } else {
              const otherAssetsSelected = space.assets.some(
                (asset: any) =>
                  asset.id !== assetId && newAssets[asset.id]
              );
              if (!otherAssetsSelected) {
                newSpaces[space.id] = false;
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

  const handleSelectAllImages = (checked: boolean | "indeterminate") => {
    setSelectedImages(checked === true ? propertyImages.map((img) => img.url) : []);
  };

  // Check if all spaces are currently selected (using displayProperty for job filtering)
  const allSpacesSelected =
    displayProperty?.spaces &&
    displayProperty.spaces.length > 0 &&
    displayProperty.spaces.every((space: any) => 
      sectionSelection.spaces[space.id]
    );

  // Bulk select/deselect all spaces and their assets
  // Maintains parent-child relationships during bulk operations
  const handleSelectAllSpaces = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    if (!displayProperty?.spaces) return;
    const newSpaces: { [spaceId: string]: boolean } = {};
    const newAssets: { [assetId: string]: boolean } = {};

    displayProperty.spaces.forEach((space: any) => {
      newSpaces[space.id] = isChecked;
      (space.assets || []).forEach((asset: any) => {
        newAssets[asset.id] = isChecked;
      });
    });

    setSectionSelection((prev) => ({
      ...prev,
      spaces: newSpaces,
      assets: newAssets,
    }));
  };

  // Check if all assets across all spaces are selected (using displayProperty for job filtering)
  const allAssetsSelected =
    displayProperty?.spaces &&
    displayProperty.spaces.length > 0 &&
    displayProperty.spaces
      .flatMap((space: any) => space.assets || [])
      .every((asset: any) => sectionSelection.assets[asset.id]);

  // Bulk select/deselect all assets with intelligent space management
  // When selecting assets, auto-select their parent spaces
  const handleSelectAllAssets = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    if (!displayProperty?.spaces) return;
    const newAssets: { [assetId: string]: boolean } = {};
    const newSpaces: { [spaceId: string]: boolean } = {};

    displayProperty.spaces.forEach((space: any) => {
      let hasSelectedAsset = false;
      (space.assets || []).forEach((asset: any) => {
        newAssets[asset.id] = isChecked;
        if (isChecked) hasSelectedAsset = true;
      });
      newSpaces[space.id] = hasSelectedAsset;
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
                  onCheckedChange={(e) =>
                    handleSectionToggle("generalInfo", e as boolean)
                  }
                />{" "}
                General Information
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={sectionSelection.plans}
                  onCheckedChange={(e) =>
                    handleSectionToggle("plans", e as boolean)
                  }
                />{" "}
                Plans & Documents
              </label>
            </div>
          </div>

          {/* QR Code inclusion checkbox */}
          {/* Added QR code option to allow users to choose whether to include property QR code in reports */}
          {/* This provides flexibility for different report use cases - some may want QR codes, others may not */}
          <div className="space-y-2">
            <Label className="block mb-1">Additional Options</Label>
            <div className="flex flex-col gap-2 bg-muted/50 rounded-lg p-3">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={includeQRCode}
                  onCheckedChange={(checked: boolean) =>
                    setIncludeQRCode(checked)
                  }
                />
                Include QR Code for Property
              </label>
            </div>
          </div>

          {/* Property Images selection */}
          {propertyImages.length > 0 && (
            <div className="space-y-2">
              <Label className="block mb-1">Property Images</Label>
              <div className="flex items-center mb-2 gap-2">
                <Checkbox
                  checked={allImagesSelected}
                  onCheckedChange={(e: boolean) => handleSelectAllImages(e)}
                  id="selectAllImages"
                />
                <Label
                  htmlFor="selectAllImages"
                  className="ml-2 text-sm cursor-pointer font-medium"
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
          {displayProperty?.spaces && (
            <div className="space-y-2">
              <Label className="block mb-1">
                {selectedJob && reportConfig.reportType.startsWith("job-")
                  ? `Job Access: ${selectedJob.title} (PIN: ${selectedJob.pin})`
                  : "Spaces & Assets to include"}
              </Label>

              {/* Show job info for job reports */}
              {selectedJob && reportConfig.reportType.startsWith("job-") && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="text-sm text-blue-800">
                    <div>
                      <strong>Job:</strong> {selectedJob.title}
                    </div>
                    <div>
                      <strong>PIN:</strong> {selectedJob.pin}
                    </div>
                    <div>
                      <strong>Status:</strong> {selectedJob.status}
                    </div>
                    <div>
                      <strong>Accessible Sections:</strong>{" "}
                      {jobAccessibleAssets.length} asset(s)
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mb-2">
                <Checkbox
                  checked={
                    allSpacesSelected && allAssetsSelected 
                      ? true 
                      : (Object.values(sectionSelection.spaces).some(Boolean) || 
                        Object.values(sectionSelection.assets).some(Boolean))
                      ? "indeterminate"
                      : false
                  }
                  onCheckedChange={(checked) => {
                    handleSelectAllSpaces(checked as boolean);
                    handleSelectAllAssets(checked as boolean);
                  }}
                  id="selectEverything"
                />
                <Label htmlFor="selectEverything">
                  {selectedJob && reportConfig.reportType.startsWith("job-")
                    ? "Select All Accessible Sections"
                    : "Select Everything"}
                </Label>
              </div>
              <div className="flex flex-col gap-2 bg-muted/50 rounded-lg p-3">
                {displayProperty.spaces.map((space: any) => (
                  <div key={space.id} className="mb-1">
                    <label className="flex items-center gap-2 font-medium">
                      <Checkbox
                        checked={!!sectionSelection.spaces[space.id]}
                        onCheckedChange={(e: boolean) =>
                          handleSpaceToggle(space.id, e)
                        }
                      />
                      {space.name}
                      {selectedJob &&
                        reportConfig.reportType.startsWith("job-") && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Accessible
                          </Badge>
                        )}
                    </label>
                    <div className="ml-6 flex flex-col gap-1">
                      {(space.assets || []).map((asset: any) => (
                        <label
                          key={asset.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={!!sectionSelection.assets[asset.id]}
                            onCheckedChange={(e: boolean) =>
                              handleAssetToggle(asset.id, e)
                            }
                          />
                          {asset.type}
                          {selectedJob &&
                            reportConfig.reportType.startsWith("job-") && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Access Granted
                              </Badge>
                            )}
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
            background: "#ffffff",
            padding: "30px 35px", // Reduced padding to give more content space
            color: "#222",
            fontFamily:
              "'Segoe UI', 'Arial', 'Helvetica Neue', Arial, sans-serif",
            boxSizing: "border-box",
            // Ensure content fits within page boundaries with strict width control
            maxWidth: "794px",
            overflow: "hidden",
          }}
        >
          {/* Add inner container to control content width more strictly */}
          <div
            style={{
              width: "100%",
              maxWidth: "724px", // 794px - (35px * 2) = 724px available width
              margin: "0 auto", // Center the content
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

              /* Standard PDF section styling - improved containment and professional appearance */
              .pdf-section {
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 16px;  /* Reduced padding for better fit */
                margin-bottom: 16px;
                background: #ffffff;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                /* CRITICAL: Prevent sections from being split across PDF pages */
                page-break-inside: avoid;
                break-inside: avoid;
                /* Ensure content stays within boundaries */
                box-sizing: border-box;
                width: 100%;
                max-width: 100%;
                overflow: hidden;
              }

              /* Special styling for space sections with enhanced page-break protection and containment */
              .pdf-space-section {
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 16px;  /* Reduced padding for better fit */
                margin-bottom: 16px;
                background: #ffffff;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                /* Prevent space content from being cut between pages */
                page-break-inside: avoid;
                break-inside: avoid;
                page-break-before: auto;  /* Allow natural page breaks before, but not inside */
                /* Ensure content stays within boundaries */
                box-sizing: border-box;
                width: 100%;
                max-width: 100%;
                overflow: hidden;
              }

              /* Typography styles for PDF content - improved hierarchy and readability */
              .pdf-section-title {
                font-size: 1.2rem;
                font-weight: 600;
                margin-bottom: 12px;
                color: #1f2937;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 8px;
              }
              .pdf-label {
                font-weight: 600;
                margin-right: 8px;
                color: #374151;
              }
              .pdf-sub {
                color: #4b5563;
                font-size: 0.95rem;
                margin-bottom: 6px;
                line-height: 1.4;
              }
              .pdf-divider {
                border-bottom: 2px solid #e5e7eb;
                margin: 20px 0;
              }

              /* Ensure image galleries don't break across pages and fit properly */
              .pdf-images-row {
                page-break-inside: avoid;
                break-inside: avoid;
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                justify-content: center;
                max-width: 100%;
              }

              /* Image container styling for better presentation */
              .pdf-image-container {
                max-width: 200px;
                max-height: 150px;
                overflow: hidden;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }

              .pdf-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }

              /* Keep space content together as a cohesive unit */
              .pdf-space-content {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            `}
            </style>

            {/* Professional Report Header */}
            <div
              style={{
                marginBottom: 32,
                textAlign: "center",
                borderBottom: "3px solid #3b82f6",
                paddingBottom: 20,
              }}
            >
              <h1
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  marginBottom: 8,
                  color: "#1f2937",
                }}
              >
                Property Report
              </h1>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  fontStyle: "italic",
                }}
              >
                Generated on{" "}
                {new Date().toLocaleDateString("en-AU", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>

            {/* General Information */}
            {sectionSelection.generalInfo && (
              <div className="pdf-section">
                <div className="pdf-section-title">General Information</div>
                <div className="pdf-sub">
                  <span className="pdf-label">Property Name:</span>
                  {displayProperty?.name || property?.name || ""}
                </div>
                <div className="pdf-sub">
                  <span className="pdf-label">Description:</span>
                  {displayProperty?.description || property?.description || ""}
                </div>
                <div className="pdf-sub">
                  <span className="pdf-label">Address:</span>
                  {displayProperty?.address || property?.address || ""}
                </div>
                {/* Add job info for job reports */}
                {selectedJob && reportConfig.reportType.startsWith("job-") && (
                  <>
                    <div className="pdf-sub">
                      <span className="pdf-label">Job Title:</span>
                      {selectedJob.title}
                    </div>
                    <div className="pdf-sub">
                      <span className="pdf-label">Job PIN:</span>
                      {selectedJob.pin}
                    </div>
                    <div className="pdf-sub">
                      <span className="pdf-label">Job Status:</span>
                      {selectedJob.status}
                    </div>
                    <div className="pdf-sub">
                      <span className="pdf-label">Accessible Sections:</span>
                      {jobAccessibleAssets.length} asset(s)
                    </div>
                  </>
                )}
              </div>
            )}

            {/* QR Code Section */}
            {/* Conditionally render QR code section based on user's checkbox selection */}
            {/* Only shows if includeQRCode is true AND we have a valid propertyId */}
            {/* QR code contains the propertyId for easy property identification and access */}
            {includeQRCode && reportConfig.propertyId && (
              <div className="pdf-section">
                <div className="pdf-section-title">Property QR Code</div>

                {/* Professional QR code container - optimized for strict PDF width constraints */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "12px 4px", // Minimal padding to maximize available space
                    margin: "12px 0",
                    boxSizing: "border-box",
                    width: "100%",
                    maxWidth: "100%",
                  }}
                >
                  {/* QR code wrapper - minimal size to ensure page fit */}
                  <div
                    style={{
                      padding: "12px", // Reduced padding
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px", // Smaller radius
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)", // Subtle shadow
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      maxWidth: "160px", // Smaller max width to ensure fit
                      margin: "0 auto", // Center the container
                    }}
                  >
                    {/* Enhanced QR code - conservative size for guaranteed page fit */}
                    <QRCodeCanvas
                      value={reportConfig.propertyId} // QR code contains the property ID
                      size={100} // Reduced to 100px for guaranteed fit
                      level="H" // High error correction for better scanning
                      bgColor="#ffffff" // Explicit white background for PDF printing
                      fgColor="#000000" // Explicit black for maximum contrast
                    />
                  </div>

                  {/* Property ID reference - compact styling */}
                  <div
                    style={{
                      marginTop: "10px",
                      textAlign: "center",
                      fontSize: "0.8rem", // Smaller font
                      color: "#374151",
                      fontWeight: "500",
                      wordBreak: "break-all",
                      maxWidth: "100%",
                      padding: "0 8px", // Small padding to prevent edge touch
                    }}
                  >
                    Property ID: {reportConfig.propertyId}
                  </div>

                  {/* Improved instruction text - compact styling */}
                  <div
                    style={{
                      marginTop: "6px",
                      textAlign: "center",
                      fontSize: "0.75rem", // Smaller font
                      color: "#6b7280",
                      fontStyle: "italic",
                      maxWidth: "250px", // Smaller max width
                      lineHeight: "1.2",
                      wordWrap: "break-word",
                      padding: "0 8px", // Small padding to prevent edge touch
                    }}
                  >
                    Scan this QR code with your mobile device to quickly access
                    property information
                  </div>
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
              displayProperty?.spaces?.map((space: any) =>
                sectionSelection.spaces[space.id] ? (
                  <div className="pdf-space-section" key={space.id}>
                    <div className="pdf-space-content">
                      <div className="pdf-section-title">{space.name}</div>
                      {selectedJob &&
                        reportConfig.reportType.startsWith("job-") && (
                          <div
                            className="pdf-sub"
                            style={{
                              fontSize: "0.9rem",
                              color: "#666",
                              marginBottom: "8px",
                            }}
                          >
                            <em>✓ Accessible via Job PIN: {selectedJob.pin}</em>
                          </div>
                        )}
                      {space.assets && space.assets.length > 0 ? (
                        // Only render assets that are specifically selected
                        space.assets
                          .filter(
                            (asset: any) =>
                              sectionSelection.assets[asset.id]
                          )
                          .map((asset: any) => (
                            <div className="pdf-sub" key={asset.id}>
                              <span className="pdf-label">{asset.type}:</span>
                              {asset.description || "No description available"}
                              {selectedJob &&
                                reportConfig.reportType.startsWith("job-") && (
                                  <span
                                    style={{
                                      fontSize: "0.8rem",
                                      color: "#666",
                                      marginLeft: "8px",
                                    }}
                                  >
                                    [Access Granted]
                                  </span>
                                )}
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
          </div>{" "}
          {/* Close inner content container */}
        </div>
        {/* PDF Footer */}
        {/* <div className="pdf-footer">
            Generated by HouseBook &mdash; {new Date().toLocaleDateString()}
          </div> */}
      </div>
    </div>
  );
}
