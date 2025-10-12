import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogOverlay } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { ArrowLeft, Edit, Key, FileText, Image, Clock, History, Save, X, Trash2, Plus, AlertCircle, Trash2Icon } from "lucide-react";
import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { PinManagementDialog } from "./PinManagementDialog";
import { PinTable } from "./PinTable";
import { toast } from "sonner";
import { getPropertyImages, getPropertyOwners } from "../../../backend/FetchData";
import { Owner, ChangeLog } from "../types/serverTypes";

// Backend-shaped types (matches getPropertyForEdit response)
interface BackendAsset {
  id: string;
  description?: string;
  current_specifications?: Record<string, any>;
  deleted?: boolean;
  AssetTypes?: { id: number; name: string; discipline?: string };
}

interface BackendSpace {
  id: string;
  name: string;
  type?: string;
  deleted?: boolean;
  Assets?: BackendAsset[];
}

interface BackendProperty {
  property_id: string;
  name: string;
  description?: string;
  address?: string;
  total_floor_area?: number;
  images?: string[];
  Spaces?: BackendSpace[];
}
import { fetchJobsInfo, Job, JobAsset, JobStatus, deleteJob } from "../../../backend/JobService";

import { 
  updateProperty, 
  updateSpace, 
  updateAsset, 
  deleteSpace,
  deleteAsset,
  createSpace,
  createAsset,
  updateFeatures,
  deleteFeature,
  getAssetTypes,
  getPropertyForEdit,
  PropertyUpdate, 
  SpaceUpdate, 
  AssetUpdate 
} from "../../../backend/PropertyEditService";
import { getPropertyHistory, getSpaceHistory, getAssetHistory, ChangeLogAction } from "../../../backend/ChangeLogService";
import { fetchSpaceEnum } from "../../../backend/FetchSpaceEnum";

interface PropertyDetailProps {
  propertyId: string;
  onBack: () => void;
}

type DialogMode = 'property' | 'space' | 'asset' | 'feature' | 'createSpace' | 'createAsset' | null;

interface DialogContext {
  mode: DialogMode;
  spaceId?: string;
  spaceName?: string;
  assetId?: string;
  assetType?: string;
  featureName?: string;
}

