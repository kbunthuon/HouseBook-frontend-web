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
import {
  getPropertyDetails,
  getProperty,
  getUserIdByEmail,
  getPropertyImages,
} from "../../../backend/FetchData";
import {
  fetchJobsInfo,
  Job,
  JobAsset,
  fetchJobAssetsWithDetails,
  fetchJobAssets,
  upsertJobAssets,
} from "../../../backend/JobService";

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
        const userId = await getUserIdByEmail(ownerEmail);
        if (!userId) {
          setMyProperties([]);
          setLoadingProperties(false);
          return;
        }
        const props = await getProperty(userId);
        if (props && Array.isArray(props)) {
          setMyProperties(
            props.map((p) => ({ id: p.property_id, name: p.name }))
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
    { value: "maintenance", label: "Maintenance History" },
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
      const data = await getPropertyDetails(reportConfig.propertyId);
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
      if (item.Assets?.space_id) {
        accessibleSpaceIds.add(item.Assets.space_id);
        accessibleAssetIds.add(item.asset_id);
      }
    });

    console.log("Accessible space IDs:", Array.from(accessibleSpaceIds));
    console.log("Accessible asset IDs:", Array.from(accessibleAssetIds));

    const filteredSpaces =
      property.spaces
        ?.filter((space: any) => accessibleSpaceIds.has(space.space_id))
        .map((space: any) => ({
          ...space,
          assets:
            space.assets?.filter((asset: any) =>
              accessibleAssetIds.has(asset.asset_id)
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
          const accessibleAssets = await fetchJobAssetsWithDetails(jobId);
          console.log("Fetched accessible assets:", accessibleAssets);
          setJobAccessibleAssets(accessibleAssets);

          // If we have no detailed assets but have basic assets, we need to handle this
          if (accessibleAssets.length === 0 && basicJobAssets.length > 0) {
            console.log(
              "No detailed assets found, but basic assets exist. Need to fetch property details and match manually."
            );

            // Fallback: get property details and match assets manually
            if (property) {
              const matchedAssets: any[] = [];
              basicJobAssets.forEach((jobAsset: any) => {
                property.spaces?.forEach((space: any) => {
                  space.assets?.forEach((asset: any) => {
                    if (asset.asset_id === jobAsset.asset_id) {
                      matchedAssets.push({
                        asset_id: jobAsset.asset_id,
                        job_id: jobAsset.job_id,
                        Assets: {
                          asset_id: asset.asset_id,
                          type: asset.type,
                          description: asset.description,
                          space_id: space.space_id,
                          Spaces: {
                            space_id: space.space_id,
                            name: space.name,
                          },
                        },
                      });
                    }
                  });
                });
              });
              console.log("Manually matched assets:", matchedAssets);
              setJobAccessibleAssets(matchedAssets);
            }
          }

          // Update section selection to only show accessible assets
          const assetsToUse =
            accessibleAssets.length > 0 ? accessibleAssets : [];
          const newSectionSelection = {
            generalInfo: true,
            plans: true,
            images: true,
            spaces: {} as { [spaceId: string]: boolean },
            assets: {} as { [assetId: string]: boolean },
          };

          // Mark accessible assets and their spaces as selected
          assetsToUse.forEach((item: any) => {
            console.log("Processing accessible asset:", item);
            if (item.Assets && item.Assets.space_id) {
              newSectionSelection.spaces[item.Assets.space_id] = true;
              newSectionSelection.assets[item.asset_id] = true;
            }
          });

          console.log("New section selection:", newSectionSelection);
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
      const imgs = await getPropertyImages(reportConfig.propertyId);
      // Convert string array to {name, url} format
      const imgObjs: { name: string; url: string }[] = (imgs as string[]).map(
        (url: string, idx: number) => ({
          name: `Image ${idx + 1}`,
          url,
        })
      );
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
      if (!checked && displayProperty?.spaces) {
        const space = displayProperty.spaces.find(
          (s: any) => s.space_id === spaceId
        );
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
      if (displayProperty?.spaces) {
        for (const space of displayProperty.spaces) {
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
    displayProperty?.spaces &&
    Object.values(sectionSelection.spaces).filter(Boolean).length ===
      displayProperty.spaces.length;

  // Bulk select/deselect all spaces and their assets
  // Maintains parent-child relationships during bulk operations
  const handleSelectAllSpaces = (checked: boolean) => {
    if (!displayProperty?.spaces) return;
    const newSpaces: { [spaceId: string]: boolean } = {};
    const newAssets: { [assetId: string]: boolean } = {};

    displayProperty.spaces.forEach((space: any) => {
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
    displayProperty?.spaces &&
    displayProperty.spaces
      .flatMap((space: any) => space.assets || [])
      .every((asset: any) => sectionSelection.assets[asset.asset_id]);

  // Bulk select/deselect all assets with intelligent space management
  // When selecting assets, auto-select their parent spaces
  const handleSelectAllAssets = (checked: boolean) => {
    if (!displayProperty?.spaces) return;
    const newAssets: { [assetId: string]: boolean } = {};
    const newSpaces: { [spaceId: string]: boolean } = {};

    displayProperty.spaces.forEach((space: any) => {
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

  // Temporary function to fix job assets for Testing1
  const fixJobAssets = async (jobId: string) => {
    if (!property) {
      console.error("No property data available");
      alert("No property data available");
      return;
    }

    try {
      console.log("🔧 Starting fixJobAssets for jobId:", jobId);
      console.log("📊 Property data:", property);

      // Dynamically find the asset IDs for the expected assets based on the debug info
      const expectedAssets: string[] = [];

      if (property.spaces) {
        property.spaces.forEach((space: any) => {
          console.log(
            `🏠 Checking space: ${space.name} (ID: ${space.space_id})`
          );

          if (space.assets) {
            space.assets.forEach((asset: any) => {
              console.log(`  🔍 Asset: ${asset.type} (ID: ${asset.asset_id})`);

              // Kitchen Appliances - Based on debug info showing these should be accessible
              if (
                ["Oven", "Cooktop", "Rangehood", "Dishwasher"].includes(
                  asset.type
                )
              ) {
                console.log(
                  `    ✅ Adding Kitchen Appliance: ${asset.type} (${asset.asset_id})`
                );
                expectedAssets.push(String(asset.asset_id));
              }

              // Bathroom Fixtures - Based on debug info showing these should be accessible
              if (
                ["Shower Screens", "Bathtub", "Shower", "Bath"].includes(
                  asset.type
                )
              ) {
                console.log(
                  `    ✅ Adding Bathroom Fixture: ${asset.type} (${asset.asset_id})`
                );
                expectedAssets.push(String(asset.asset_id));
              }

              // Exterior Specifications - Based on debug info showing these should be accessible
              if (
                [
                  "Walls",
                  "Render",
                  "Driveway",
                  "Wall",
                  "External Wall",
                ].includes(asset.type)
              ) {
                console.log(
                  `    ✅ Adding Exterior Spec: ${asset.type} (${asset.asset_id})`
                );
                expectedAssets.push(String(asset.asset_id));
              }
            });
          }
        });
      }

      console.log("🎯 Found expected asset IDs:", expectedAssets);

      if (expectedAssets.length === 0) {
        console.error("❌ No matching assets found in property data");
        alert(
          "❌ No matching assets found. Check that the property has Kitchen Appliances, Bathroom Fixtures, and Exterior Specifications."
        );
        return;
      }

      console.log(
        `📞 Calling upsertJobAssets with jobId: ${jobId} and ${expectedAssets.length} assets`
      );
      const result = await upsertJobAssets(jobId, expectedAssets);
      console.log("✅ UpsertJobAssets result:", result);

      alert(
        `✅ Successfully assigned ${expectedAssets.length} assets to job! The page will reload to show the changes.`
      );

      // Refresh the page to see the changes
      window.location.reload();
    } catch (error) {
      console.error("❌ Error fixing job assets:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(`❌ Error fixing job assets: ${errorMessage}`);
    }
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

          {/* Job Information Display - Show when job report is selected */}
          {selectedJob && reportConfig.reportType.startsWith("job-") && (
            <div className="space-y-2 border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <Label className="block mb-2 text-lg font-semibold text-blue-900">
                Job Access Report Information
              </Label>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Job Title:</span>
                  <span className="text-gray-700">{selectedJob.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Job PIN:</span>
                  <Badge variant="outline" className="font-mono text-lg">
                    {selectedJob.pin}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Job Status:</span>
                  <Badge
                    variant={
                      selectedJob.status === "ACCEPTED"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedJob.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Accessible Assets:</span>
                  <span className="text-gray-700 font-semibold">
                    {jobAccessibleAssets.length} asset(s)
                  </span>
                </div>
                {selectedJob.end_time && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Access Expires:</span>
                    <span className="text-gray-700">
                      {new Date(selectedJob.end_time).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* List of Accessible Sections in UI */}
              {jobAccessibleAssets.length > 0 && (
                <div className="mt-4">
                  <Label className="block mb-2 font-semibold text-blue-900">
                    Accessible Sections & Assets:
                  </Label>
                  <div className="bg-white rounded-lg p-3 border border-blue-200 max-h-60 overflow-y-auto">
                    {/* Group assets by space */}
                    {Object.entries(
                      jobAccessibleAssets.reduce((acc: any, item: any) => {
                        const spaceName =
                          item.Assets?.Spaces?.name || "Unknown Space";
                        const spaceId = item.Assets?.space_id || "unknown";
                        if (!acc[spaceId]) {
                          acc[spaceId] = {
                            name: spaceName,
                            assets: [],
                          };
                        }
                        acc[spaceId].assets.push({
                          type: item.Assets?.type || "Unknown Asset",
                          description: item.Assets?.description || "",
                        });
                        return acc;
                      }, {})
                    ).map(([spaceId, spaceData]: [string, any]) => (
                      <div key={spaceId} className="mb-3 last:mb-0">
                        <div className="font-semibold text-blue-800 mb-1 flex items-center">
                          <span className="mr-1">📍</span>
                          {spaceData.name}
                        </div>
                        <ul className="ml-6 space-y-1">
                          {spaceData.assets.map((asset: any, idx: number) => (
                            <li
                              key={idx}
                              className="text-sm text-gray-700 list-disc"
                            >
                              <span className="font-medium">{asset.type}</span>
                              {asset.description && (
                                <span className="text-gray-600">
                                  {" "}
                                  - {asset.description}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> This report will only include sections
                  and assets accessible via PIN{" "}
                  <span className="font-mono font-bold">{selectedJob.pin}</span>
                </p>
              </div>

              {/* Debug Information */}
              <div className="mt-3 p-2 bg-yellow-100 rounded border border-yellow-300">
                <p className="text-sm text-yellow-900">
                  <strong>Debug:</strong> Found {jobAccessibleAssets.length}{" "}
                  accessible assets
                </p>
                <p className="text-xs text-yellow-800 mt-1">
                  Job ID: {selectedJob.id} | Expected: Kitchen, Bathroom,
                  Exterior assets
                </p>
                {jobAccessibleAssets.length > 0 ? (
                  <pre className="text-xs mt-1 overflow-auto max-h-32 bg-white p-1 rounded">
                    {JSON.stringify(jobAccessibleAssets, null, 2)}
                  </pre>
                ) : (
                  <div className="text-xs mt-1 p-1 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-700">
                      ❌ No assets found in JobAssets table for job "
                      {selectedJob.title}"
                    </p>
                    <p className="text-red-600 mt-1">
                      This means the job wasn't properly configured with asset
                      access. You need to edit the job and assign the assets:
                    </p>
                    <ul className="text-red-600 mt-1 ml-4 list-disc text-xs">
                      <li>
                        Kitchen Appliances (Oven, Cooktop, Rangehood,
                        Dishwasher)
                      </li>
                      <li>Bathroom Fixtures (Shower Screens)</li>
                      <li>Exterior Specifications (Walls, Render, Driveway)</li>
                    </ul>
                    <Button
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() => fixJobAssets(selectedJob.id!)}
                    >
                      🔧 Fix Job Assets (Temporary)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

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
                  onCheckedChange={(e: boolean) => handleSelectAllImages(e)}
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
          {displayProperty?.spaces && (
            <div className="space-y-2">
              <Label className="block mb-1">
                Spaces & Assets to include
                {selectedJob && reportConfig.reportType.startsWith("job-") && (
                  <span className="ml-2 text-sm text-blue-600 font-normal">
                    (Only assets accessible via PIN {selectedJob.pin})
                  </span>
                )}
              </Label>
              {!selectedJob && (
                <div className="flex items-center gap-4 mb-2">
                  <Checkbox
                    checked={allSpacesSelected && allAssetsSelected}
                    onCheckedChange={(e: boolean) => {
                      handleSelectAllSpaces(e); // Select all rooms
                      handleSelectAllAssets(e); // Select all features
                    }}
                    id="selectEverything"
                  />
                  <Label htmlFor="selectEverything">Select Everything</Label>
                </div>
              )}
              <div className="flex flex-col gap-2 bg-muted/50 rounded-lg p-3">
                {displayProperty.spaces.map((space: any) => {
                  const isJobReport =
                    selectedJob && reportConfig.reportType.startsWith("job-");

                  return (
                    <div key={space.space_id} className="mb-1">
                      <label className="flex items-center gap-2 font-medium">
                        <Checkbox
                          checked={!!sectionSelection.spaces[space.space_id]}
                          onCheckedChange={(e: boolean) =>
                            handleSpaceToggle(space.space_id, e)
                          }
                          disabled={isJobReport}
                        />
                        {space.name}
                        {isJobReport && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {space.assets?.length || 0} accessible
                          </Badge>
                        )}
                      </label>
                      <div className="ml-6 flex flex-col gap-1">
                        {(space.assets || []).map((asset: any) => {
                          return (
                            <label
                              key={asset.asset_id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Checkbox
                                checked={
                                  !!sectionSelection.assets[asset.asset_id]
                                }
                                onCheckedChange={(e: boolean) =>
                                  handleAssetToggle(asset.asset_id, e)
                                }
                                disabled={isJobReport}
                              />
                              {asset.type}
                              {isJobReport && (
                                <Badge
                                  variant="secondary"
                                  className="ml-1 text-xs"
                                >
                                  ✓ Accessible
                                </Badge>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
                {displayProperty?.name || ""}
              </div>
              <div className="pdf-sub">
                <span className="pdf-label">Description:</span>
                {displayProperty?.description || ""}
              </div>
              <div className="pdf-sub">
                <span className="pdf-label">Address:</span>
                {displayProperty?.address || ""}
              </div>
            </div>
          )}

          {/* Job Access Information - Only for job reports */}
          {selectedJob && reportConfig.reportType.startsWith("job-") && (
            <div
              className="pdf-section"
              style={{
                border: "2px solid #3b82f6",
                backgroundColor: "#eff6ff",
              }}
            >
              <div className="pdf-section-title" style={{ color: "#1e40af" }}>
                Job Access Report
              </div>
              <div className="pdf-sub">
                <span className="pdf-label">Job Title:</span>
                {selectedJob.title}
              </div>
              <div className="pdf-sub">
                <span className="pdf-label">Access PIN:</span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "1.2em",
                    fontWeight: "bold",
                    backgroundColor: "#fff",
                    padding: "2px 8px",
                    border: "1px solid #3b82f6",
                    borderRadius: "4px",
                  }}
                >
                  {selectedJob.pin}
                </span>
              </div>
              <div className="pdf-sub">
                <span className="pdf-label">Job Status:</span>
                {selectedJob.status}
              </div>
              <div className="pdf-sub">
                <span className="pdf-label">Total Accessible Assets:</span>
                {jobAccessibleAssets.length} asset(s)
              </div>
              {selectedJob.created_at && (
                <div className="pdf-sub">
                  <span className="pdf-label">Created:</span>
                  {new Date(selectedJob.created_at).toLocaleDateString()}
                </div>
              )}
              {selectedJob.end_time && (
                <div className="pdf-sub">
                  <span className="pdf-label">Access Expires:</span>
                  {new Date(selectedJob.end_time).toLocaleString()}
                </div>
              )}

              {/* List of Accessible Sections */}
              {jobAccessibleAssets.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "8px",
                      fontSize: "1rem",
                      color: "#1e40af",
                    }}
                  >
                    Accessible Sections & Assets:
                  </div>
                  <div
                    style={{
                      backgroundColor: "#fff",
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid #93c5fd",
                    }}
                  >
                    {/* Group assets by space */}
                    {Object.entries(
                      jobAccessibleAssets.reduce((acc: any, item: any) => {
                        const spaceName =
                          item.Assets?.Spaces?.name || "Unknown Space";
                        const spaceId = item.Assets?.space_id || "unknown";
                        if (!acc[spaceId]) {
                          acc[spaceId] = {
                            name: spaceName,
                            assets: [],
                          };
                        }
                        acc[spaceId].assets.push({
                          type: item.Assets?.type || "Unknown Asset",
                          description: item.Assets?.description || "",
                        });
                        return acc;
                      }, {})
                    ).map(([spaceId, spaceData]: [string, any]) => (
                      <div key={spaceId} style={{ marginBottom: "12px" }}>
                        <div
                          style={{
                            fontWeight: "600",
                            color: "#1e40af",
                            marginBottom: "4px",
                            fontSize: "0.95rem",
                          }}
                        >
                          📍 {spaceData.name}
                        </div>
                        <ul
                          style={{
                            margin: "0",
                            paddingLeft: "24px",
                            listStyleType: "disc",
                          }}
                        >
                          {spaceData.assets.map((asset: any, idx: number) => (
                            <li
                              key={idx}
                              style={{
                                marginBottom: "2px",
                                fontSize: "0.9rem",
                                color: "#374151",
                              }}
                            >
                              <strong>{asset.type}</strong>
                              {asset.description && ` - ${asset.description}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: "12px",
                  padding: "8px",
                  backgroundColor: "#dbeafe",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              >
                <strong>Note:</strong> This report shows only the sections and
                assets accessible via PIN {selectedJob.pin}. The tradie assigned
                to this job can only access the areas and features listed in
                this document.
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
