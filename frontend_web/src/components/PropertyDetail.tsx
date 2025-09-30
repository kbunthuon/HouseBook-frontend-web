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
import { ArrowLeft, Edit, Key, FileText, Image, Clock, History, Save, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { PinManagementDialog } from "./PinManagementDialog";
import { PinTable } from "./PinTable";
import { toast } from "sonner";
import { getPropertyOwners, getPropertyDetails } from "../../../backend/FetchData";
import { Property, Owner } from "../types/serverTypes";
import { fetchJobsInfo, Job, JobAsset, JobStatus, deleteJob } from "../../../backend/JobService";
import { updateProperty, updateSpace, updateAssetWithType, updateSpaceAssets, PropertyUpdate, SpaceUpdate, AssetUpdate } from "../../../backend/PropertyEditService";

interface ChangeLogEntry {
  id: string;
  asset_id: string;
  specifications: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    timestamp: string;
  };
  change_description: string;
  changed_by_user_id?: string;
  created_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  // Joined data from the query
  Assets?: {
    id: string;
    AssetTypes?: {
      name: string;
    };
    Spaces?: {
      id: string;
      name: string;
      property_id: string;
    };
  };
}

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

type EditMode = 'property' | 'space' | 'asset' | null;

interface EditContext {
  mode: EditMode;
  spaceId?: string;
  spaceName?: string;
  assetId?: string;
  assetType?: string;
}

