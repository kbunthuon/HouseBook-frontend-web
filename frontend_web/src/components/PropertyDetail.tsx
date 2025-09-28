import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { ArrowLeft, Edit, Key, FileText, Image, Clock, History } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { PinManagementDialog } from "./PinManagementDialog";
import { PinTable } from "./PinTable";
import { toast } from "sonner";
import { getPropertyOwners, getPropertyDetails } from "../../../backend/FetchData";
import { Property, Owner } from "../types/serverTypes";
import { fetchJobsInfo, Job, JobAsset, JobStatus, deleteJob } from "../../../backend/JobService";

interface EditHistoryItem {
  id: number;
  date: string;
  section: string;
  field?: string;
  description: string;
  editedBy: string;
}

interface PropertyDetailProps {
  propertyId: string;
  onBack: () => void;
}

export function PropertyDetail({ propertyId, onBack }: PropertyDetailProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isTimelineDialogOpen, setIsTimelineDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<string>("");
  const [editingField, setEditingField] = useState<string>("");
  const [selectedSectionForTimeline, setSelectedSectionForTimeline] = useState<string>("");
  const [editDescription, setEditDescription] = useState("");

  // Editable fields per section
  const sectionFields = {
    "General Details": ["bedrooms","bathrooms","livingAreas","garage","totalFloorArea","blockSize"],
    "Walls & Ceilings": ["paintColour","ceilingHeight","cornices"],
    "Exterior Specifications": ["roof","wallsBrick","renderFeature","windows","fasciaGutters","frontDoor","driveway","fencing"],
    "Flooring": ["livingAreas","bedrooms","wetAreas"],
    "Cabinetry & Bench Tops": ["kitchenCabinets","kitchenBenchtop","bathroomVanities","bathroomBenchtops"],
    "Doors & Handles": ["internalDoors","handles"],
    "Kitchen Appliances": ["oven","cooktop","rangehood","dishwasher"],
    "Bathroom Fixtures": ["showerScreens","bathtub","tapware","toilets"],
    "Lighting & Electrical": ["lighting","powerPoints","heatingCooling","hotWater"]
  };

  // Mock edit history
  const editHistory = {
    generalDetails: [
      {id: 1,date:"2024-01-15T10:30:00Z",section:"General Details",field:"bedrooms",description:"Updated bedroom count from 3 to 3 + study",editedBy:"John Smith"},
      {id: 2,date:"2024-01-10T14:15:00Z",section:"General Details",field:"totalFloorArea",description:"Initial property setup with basic details",editedBy:"System"}
    ],
    wallsCeilings: [
      {id:3,date:"2024-01-12T09:45:00Z",section:"Walls & Ceilings",field:"paintColour",description:"Changed paint color from Vivid White to Natural White",editedBy:"John Smith"},
      {id:4,date:"2024-01-05T11:20:00Z",section:"Walls & Ceilings",field:"ceilingHeight",description:"Updated ceiling height specification",editedBy:"John Smith"}
    ],
    exteriorSpecs:[{id:5,date:"2024-01-08T16:20:00Z",section:"Exterior Specifications",field:"roof",description:"Updated roof color from Woodland Grey to Basalt",editedBy:"John Smith"}],
    flooring:[{id:6,date:"2024-01-14T13:45:00Z",section:"Flooring",field:"bedrooms",description:"Changed carpet color from Charcoal to Storm Grey",editedBy:"John Smith"}],
    cabinetryBenchtops:[{id:7,date:"2024-01-11T15:30:00Z",section:"Cabinetry & Bench Tops",field:"kitchenCabinets",description:"Updated kitchen cabinet finish",editedBy:"John Smith"}],
    doorsHandles:[{id:8,date:"2024-01-09T10:15:00Z",section:"Doors & Handles",field:"handles",description:"Changed handle finish to matte black",editedBy:"John Smith"}],
    kitchenAppliances:[{id:9,date:"2024-01-13T14:20:00Z",section:"Kitchen Appliances",field:"cooktop",description:"Upgraded cooktop from 600mm to 900mm induction",editedBy:"John Smith"}],
    bathroomFixtures:[{id:10,date:"2024-01-07T12:30:00Z",section:"Bathroom Fixtures",field:"tapware",description:"Updated tapware finish to matte black",editedBy:"John Smith"}],
    lightingElectrical:[{id:11,date:"2024-01-16T09:15:00Z",section:"Lighting & Electrical",field:"lighting",description:"Added pendant lighting specification",editedBy:"John Smith"}]
  };

  const [property, setProperty] = useState<Property | null>(null);
  const [owners, setOwners] = useState<Owner[] | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allJobAssets, setAllJobAssets] = useState<JobAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getPropertyDetails(propertyId);
        if (result) setProperty(result);
        else setError("Property not found");

        const ownerResult = await getPropertyOwners(propertyId);
        if (ownerResult) setOwners(ownerResult);
        else setError("Owner not found");

        const [jobs, jobAssets] = await fetchJobsInfo({ property_id: propertyId });
        console.log("Here", jobAssets);
        if (jobs) setAllJobs(jobs);
        if (jobAssets) setAllJobAssets(jobAssets);

      } catch (err: any) {
        setError(err.message ?? "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propertyId]);

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success("PIN copied to clipboard"); } 
    catch { toast.error("Failed to copy PIN"); }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  const handleUpdateJob = (jobId: string, sections: string[]) => {
    setAllJobAssets(prev => 
      prev.map(asset => 
        asset.job_id === jobId 
          ? { ...asset, accessibleSections: sections } 
          : asset
      )
    );

    toast.success("Job updated successfully");
  };

  const handleEdit = (sectionTitle: string, specificField?: string) => {
    setEditingSection(sectionTitle);
    const fields = sectionFields[sectionTitle as keyof typeof sectionFields];
    setEditingField(specificField || fields?.[0] || "");
    setEditDescription("");
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    setIsEditDialogOpen(false);
    setEditDescription("");
    setEditingSection("");
    setEditingField("");
  };

  const handleFieldChange = (fieldValue: string) => setEditingField(fieldValue);

  const getCurrentSectionFields = () => {
    if (!editingSection) return [];
    const fields = sectionFields[editingSection as keyof typeof sectionFields] || [];
    return fields.map(field => ({ value: field, label: field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) }));
  };

  const handleShowTimeline = (sectionTitle: string) => {
    setSelectedSectionForTimeline(sectionTitle);
    setIsTimelineDialogOpen(true);
  };

  const getSectionKey = (title: string): keyof typeof editHistory => {
    const keyMap: Record<string, keyof typeof editHistory> = {
      "General Details":"generalDetails",
      "Walls & Ceilings":"wallsCeilings",
      "Exterior Specifications":"exteriorSpecs",
      "Flooring":"flooring",
      "Cabinetry & Bench Tops":"cabinetryBenchtops",
      "Doors & Handles":"doorsHandles",
      "Kitchen Appliances":"kitchenAppliances",
      "Bathroom Fixtures":"bathroomFixtures",
      "Lighting & Electrical":"lightingElectrical"
    };
    return keyMap[title] || "generalDetails";
  };

  // ------------------ PIN Management ------------------ 
  const handleSavePin = async (job: Job, assetIds?: string[]) => {
    // Refresh data after saving
    const [jobs, jobAssets] = await fetchJobsInfo({ property_id: propertyId });
    if (jobs) setAllJobs(jobs);
    if (jobAssets) setAllJobAssets(jobAssets);
    toast.success("Job saved successfully");
  };

  const handleSaveJobEdits = async (updatedJob: Job) => {
    // Update the job in local state
    setAllJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
    
    // Refresh job assets
    const [, jobAssets] = await fetchJobsInfo({ property_id: propertyId });
    if (jobAssets) setAllJobAssets(jobAssets);
    
    toast.success("Job updated successfully");
  };

  const handleDeleteJob = async (jobId: string) => {
    const success = await deleteJob(jobId);

    if (success) {
      setAllJobs(prev => prev.filter(j => j.id !== jobId));
      setAllJobAssets(prev => prev.filter(a => a.job_id !== jobId));
      toast.success("Job deleted successfully");
    } else {
      toast.error("Failed to delete job");
    }
  };

  const handleToggleActive = (jobId: string, isActive: boolean) => {
    setAllJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: isActive ? JobStatus.ACCEPTED : JobStatus.REVOKED } : j));
    toast.success(`PIN ${isActive ? "activated" : "deactivated"} successfully`);
  };
  // -------------------------------------------------------

  const SpecificationSection = ({ title, items, children }: { title: string; items?: Record<string, string>; children?: React.ReactNode }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleShowTimeline(title)} className="text-muted-foreground hover:text-foreground">
            <History className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleEdit(title)} className="text-muted-foreground hover:text-foreground">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items && (
          <div className="space-y-2">
            {Object.entries(items).map(([key,value]) => (
              <div key={key} className="flex justify-between items-start group cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded" onClick={() => handleEdit(title,key)}>
                <span className="font-medium capitalize text-muted-foreground">
                  {key.replace(/([A-Z])/g,' $1').replace(/^./, str=>str.toUpperCase())}:
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-right max-w-2xl">{value}</span>
                  <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"/>
                </div>
              </div>
            ))}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="default">{property?.status ?? "0%"}</Badge>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Property Header */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <h1>{property?.name ?? "No name"}</h1>
          <p className="text-muted-foreground text-lg">{property?.description ?? "..."}</p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>
              Owner: {owners?.[0] ? `${owners[0].first_name} ${owners[0].last_name}` : "N/A"}
            </span>
            <span>•</span>
            <span>Address: {property?.address ?? "Missing address"}</span>
          </div>
        </div>

        {/* Access Control Section */}
        <div className="space-y-2 flex flex-col items-end">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center w-64 max-w-xs">
            <QRCodeCanvas
              value={propertyId}
              size={200}   // size in px
              level="H"    // error correction: L, M, Q, H
            />
          </div>
          <Button
            onClick={() => setIsPinDialogOpen(true)}
            className="w-64 max-w-xs"
            size="sm"
          >
            Create a New Job
          </Button>
        </div>
      </div>

      <Separator />

      {/* Property Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Image className="h-5 w-5 mr-2" />
            Property Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {property?.images && property?.images.length > 0 ? (
              property.images.map((url, idx) => (
                <div
                  key={idx}
                  className="aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center"
                >
                  <img
                    src={url}
                    alt={`Property Image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground">
                No images available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Spaces / Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {property?.spaces?.map((space) => (
          <SpecificationSection
            key={space.space_id}
            title={space.name} // e.g., "Bedroom", "Kitchen", "Living Area"
            items={space.assets.reduce<Record<string, string>>((acc, asset) => {
              acc[asset.type] = asset.description || "No description available";
              return acc;
            }, {})}
          />
        ))}
      </div>

      {/* Jobs / Access PINs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Jobs & Access Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PinTable
            propertyId={propertyId}
            property={property}
            jobs={allJobs}
            jobAssets={allJobAssets}
            onDeleteJob={handleDeleteJob}
            onSaveJobEdits={handleSaveJobEdits}
          />
        </CardContent>
      </Card>

      {/* PIN Management Dialog */}
      <section id="access-pins">
        <PinManagementDialog
          open={isPinDialogOpen}
          onOpenChange={setIsPinDialogOpen}
          propertyId={propertyId}
          property={property}
          onSave={handleSavePin}
        />
      </section>
    </div>
  );
}