export function PropertyDetail({ propertyId, onBack }: PropertyDetailProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isTimelineDialogOpen, setIsTimelineDialogOpen] = useState(false);
  const [isAllHistoryDialogOpen, setIsAllHistoryDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [dialogContext, setDialogContext] = useState<DialogContext>({ mode: null });
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'space' | 'asset' | 'feature', id?: string, name?: string }>({ type: 'asset' });

  const [property, setProperty] = useState<BackendProperty | null>(null);
  const [owners, setOwners] = useState<Owner[] | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allJobAssets, setAllJobAssets] = useState<JobAsset[]>([]);
  const [changelogHistory, setChangelogHistory] = useState<ChangeLog[]>([]);
  const [spaceChangelogHistory, setSpaceChangelogHistory] = useState<ChangeLog[]>([]);
  const [assetTypes, setAssetTypes] = useState<any[]>([]);
  const [spaceTypes, setSpaceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // New space creation state
  const [newSpaceAssets, setNewSpaceAssets] = useState<Array<{
    tempId: string;
    assetTypeId: number;
    assetTypeName: string;
    description: string;
    specifications: Record<string, any>;
  }>>([]);
  // Feature form visibility states
  const [showFeatureFormAssetEdit, setShowFeatureFormAssetEdit] = useState(false);
  const [showFeatureFormCreateAsset, setShowFeatureFormCreateAsset] = useState(false);
  const [featureFormCreateSpaceIndex, setFeatureFormCreateSpaceIndex] = useState<number | null>(null);

  // Small reusable in-place feature editor card (name + value)
  function FeatureCard({
    initialName = "",
    initialValue = "",
    onAdd,
    onCancel,
    className = "",
  }: {
    initialName?: string;
    initialValue?: string;
    onAdd: (name: string, value: string) => void;
    onCancel: () => void;
    className?: string;
  }) {
    const [name, setName] = useState(initialName);
    const [value, setValue] = useState(initialValue);

    return (
      <div className={`pt-3 ${className}`}>
        <Card className="w-full">
          <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto pt-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="block">Feature name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label className="block">Feature value</Label>
                <Input value={value} onChange={(e) => setValue(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
              <Button size="sm" onClick={() => { if (name.trim()) { onAdd(name.trim(), value); } }}>
                OK
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchData();
    loadAssetTypes();
    loadSpaceTypes();
  }, [propertyId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getPropertyForEdit(propertyId);
  if (result) setProperty(result);
      else setError("Property not found");

      // Fetch images
      const images = await getPropertyImages(propertyId);
      console.log(images);
      // Update property with images without losing current state
      setProperty((prev) => prev ? { ...prev, images } : prev);

      const ownerResult = await getPropertyOwners(propertyId);
      if (ownerResult) setOwners(ownerResult);

      const [jobs, jobAssets] = await fetchJobsInfo({ property_id: propertyId });
      if (jobs) setAllJobs(jobs);
      if (jobAssets) setAllJobAssets(jobAssets);

      console.log("property:", property);
    } catch (err: any) {
      setError(err.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // Map backend-shaped property to the shared Property shape expected by some child components
  const mapToSharedProperty = (bp: BackendProperty | null) => {
    if (!bp) return null;
    return {
      property_id: bp.property_id,
      address: bp.address || bp.address || "",
      description: bp.description || "",
      pin: "",
      name: bp.name,
      type: bp.total_floor_area ? "" : "",
      status: "",
      lastUpdated: "",
      completionStatus: 0,
      totalFloorArea: bp.total_floor_area,
      spaces: bp.Spaces?.map(s => ({
        space_id: s.id,
        name: s.name,
        type: s.type || "",
        assets: s.Assets?.map(a => ({
          asset_id: a.id,
          type: a.AssetTypes?.name || a.type || "",
          description: a.description || "",
        })) || [],
      })) || [],
      images: bp.images || [],
      created_at: "",
    } as any;
  };


  const loadAssetTypes = async () => {
    try {
      const types = await getAssetTypes();
      setAssetTypes(types);
    } catch (error) {
      console.error("Failed to load asset types:", error);
    }
  };

  const loadSpaceTypes = async () => {
    try {
      const types = await fetchSpaceEnum();
      setSpaceTypes(types || []);
      // if creating a space and no type set, default to first enum
      if (!formData.type && types && types.length > 0) {
        setFormData((f: any) => ({ ...f, type: types[0] }));
      }
    } catch (err) {
      console.error("Failed to load space types:", err);
    }
  };

  // PROPERTY EDIT
  const handleEditProperty = () => {
    setDialogContext({ mode: 'property' });
    setFormData({
      name: property?.name || '',
      description: property?.description || '',
      address: property?.address || '',
      type: 'Townhouse',
      total_floor_area: property?.total_floor_area || 0
    });
    setIsDialogOpen(true);
  };

  // SPACE EDIT
  const handleEditSpace = (spaceId: string, spaceName: string) => {
    const space = property?.Spaces?.find(s => s.id === spaceId);
    console.log("handleEditSpace: ", spaceId, spaceName);
    setDialogContext({ mode: 'space', spaceId, spaceName });
    setFormData({
      name: space?.name || '',
      type: space?.type || ''
    });
    setIsDialogOpen(true);
  };

  // SPACE CREATE
  const handleCreateSpace = () => {
    setDialogContext({ mode: 'createSpace' });
    setFormData({
      name: '',
      type: 'LIVING'
    });
    setNewSpaceAssets([]);
    setIsDialogOpen(true);
  };

  // SPACE DELETE
  const handleDeleteSpace = (spaceId: string, spaceName: string) => {
    setDeleteTarget({ type: 'space', id: spaceId, name: spaceName });
    setIsDeleteConfirmOpen(true);
  };

  // ASSET EDIT
  const handleEditAsset = (spaceId: string, spaceName: string, assetId: string, assetType: string) => {
    const space = property?.Spaces?.find(s => s.id === spaceId);
    const asset = space?.Assets?.find(a => a.id === assetId);
    console.log("handleEditAssets: spaceId: ", spaceId, ", spaceName: ", spaceName, ", assetId: ", assetId, ", assetType: ", assetType);
    setDialogContext({ mode: 'asset', spaceId, spaceName, assetId, assetType });
    setFormData({
      description: asset?.description || '',
      current_specifications: asset?.current_specifications || {}
    });
    setIsDialogOpen(true);
  };

  // ASSET CREATE
  const handleCreateAsset = (spaceId: string, spaceName: string) => {
    setDialogContext({ mode: 'createAsset', spaceId, spaceName });
    setFormData({
      assetTypeId: '',
      description: '',
      specifications: {}
    });
    setIsDialogOpen(true);
  };

  // ASSET DELETE
  const handleDeleteAsset = (assetId: string, assetName: string) => {
    setDeleteTarget({ type: 'asset', id: assetId, name: assetName });
    setIsDeleteConfirmOpen(true);
  };

  // FEATURE DELETE
  const handleDeleteFeature = (assetId: string, featureName: string) => {
    setDeleteTarget({ type: 'feature', id: assetId, name: featureName });
    setIsDeleteConfirmOpen(true);
  };

  // SAVE HANDLER
  const handleSave = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsConfirmOpen(false);
    setSaving(true);
    console.log("DialogContext in handleConfirmSave: ", dialogContext);
    try {
      if (dialogContext.mode === 'property') {
        const updates: PropertyUpdate = {
          name: formData.name,
          description: formData.description,
          address: formData.address,
          type: formData.type,
          total_floor_area: formData.total_floor_area
        };
        await updateProperty(propertyId, updates);
        toast.success("Property updated successfully");
        
      } else if (dialogContext.mode === 'space') {
        const updates: SpaceUpdate = {
          name: formData.name,
          type: formData.type
        };
        await updateSpace(dialogContext.spaceId!, updates);
        toast.success(`${dialogContext.spaceName} updated successfully`);
        
      } else if (dialogContext.mode === 'asset') {
        const updates: AssetUpdate = {
          description: formData.description,
          current_specifications: formData.current_specifications
        };
        await updateAsset(dialogContext.assetId!, updates);
        toast.success(`${dialogContext.assetType} updated successfully`);

        console.log("Asset dialog context: ", dialogContext);
        
      } else if (dialogContext.mode === 'createSpace') {
        await createSpace(
          propertyId,
          formData.name,
          formData.type,
          newSpaceAssets.map(a => ({
            assetTypeId: a.assetTypeId,
            description: a.description,
            specifications: a.specifications
          }))
        );
        toast.success("Space created successfully");
        
      } else if (dialogContext.mode === 'createAsset') {
        await createAsset(
          dialogContext.spaceId!,
          parseInt(formData.assetTypeId),
          formData.description,
          formData.specifications
        );
        toast.success("Asset created successfully");
      }
      console.log("Dialog context: ", dialogContext);
      await fetchData();
      setIsDialogOpen(false);
      setDialogContext({ mode: null });
    } catch (error: any) {
      console.error("Error saving:", error);
      
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // DELETE HANDLER
  const handleConfirmDelete = async () => {
    setIsDeleteConfirmOpen(false);
    
    try {
      if (deleteTarget.type === 'space') {
        await deleteSpace(deleteTarget.id!);
        toast.success("Space deleted successfully");
      } else if (deleteTarget.type === 'asset') {
        await deleteAsset(deleteTarget.id!);
        toast.success("Asset deleted successfully");
      } else if (deleteTarget.type === 'feature') {
        await deleteFeature(deleteTarget.id!, deleteTarget.name!);
        toast.success("Feature deleted successfully");
      }
      
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting:", error);
      console.log("Delete target: ", deleteTarget);
      toast.error(`Failed to delete: ${error.message || 'Unknown error'}`);
    }
  };

  // History handlers
  const handleShowTimeline = async (spaceName: string, spaceId?: string) => {
    console.log("handleShowTimeline spaceId: ", spaceId);
    console.log("handleShowTimeline spaceName: ", spaceName);
    if (spaceId) {
      try {
        const history = await getSpaceHistory(spaceId);
        setSpaceChangelogHistory(history);
      } catch (error) {
        console.error("Failed to load space history:", error);
        setSpaceChangelogHistory([]);
      }
    }

    console.log(spaceId, spaceName, spaceChangelogHistory);
    setIsTimelineDialogOpen(true);
  };

  const handleShowAllPropertyHistory = async () => {
    try {
      const history = await getPropertyHistory(propertyId);
      setChangelogHistory(history);
    } catch (error) {
      console.error("Failed to load property history:", error);
      setChangelogHistory([]);
    }
    setIsAllHistoryDialogOpen(true);
  };

  // PIN handlers
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

  const formatSpecifications = (specs: Record<string, any>) => {
    if (!specs || typeof specs !== 'object') return null;
    
    return Object.entries(specs).map(([key, value]) => (
      <div key={key} className="text-sm flex justify-between items-center">
        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
        <span className="text-muted-foreground">{String(value)}</span>
      </div>
    ));
  };

  const SpecificationSection = ({ 
    title, 
    spaceId, 
    spaceName,
    assets 
  }: { 
    title: string; 
    spaceId: string;
    spaceName: string;
    assets: Asset[];
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="font-semibold">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleShowTimeline(title, spaceId)}>
            <History className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleCreateAsset(spaceId, spaceName)}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleEditSpace(spaceId, spaceName)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteSpace(spaceId, spaceName)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[50vh] overflow-auto">
        {assets.map((asset) => (
          <div key={asset.id} className="border rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{asset.AssetTypes.name}</span>
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditAsset(spaceId, spaceName, asset.id, asset.AssetTypes.name)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteAsset(asset.id, asset.AssetTypes.name)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
                {asset.description && (
                  <p className="text-sm text-muted-foreground mb-2">{asset.description}</p>
                )}
              </div>
            </div>
            
            {asset.current_specifications && Object.keys(asset.current_specifications).length > 0 ? (
              <div className="space-y-1 bg-muted/30 p-2 rounded">
                {Object.entries(asset.current_specifications).map(([key, value]) => (
                  <div key={key} className="text-sm flex justify-between items-center group">
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">{String(value)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteFeature(asset.id, key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No specifications</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderDialog = () => {
    if (dialogContext.mode === 'property') {
      return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[80vw] max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Property Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Property Name</Label>
                <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <Label>Total Floor Area (m²)</Label>
                <Input type="number" value={formData.total_floor_area || ''} onChange={(e) => setFormData({...formData, total_floor_area: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}><X className="h-4 w-4 mr-2" />Cancel</Button>
              <Button onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    if (dialogContext.mode === 'space') {
      return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[80vw] max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {dialogContext.spaceName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Space Name</Label>
                <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                  <Label>Space Type</Label>
                <Select value={formData.type} onValueChange={(value: string) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {spaceTypes.map((st) => (
                      <SelectItem key={st} value={st}>{st}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}><X className="h-4 w-4 mr-2" />Cancel</Button>
              <Button onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    if (dialogContext.mode === 'asset') {
      return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[90vw] max-w-[90vh] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {dialogContext.assetType}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
              </div>
              <Separator />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-lg">Features / Specifications</Label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowFeatureFormAssetEdit(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />Add Feature
                  </Button>
                </div>

                {/* Feature form appears below header and above the list */}
                {showFeatureFormAssetEdit && (
                  <div className="mt-2">
                    <FeatureCard
                      className="w-full"
                      onAdd={(name, value) => {
                        setFormData({
                          ...formData,
                          current_specifications: {
                            ...formData.current_specifications,
                            [name]: value,
                          },
                        });
                        setShowFeatureFormAssetEdit(false);
                      }}
                      onCancel={() => setShowFeatureFormAssetEdit(false)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  {Object.entries(formData.current_specifications || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2 p-2 border rounded">
                      <Input value={key} disabled className="flex-1 bg-muted" />
                      <Input 
                        value={String(value)} 
                        onChange={(e) => setFormData({
                          ...formData,
                          current_specifications: {
                            ...formData.current_specifications,
                            [key]: e.target.value
                          }
                        })}
                        className="flex-1"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const specs = {...formData.current_specifications};
                          delete specs[key];
                          setFormData({...formData, current_specifications: specs});
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}><X className="h-4 w-4 mr-2" />Cancel</Button>
              <Button onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    if (dialogContext.mode === 'createSpace') {
      const canSave = formData.name && newSpaceAssets.length > 0 && newSpaceAssets.every(a => a.assetTypeId && Object.keys(a.specifications).length > 0);
      
      return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Space</DialogTitle>
              <DialogDescription>Add a new space with at least one asset and one feature per asset</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Space Name *</Label>
                  <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g., Master Bedroom" />
                </div>
                <div>
                  <Label>Space Type *</Label>
                  <Select value={formData.type} onValueChange={(value: string) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {spaceTypes.map((st) => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-lg">Assets *</Label>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setNewSpaceAssets([...newSpaceAssets, {
                        tempId: `temp-${Date.now()}`,
                        assetTypeId: 0,
                        assetTypeName: '',
                        description: '',
                        specifications: {}
                      }]);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />Add Asset
                  </Button>
                </div>
                
                {newSpaceAssets.map((asset, idx) => (
                  <Card key={asset.tempId} className="mb-3 relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setNewSpaceAssets(newSpaceAssets.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <CardContent className="pt-4 space-y-3">
                      <div>
                        <Label>Asset Type *</Label>
                        <Select 
                          value={String(asset.assetTypeId)} 
                          onValueChange={(value: string) => {
                            const assetType = assetTypes.find(t => t.id === parseInt(value));
                            const updated = [...newSpaceAssets];
                            updated[idx] = {...asset, assetTypeId: parseInt(value), assetTypeName: assetType?.name || ''};
                            setNewSpaceAssets(updated);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select asset type" />
                          </SelectTrigger>
                          <SelectContent>
                            {assetTypes.map(type => (
                              <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea 
                          value={asset.description} 
                          onChange={(e) => {
                            const updated = [...newSpaceAssets];
                            updated[idx] = {...asset, description: e.target.value};
                            setNewSpaceAssets(updated);
                          }}
                          rows={2}
                        />
                      </div>
                      <div>
                          <div className="flex justify-between items-center mb-2">
                          <Label>Features * (at least one)</Label>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => { setFeatureFormCreateSpaceIndex(idx); setShowFeatureFormCreateAsset(true); }}
                          >
                            <Plus className="h-3 w-3 mr-1" />Add
                          </Button>
                        </div>

                        {/* Feature card below header */}
                        {showFeatureFormCreateAsset && featureFormCreateSpaceIndex === idx && (
                          <FeatureCard
                            className="w-full mb-2"
                            onAdd={(name, value) => {
                              const updated = [...newSpaceAssets];
                              updated[idx] = {
                                ...asset,
                                specifications: { ...asset.specifications, [name]: value },
                              };
                              setNewSpaceAssets(updated);
                              setShowFeatureFormCreateAsset(false);
                              setFeatureFormCreateSpaceIndex(null);
                            }}
                            onCancel={() => { setShowFeatureFormCreateAsset(false); setFeatureFormCreateSpaceIndex(null); }}
                          />
                        )}

                        <div className="space-y-1">
                          {Object.entries(asset.specifications).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2 text-sm">
                              <span className="font-medium">{key}:</span>
                              <span>{String(value)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  const specs = {...asset.specifications};
                                  delete specs[key];
                                  const updated = [...newSpaceAssets];
                                  updated[idx] = {...asset, specifications: specs};
                                  setNewSpaceAssets(updated);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {Object.keys(asset.specifications).length === 0 && (
                            <p className="text-xs text-destructive">At least one feature required</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {newSpaceAssets.length === 0 && (
                  <div className="text-center p-4 border border-dashed rounded">
                    <p className="text-sm text-muted-foreground">No assets added yet. Click "Add Asset" to get started.</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}><X className="h-4 w-4 mr-2" />Cancel</Button>
              <Button onClick={handleSave} disabled={!canSave || saving}>
                <Save className="h-4 w-4 mr-2" />{saving ? "Creating..." : "Create Space"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    if (dialogContext.mode === 'createAsset') {
      const canSave = formData.assetTypeId && Object.keys(formData.specifications || {}).length > 0;
      
      return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Asset in {dialogContext.spaceName}</DialogTitle>
              <DialogDescription>Asset must have at least one feature</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Asset Type *</Label>
                <Select value={formData.assetTypeId} onValueChange={(value: string) => setFormData({...formData, assetTypeId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map(type => (
                      <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
              </div>
              <Separator />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-lg">Features * (at least one)</Label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowFeatureFormCreateAsset(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />Add Feature
                  </Button>
                  {showFeatureFormCreateAsset && (
                    <FeatureCard
                      className="w-full mt-2"
                      onAdd={(name, value) => {
                        setFormData({
                          ...formData,
                          specifications: { ...(formData.specifications || {}), [name]: value },
                        });
                        setShowFeatureFormCreateAsset(false);
                      }}
                      onCancel={() => setShowFeatureFormCreateAsset(false)}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  {Object.entries(formData.specifications || {}).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 gap-2 items-center p-2 border rounded">
                      <div className="font-medium">{key}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">{String(value)}</div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const specs = {...formData.specifications};
                            delete specs[key];
                            setFormData({...formData, specifications: specs});
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {Object.keys(formData.specifications || {}).length === 0 && (
                    <p className="text-sm text-destructive">At least one feature required</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}><X className="h-4 w-4 mr-2" />Cancel</Button>
              <Button onClick={handleSave} disabled={!canSave || saving}><Save className="h-4 w-4 mr-2" />{saving ? "Creating..." : "Create Asset"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return null;
  };

  if (loading) return <div className="p-8 text-center">Loading property details...</div>;
  if (error) return <div className="p-8 text-center text-destructive">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Properties
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="default">{(property && (property as any).status) ?? "Active"}</Badge>
          <Button variant="outline" size="sm" onClick={handleEditProperty}>
            <Edit className="h-4 w-4 mr-2" />Edit Property
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <h1>{property?.name ?? "Property"}</h1>
          <p className="text-muted-foreground text-lg">{property?.description}</p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Owner: {owners?.[0] ? `${owners[0].first_name} ${owners[0].last_name}` : "N/A"}</span>
            <span>•</span>
            <span>{property?.address}</span>
            <span>•</span>
            <span>{property?.total_floor_area ?? 0}m²</span>
          </div>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={handleShowAllPropertyHistory}>
              <History className="h-3 w-3 mr-1" />View All History
            </Button>
          </div>
        </div>

        <div className="space-y-2 flex flex-col items-end">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center w-64">
            <QRCodeCanvas value={propertyId} size={200} level="H" />
          </div>
          <Button onClick={() => setIsPinDialogOpen(true)} className="w-64" size="sm">
            Create New Job
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
          {property?.images && property.images.length > 0 ? (
            <div className="flex flex-row gap-3 overflow-x-auto max-w-max max-h-[35vh] py-2">
              {property.images.map((url, idx) => (
                <div
                  key={idx}
                  className={"w-80 h-80 bg-gray-50 rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col cursor-pointer"}
                  style={{ minWidth: '320px', maxWidth: '320px'}}
                  onClick={() => setSelectedImage(url)}
                >
                  <img
                    src={url}
                    alt={`Property Image ${idx + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No images available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogOverlay className="bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <DialogContent
          hideCloseButton
          className="bg-transparent border-none shadow-none p-0 flex items-center justify-center data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
        >
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Enlarged Property"
              className="max-w-max max-h-max object-contain rounded-xl shadow-xl"
            />
          )}
        </DialogContent>
      </Dialog>





      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Spaces & Assets</h2>
        <Button onClick={handleCreateSpace}>
          <Plus className="h-4 w-4 mr-2" />Create New Space
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {property?.Spaces?.filter(space => !space.deleted).map(space => (
          <SpecificationSection
            key={space.id}
            title={space.name}
            spaceId={space.id}
            spaceName={space.name}
            assets={(space.Assets ?? []).filter(asset => !asset.deleted).map(asset => ({
              id: asset.id,
              description: asset.description,
              discipline: asset.AssetTypes?.discipline ?? "",
              current_specifications: asset.current_specifications ?? {},
              AssetTypes: {
                id: asset.AssetTypes?.id ?? "",
                name: asset.AssetTypes?.name ?? "",
                discipline: asset.AssetTypes?.discipline ?? "",
              },
              deleted: asset.deleted ?? false,
            }))}
          />
        ))}
      </div>



      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />Jobs & Access Management
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

  {/* Pass the mapped shared property to components expecting the shared Property shape */}
  <PinManagementDialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen} propertyId={propertyId} property={mapToSharedProperty(property)} onSave={handleSavePin} />

      {renderDialog()}

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes? This action will be recorded in the changelog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteTarget.name}? This will be recorded as a soft delete and can be viewed in the history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Space History Dialog */}
    <Dialog open={isTimelineDialogOpen} onOpenChange={setIsTimelineDialogOpen}>
      <DialogContent className="w-[96vw] max-w-[1100px] max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center mb-4">
              <History className="h-5 w-5 mr-2" />Space Edit History
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {spaceChangelogHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No history available</p>
            ) : (
              spaceChangelogHistory.map((item) => (
                <Card key={item.id} className={`border-l-4 ${item.actions === 'DELETED' ? 'border-l-destructive' : 'border-l-blue-500'}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={item.actions === 'DELETED' ? 'destructive' : item.actions === 'CREATED' ? 'default' : 'secondary'}>
                          {item.actions}
                        </Badge>
                        <Badge variant="outline">{(item as any).Assets?.AssetTypes?.name}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm mb-2">{item.change_description}</p>
                    {item.specifications && Object.keys(item.specifications).length > 0 && (
                      <div className="mt-2 p-2 bg-muted/50 rounded space-y-1">
                        {formatSpecifications(item.specifications)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTimelineDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* All Property History Dialog */}
      <Dialog open={isAllHistoryDialogOpen} onOpenChange={setIsAllHistoryDialogOpen}>
        <DialogContent className="w-[96vw] max-w-[1200px] max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center mb-4">
              <History className="h-5 w-5 mr-2" />Complete Property History
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {changelogHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No history available</p>
            ) : (
              changelogHistory.map((item) => (
                <Card key={item.id} className={`border-l-4 ${item.actions === 'DELETED' ? 'border-l-destructive' : 'border-l-primary/50'}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={item.actions === 'DELETED' ? 'destructive' : item.actions === 'CREATED' ? 'default' : 'secondary'}>
                          {item.actions}
                        </Badge>
                        <Badge variant="outline">{(item as any).Assets?.Spaces?.name}</Badge>
                        <Badge variant="secondary">{(item as any).Assets?.AssetTypes?.name}</Badge>
                        {/* {(item as any).Assets?.deleted && <Badge variant="outline" className="text-muted-foreground">Deleted</Badge>} */}
                      </div>
                      <span className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm mb-2">{item.change_description}</p>
                    {item.specifications && Object.keys(item.specifications).length > 0 && (
                      <div className="mt-2 p-3 bg-muted/50 rounded space-y-1">
                        {formatSpecifications(item.specifications)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAllHistoryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}