export function PropertyDetail({ propertyId, onBack }: PropertyDetailProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isTimelineDialogOpen, setIsTimelineDialogOpen] = useState(false);
  const [isAllHistoryDialogOpen, setIsAllHistoryDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<string>("");
  const [editingField, setEditingField] = useState<string>("");
  const [selectedSectionForTimeline, setSelectedSectionForTimeline] = useState<string>("");
  const [editDescription, setEditDescription] = useState("");

  // New edit system state
  const [editContext, setEditContext] = useState<EditContext>({ mode: null });
  const [editFormData, setEditFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Historical data state
  const [propertyHistory, setPropertyHistory] = useState<ChangeLogEntry[]>([]);
  const [spaceHistory, setSpaceHistory] = useState<ChangeLogEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  // New function to fetch historical data
  const fetchPropertyHistory = async () => {
    setLoadingHistory(true);
    try {
      const { getPropertyHistory } = await import('../../../backend/ChangeLogService');
      const history = await getPropertyHistory(propertyId);
      setPropertyHistory(history);
    } catch (error) {
      console.error('Error fetching property history:', error);
      toast.error('Failed to load property history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchSpaceHistory = async (spaceId: string) => {
    setLoadingHistory(true);
    try {
      const { getSpaceHistory } = await import('../../../backend/ChangeLogService');
      const history = await getSpaceHistory(spaceId);
      setSpaceHistory(history);
    } catch (error) {
      console.error('Error fetching space history:', error);
      toast.error('Failed to load space history');
    } finally {
      setLoadingHistory(false);
    }
  };

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

  // New edit handlers
  const handleEditProperty = () => {
    setEditContext({ mode: 'property' });
    setEditFormData({
      name: property?.name || '',
      description: property?.description || '',
      address: property?.address || '',
      type: property?.type || 'Townhouse',
      total_floor_area: property?.totalFloorArea || 0
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSpace = (spaceId: string, spaceName: string) => {
    const space = property?.spaces?.find(s => s.space_id === spaceId);
    setEditContext({ mode: 'space', spaceId, spaceName });
    setEditFormData({
      name: space?.name || '',
      type: space?.type || '',
      assets: space?.assets?.map(asset => ({
        id: asset.asset_id,
        type: asset.type,
        description: asset.description || ''
      })) || []
    });
    setIsEditDialogOpen(true);
  };

  const handleEditAsset = (spaceId: string, spaceName: string, assetId: string, assetType: string) => {
    const space = property?.spaces?.find(s => s.space_id === spaceId);
    const asset = space?.assets?.find(a => a.asset_id === assetId);
    setEditContext({ mode: 'asset', spaceId, spaceName, assetId, assetType });
    setEditFormData({
      type: asset?.type || '',
      description: asset?.description || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      if (editContext.mode === 'property') {
        // Update property information in database
        const updates: PropertyUpdate = {
          name: editFormData.name,
          description: editFormData.description,
          address: editFormData.address,
          type: editFormData.type,
          total_floor_area: editFormData.total_floor_area
        };

        const updatedProperty = await updateProperty(propertyId, updates);
        
        // Update local state
        setProperty(prev => prev ? { ...prev, ...updatedProperty } : null);
        toast.success("Property updated successfully");

      } else if (editContext.mode === 'space') {
        // Update space information in database
        const spaceUpdates: SpaceUpdate = {
          name: editFormData.name,
          type: editFormData.type
        };

        // Update the space itself
        await updateSpace(editContext.spaceId!, spaceUpdates);

        // Update all assets in the space with history tracking
        if (editFormData.assets && editFormData.assets.length > 0) {
          const { updateAssetWithHistory } = await import('../../../backend/ChangeLogService');
          
          for (const asset of editFormData.assets) {
            await updateAssetWithHistory(
              asset.id,
              { type: asset.type, description: asset.description },
              `Updated ${asset.type} in ${editContext.spaceName}`
            );
          }
        }

        // Refresh property data to reflect changes
        const refreshedProperty = await getPropertyDetails(propertyId);
        if (refreshedProperty) setProperty(refreshedProperty);

        toast.success(`${editContext.spaceName} updated successfully`);

      } else if (editContext.mode === 'asset') {
        // Update single asset with history tracking
        const { updateAssetWithHistory } = await import('../../../backend/ChangeLogService');
        
        await updateAssetWithHistory(
          editContext.assetId!,
          { type: editFormData.type, description: editFormData.description },
          `Updated ${editContext.assetType}`
        );

        // Refresh property data to reflect changes
        const refreshedProperty = await getPropertyDetails(propertyId);
        if (refreshedProperty) setProperty(refreshedProperty);

        toast.success(`${editContext.assetType} updated successfully`);
      }

      setIsEditDialogOpen(false);
      setEditContext({ mode: null });
    } catch (error: any) {
      console.error("Error saving changes:", error);
      toast.error(`Failed to save changes: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (sectionTitle: string, specificField?: string) => {
    setEditingSection(sectionTitle);
    const fields = sectionFields[sectionTitle as keyof typeof sectionFields];
    setEditingField(specificField || fields?.[0] || "");
    setEditDescription("");
    setIsEditDialogOpen(true);
  };

  const handleSaveOldEdit = () => {
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

  // Updated handlers for showing history
  const handleShowTimeline = async (sectionTitle: string) => {
    setSelectedSectionForTimeline(sectionTitle);
    
    // Find the space that matches this section title
    const space = property?.spaces?.find(s => s.name === sectionTitle);
    if (space) {
      await fetchSpaceHistory(space.space_id);
    }
    
    setIsTimelineDialogOpen(true);
  };

  const handleShowAllPropertyHistory = async () => {
    await fetchPropertyHistory();
    setIsAllHistoryDialogOpen(true);
  };

  // Helper function to format changelog entries for display
  const formatChangeLogEntry = (entry: ChangeLogEntry) => {
    const assetName = entry.Assets?.AssetTypes?.name || 'Unknown Asset';
    const spaceName = entry.Assets?.Spaces?.name || 'Unknown Space';
    
    return {
      id: entry.id,
      date: entry.created_at,
      section: spaceName,
      field: assetName,
      description: entry.change_description,
      editedBy: entry.changed_by_user_id || 'System'
    };
  };

  // PIN Management handlers
  const handleSavePin = async (job: Job, assetIds?: string[]) => {
    const [jobs, jobAssets] = await fetchJobsInfo({ property_id: propertyId });
    if (jobs) setAllJobs(jobs);
    if (jobAssets) setAllJobAssets(jobAssets);
    toast.success("Job saved successfully");
  };

  const handleSaveJobEdits = async (updatedJob: Job) => {
    setAllJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
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

  const SpecificationSection = ({ title, items, children, spaceId, spaceName }: { 
    title: string; 
    items?: Record<string, string>; 
    children?: React.ReactNode;
    spaceId?: string;
    spaceName?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleShowTimeline(title)} className="text-muted-foreground hover:text-foreground">
            <History className="h-4 w-4" />
          </Button>
          {spaceId && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleEditSpace(spaceId, spaceName || title)} 
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items && spaceId && (
          <div className="space-y-2">
            {Object.entries(items).map(([assetType, description]) => {
              const space = property?.spaces?.find(s => s.space_id === spaceId);
              const asset = space?.assets?.find(a => a.type === assetType);
              return (
                <div 
                  key={assetType} 
                  className="flex justify-between items-start group cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded" 
                  onClick={() => asset && handleEditAsset(spaceId, spaceName || title, asset.asset_id, assetType)}
                >
                  <span className="font-medium capitalize text-muted-foreground">
                    {assetType.replace(/([A-Z])/g,' $1').replace(/^./, str=>str.toUpperCase())}:
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-right max-w-2xl">{description}</span>
                    <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"/>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );

  const renderEditDialog = () => {
    if (editContext.mode === 'space') {
      return (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-7xl w-[90vw] h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit {editContext.spaceName}</DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="flex-1 -mx-6 px-6">
              {/* Space Details Section */}
              <div className="py-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Space Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="spaceName">Space Name</Label>
                      <Input
                        id="spaceName"
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="spaceType">Space Type</Label>
                      <Input
                        id="spaceType"
                        value={editFormData.type || ''}
                        onChange={(e) => setEditFormData({...editFormData, type: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Assets Section */}
              <div className="pb-4">
                <h3 className="text-lg font-semibold mb-4">Assets in this Space</h3>
                <div className="grid grid-cols-2 gap-4">
                  {editFormData.assets?.map((asset: any, index: number) => (
                    <Card key={asset.id} className="border-2 border-muted hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{asset.type || `Asset ${index + 1}`}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label htmlFor={`assetType-${index}`}>Asset Type</Label>
                          <Input
                            id={`assetType-${index}`}
                            value={asset.type}
                            onChange={(e) => {
                              const updatedAssets = [...editFormData.assets];
                              updatedAssets[index] = {...asset, type: e.target.value};
                              setEditFormData({...editFormData, assets: updatedAssets});
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`assetDescription-${index}`}>Description</Label>
                          <Textarea
                            id={`assetDescription-${index}`}
                            value={asset.description}
                            rows={3}
                            onChange={(e) => {
                              const updatedAssets = [...editFormData.assets];
                              updatedAssets[index] = {...asset, description: e.target.value};
                              setEditFormData({...editFormData, assets: updatedAssets});
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>

            {/* Footer - Always visible */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }
  }

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
          <Button variant="outline" size="sm" onClick={handleEditProperty}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Property
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
            <span>•</span>
            <span>Floor Area: {property?.totalFloorArea ?? 0}m²</span>
          </div>
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleShowAllPropertyHistory()}
              className="text-xs"
            >
              <History className="h-3 w-3 mr-1" />
              View All Property History
            </Button>
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
            title={space.name}
            spaceId={space.space_id}
            spaceName={space.name}
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

      {/* Edit Dialogs */}
      {renderEditDialog()}

      {/* Edit History Dialog - Space History */}
      <Dialog open={isTimelineDialogOpen} onOpenChange={setIsTimelineDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Edit History - {selectedSectionForTimeline}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[75vh] pr-4">
            <div className="grid grid-cols-2 gap-6">
              {loadingHistory ? (
                <div className="col-span-2 text-center text-muted-foreground py-8">
                  <p>Loading history...</p>
                </div>
              ) : spaceHistory.length === 0 ? (
                <div className="col-span-2 text-center text-muted-foreground py-8">
                  <p>No edit history available for this section.</p>
                </div>
              ) : (
                spaceHistory.map((entry, index) => {
                  const formattedEntry = formatChangeLogEntry(entry);
                  const isLeftColumn = index % 2 === 0;
                  
                  return (
                    <div key={entry.id} className={`${isLeftColumn ? 'col-start-1' : 'col-start-2'}`}>
                      <Card className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{formattedEntry.section}</Badge>
                            <Badge variant="secondary">{formattedEntry.field}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(formattedEntry.date)}
                          </div>
                        </div>
                        <p className="text-sm">{formattedEntry.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Edited by: {formattedEntry.editedBy}</span>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(formattedEntry.date).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        
                        {/* Show before/after changes if available */}
                        {entry.specifications?.before && entry.specifications?.after && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="font-medium text-red-600">Before:</span>
                                <div className="mt-1 p-2 bg-red-50 rounded">
                                  {JSON.stringify(entry.specifications.before, null, 2)}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-green-600">After:</span>
                                <div className="mt-1 p-2 bg-green-50 rounded">
                                  {JSON.stringify(entry.specifications.after, null, 2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsTimelineDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Property History Dialog */}
      <Dialog open={isAllHistoryDialogOpen} onOpenChange={setIsAllHistoryDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Complete Property History - {property?.name}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[75vh] pr-4">
            <div className="grid grid-cols-2 gap-6">
              {loadingHistory ? (
                <div className="col-span-2 text-center text-muted-foreground py-8">
                  <p>Loading property history...</p>
                </div>
              ) : propertyHistory.length === 0 ? (
                <div className="col-span-2 text-center text-muted-foreground py-8">
                  <p>No edit history available for this property.</p>
                </div>
              ) : (
                propertyHistory.map((entry, index) => {
                  const formattedEntry = formatChangeLogEntry(entry);
                  const isLeftColumn = index % 2 === 0;
                  
                  return (
                    <div key={entry.id} className={`${isLeftColumn ? 'col-start-1' : 'col-start-2'}`}>
                      <Card className="border-l-4 border-l-primary/50">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{formattedEntry.section}</Badge>
                              <Badge variant="secondary" className="text-xs">{formattedEntry.field}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(formattedEntry.date)}
                            </div>
                          </div>
                          <p className="text-sm mb-2">{formattedEntry.description}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Edited by: {formattedEntry.editedBy}</span>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(formattedEntry.date).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          
                          {/* Show before/after changes if available */}
                          {entry.specifications?.before && entry.specifications?.after && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="font-medium text-red-600">Before:</span>
                                  <div className="mt-1 p-2 bg-red-50 rounded">
                                    {JSON.stringify(entry.specifications.before, null, 2)}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium text-green-600">After:</span>
                                  <div className="mt-1 p-2 bg-green-50 rounded">
                                    {JSON.stringify(entry.specifications.after, null, 2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAllHistoryDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
