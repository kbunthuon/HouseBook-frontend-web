import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { ArrowLeft, Edit, Key, Image, History, Save, X, Trash2, Plus, AlertCircle, Download, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { PinManagementDialog } from "./PinManagementDialog";
import { PinTable } from "./PinTable";
import { toast } from "sonner";
import { Property, Asset, Space, Owner } from "@housebookgroup/shared-types";
import { ChangeLog } from "../types/serverTypes";
import { useProperty, usePropertyImages, usePropertyOwners, useAssetTypes, useSpaceTypes, usePropertyJobs, useDeleteJob, queryKeys } from "../hooks/useQueries";

import { fetchJobsInfo, Job, JobAsset, deleteJob } from "../../../backend/JobService";

import {
  updateProperty,
  updateSpace,
  updateAsset,
  deleteSpace,
  deleteAsset,
  createSpace,
  createAsset,
  deleteFeature,
  PropertyUpdate,
  SpaceUpdate,
  AssetUpdate
} from "../../../backend/PropertyEditService";
import { getPropertyHistory, getSpaceHistory } from "../../../backend/ChangeLogService";
import { apiClient } from "../api/wrappers";

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
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isTimelineDialogOpen, setIsTimelineDialogOpen] = useState(false);
  const [isAllHistoryDialogOpen, setIsAllHistoryDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [dialogContext, setDialogContext] = useState<DialogContext>({ mode: null });
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'space' | 'asset' | 'feature', id?: string, name?: string }>({ type: 'asset' });

  // React Query hooks - fetch data in parallel automatically
  const { data: property, isLoading: propertyLoading, error: propertyError } = useProperty(propertyId);
  const { data: imagesResult, isLoading: imagesLoading } = usePropertyImages(propertyId);
  const { data: owners, isLoading: ownersLoading } = usePropertyOwners(propertyId);
  const { data: assetTypesData, isLoading: assetTypesLoading } = useAssetTypes();
  const { data: spaceTypesData, isLoading: spaceTypesLoading } = useSpaceTypes();

  // Merge images into property object
  const propertyWithImages = property ? { ...property, images: imagesResult?.images || [] } : null;

  // React Query hook for jobs
  const { data: jobsData, isLoading: jobsLoading } = usePropertyJobs(propertyId);
  const deleteJobMutation = useDeleteJob();

  const allJobs = jobsData?.jobs || [];
  const allJobAssets = jobsData?.jobAssets || [];

  const [changelogHistory, setChangelogHistory] = useState<ChangeLog[]>([]);
  const [spaceChangelogHistory, setSpaceChangelogHistory] = useState<ChangeLog[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  // Combine loading states
  const loading = propertyLoading || imagesLoading || ownersLoading || assetTypesLoading || spaceTypesLoading;
  const error = propertyError ? (propertyError as Error).message : null;

  // Extract data from React Query results
  const assetTypes = assetTypesData || [];
  const spaceTypes = spaceTypesData || [];

  // Image management states
  const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false);
  const [isImageDeleteDialogOpen, setIsImageDeleteDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImagesToDelete, setSelectedImagesToDelete] = useState<string[]>([]);
  const [isImageConfirmOpen, setIsImageConfirmOpen] = useState(false);
  const [imageAction, setImageAction] = useState<'upload' | 'delete' | 'setSplash'| null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSplashDialogOpen, setIsSplashDialogOpen] = useState(false);
  const [selectedSplashImage, setSelectedSplashImage] = useState<string | null>(null);

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

  // Jobs are now loaded via React Query (usePropertyJobs hook above)

  // Keyboard navigation for image viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage || !propertyWithImages?.images) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToPreviousImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToNextImage();
      } else if (e.key === 'Escape') {
        closeImageViewer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, selectedImageIndex, propertyWithImages?.images]);

  // Map backend-shaped property to the shared Property shape expected by some child components
  const mapToSharedProperty = (bp: Property | null): Property | null => {
    if (!bp) return null;
    console.log("Mapping backend property to shared shape, images are", bp.images);
    return {
      propertyId: bp.propertyId,
      address: bp.address || "",
      description: bp.description || "",
      pin: bp.pin || "",
      name: bp.name,
      type: bp.type || "",
      status: bp.status || "",
      lastUpdated: bp.lastUpdated || "",
      completionStatus: bp.completionStatus || 0,
      totalFloorArea: bp.totalFloorArea,
      spaces: bp.spaces?.map((s: Space) => ({
        id: s.id,
        name: s.name,
        type: s.type || "",
        deleted: s.deleted || false,
        assets: s.assets?.map((a: Asset) => ({
          id: a.id,
          description: a.description || "",
          type: a.type,
          currentSpecifications: a.currentSpecifications || {},
          deleted: a.deleted || false,
          assetTypes: a.assetTypes,
        })) || [],
      })) || [],
      images: bp.images || [],
      createdAt: bp.createdAt || "",
      splashImage: bp.splashImage,
    };
  };

  // Refetch all property data after mutations
  const refetchPropertyData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.property(propertyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.propertyImages(propertyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.propertyOwners(propertyId) });
    queryClient.invalidateQueries({ queryKey: ['jobs', propertyId] }); // Reload jobs via React Query
  };

  // PROPERTY EDIT
  const handleEditProperty = () => {
    setDialogContext({ mode: 'property' });
    setFormData({
      name: propertyWithImages?.name || '',
      description: propertyWithImages?.description || '',
      address: propertyWithImages?.address || '',
      type: 'Townhouse',
      totalFloorArea: propertyWithImages?.totalFloorArea || 0
    });
    setIsDialogOpen(true);
  };

  // SPACE EDIT
  const handleEditSpace = (spaceId: string, spaceName: string) => {
    const space = propertyWithImages?.spaces?.find((s: Space) => s.id === spaceId);
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
    const space = propertyWithImages?.spaces?.find((s: Space) => s.id === spaceId);
    const asset = space?.assets?.find((a: Asset) => a.id === assetId);
    console.log("handleEditAssets: spaceId: ", spaceId, ", spaceName: ", spaceName, ", assetId: ", assetId, ", assetType: ", assetType);
    setDialogContext({ mode: 'asset', spaceId, spaceName, assetId, assetType });
    setFormData({
      description: asset?.description || '',
      current_specifications: asset?.currentSpecifications || {}
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
      refetchPropertyData();
      setIsDialogOpen(false);
      setDialogContext({ mode: null });
    } catch (error) {
      const err = error as Error;
      console.error("Error saving:", err);

      toast.error(`Failed to save: ${err.message || 'Unknown error'}`);
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

      refetchPropertyData();
    } catch (error) {
      const err = error as Error;
      console.error("Error deleting:", err);
      console.log("Delete target: ", deleteTarget);
      toast.error(`Failed to delete: ${err.message || 'Unknown error'}`);
    }
  };

  // History handlers
  const handleShowTimeline = async (spaceName: string, spaceId?: string) => {
    console.log("handleShowTimeline spaceId: ", spaceId);
    console.log("handleShowTimeline spaceName: ", spaceName);
    if (spaceId) {
      try {
        const history = await apiClient.getSpaceHistory(spaceId);
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
      const history = await apiClient.getPropertyHistory(propertyId);
      setChangelogHistory(history);
    } catch (error) {
      console.error("Failed to load property history:", error);
      setChangelogHistory([]);
    }
    setIsAllHistoryDialogOpen(true);
  };

  // PIN handlers - Using React Query mutations
  const handleSavePin = async (job: Job, assetIds?: string[]) => {
    queryClient.invalidateQueries({ queryKey: ['jobs', propertyId] });
    toast.success("Job saved successfully");
  };

  const handleSaveJobEdits = async (updatedJob: Job) => {
    queryClient.invalidateQueries({ queryKey: ['jobs', propertyId] });
    toast.success("Job updated successfully");
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await deleteJobMutation.mutateAsync(jobId);
      toast.success("Job deleted successfully");
    } catch (error) {
      toast.error("Failed to delete job");
    }
  };

  const handleDownloadQRPDF = async () => {
    try {
      // Load jsPDF from CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      
      // @ts-ignore - jsPDF is loaded globally
      const { jsPDF } = window.jspdf;
      
      const doc = new jsPDF();
      
      // Add property information
      doc.setFontSize(20);
      doc.text(propertyWithImages?.name || 'Property', 20, 20);

      doc.setFontSize(12);
      doc.text(`Address: ${propertyWithImages?.address || 'N/A'}`, 20, 35);

      if (owners && owners.length > 0) {
        const ownerText = owners.length > 1 ? 'Owners:' : 'Owner:';
        const ownerNames = owners.map((o: Owner) => `${o.firstName} ${o.lastName}`).join(", ");
        doc.text(`${ownerText} ${ownerNames}`, 20, 45);
      }

      doc.text(`Total Floor Area: ${propertyWithImages?.totalFloorArea || 0}m²`, 20, 55);
      
      // Add QR code
      if (qrCodeRef.current) {
        const qrImageData = qrCodeRef.current.toDataURL('image/png');
        doc.addImage(qrImageData, 'PNG', 20, 70, 80, 80);
      }
      
      doc.setFontSize(10);
      doc.text(`Property ID: ${propertyId}`, 20, 160);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 167);
      
      // Save the PDF
      doc.save(`${propertyWithImages?.name || 'property'}-QR.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  // Image viewer navigation handlers
  const openImageViewer = (url: string, index: number) => {
    setSelectedImage(url);
    setSelectedImageIndex(index);
  };

  const closeImageViewer = () => {
    setSelectedImage(null);
    setSelectedImageIndex(-1);
  };

  const navigateToNextImage = () => {
    if (!propertyWithImages?.images || selectedImageIndex === -1) return;
    const nextIndex = (selectedImageIndex + 1) % propertyWithImages.images.length;
    setSelectedImageIndex(nextIndex);
    setSelectedImage(propertyWithImages.images[nextIndex]);
  };

  const navigateToPreviousImage = () => {
    if (!propertyWithImages?.images || selectedImageIndex === -1) return;
    const prevIndex = selectedImageIndex === 0 ? propertyWithImages.images.length - 1 : selectedImageIndex - 1;
    setSelectedImageIndex(prevIndex);
    setSelectedImage(propertyWithImages.images[prevIndex]);
  };

  // Image management handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpenUploadDialog = () => {
    setSelectedFiles([]);
    setIsImageUploadDialogOpen(true);
  };

  const handleOpenDeleteDialog = () => {
    setSelectedImagesToDelete([]);
    setIsImageDeleteDialogOpen(true);
  };

  const handleToggleImageForDeletion = (url: string) => {
    setSelectedImagesToDelete(prev => 
      prev.includes(url) 
        ? prev.filter(u => u !== url)
        : [...prev, url]
    );
  };

  const handleConfirmImageAction = (action: 'upload' | 'delete' | 'setSplash') => {
    setImageAction(action);
    setIsImageUploadDialogOpen(false);
    setIsImageDeleteDialogOpen(false);
    setIsSplashDialogOpen(false);
    setIsImageConfirmOpen(true);
  };

  const handleFinalImageAction = async () => {
    setIsImageConfirmOpen(false);
    
    try {
      console.log("Performing image action:", imageAction, "selectedSplashImage:", selectedSplashImage);
      if (imageAction === 'upload' && selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          await apiClient.uploadPropertyImage(propertyId, file);
        }
        toast.success(`${selectedFiles.length} image(s) uploaded successfully`);
        setSelectedFiles([]);
        
      } else if (imageAction === 'delete' && selectedImagesToDelete.length > 0) {
        await apiClient.deletePropertyImages(selectedImagesToDelete);
        toast.success(`${selectedImagesToDelete.length} image(s) deleted successfully`);
        setSelectedImagesToDelete([]);
      } else if (imageAction === 'setSplash' && selectedSplashImage) {
        await apiClient.updatePropertySplashImage(selectedSplashImage);
        toast.success(`Splash image updated successfully`);
      }

      refetchPropertyData();
      setImageAction(null);
    } catch (error) {
      const err = error as Error;
      console.error("Image operation failed:", err);
      toast.error(`Failed: ${err.message || 'Unknown error'}`);
    }
  };

  const handleOpenSplashDialog = () => {
    // Pre-select the current splash image when the dialog opens
    setSelectedSplashImage(propertyWithImages?.splashImage || null);
    setIsSplashDialogOpen(true);
  };

  const handleCloseSplashDialog = () => {
    setIsSplashDialogOpen(false);
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
                  <span className="font-semibold">{asset.assetTypes.name}</span>
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditAsset(spaceId, spaceName, asset.id, asset.assetTypes.name)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteAsset(asset.id, asset.assetTypes.name)}
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
            
            {asset.currentSpecifications && Object.keys(asset.currentSpecifications).length > 0 ? (
              <div className="space-y-1 bg-muted/30 p-2 rounded">
                {Object.entries(asset.currentSpecifications).map(([key, value]) => (
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
          <DialogContent
            className="overflow-y-auto"
            style={{
              width: 'clamp(400px, 33vw, 600px)',
              height: 'clamp(350px, 33vh, 500px)',
            }}
          >
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
                            const assetType = assetTypes.find((t: any) => t.id === parseInt(value));
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
                </div>
                
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
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Properties
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="default">{(propertyWithImages && (propertyWithImages as any).status) ?? "Active"}</Badge>
          <Button variant="outline" size="sm" onClick={handleEditProperty}>
            <Edit className="h-4 w-4 mr-2" />Edit Property
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 min-w-0">
          <h1 className="break-words">{propertyWithImages?.name ?? "Property"}</h1>
          <p className="text-muted-foreground text-lg break-words">{propertyWithImages?.description}</p>
          <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="break-words">
              {owners && owners.length > 0 ? (
                <>
                  Owner{owners.length > 1 ? "s" : ""}:{" "}
                  {owners.map((o: Owner) => `${o.firstName} ${o.lastName}`).join(", ")}
                </>
              ) : (
                "Owner: N/A"
              )}
            </span>
            <span>•</span>
            <span className="break-words">{propertyWithImages?.address}</span>
            <span>•</span>
            <span>{propertyWithImages?.totalFloorArea ?? 0}m²</span>
          </div>
          <div className="pt-2 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleShowAllPropertyHistory}>
              <History className="h-3 w-3 mr-1" />View All History
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadQRPDF}>
              <Download className="h-3 w-3 mr-1" />Download QR PDF
            </Button>
          </div>
        </div>

        <div className="space-y-2 flex flex-col items-end">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center w-64">
            <QRCodeCanvas ref={qrCodeRef} value={propertyId} size={200} level="H" />
          </div>
          <Button onClick={() => setIsPinDialogOpen(true)} className="w-64" size="sm">
            Create New Job
          </Button>
        </div>
      </div>

      <Separator />

      {/* Property Images */}
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-4">
          <CardTitle className="flex items-center">
            <Image className="h-5 w-5 mr-2" />
            Property Images
          </CardTitle>
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenUploadDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Images
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenDeleteDialog} disabled={!propertyWithImages?.images || propertyWithImages.images.length === 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Images
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenSplashDialog} disabled={!propertyWithImages?.images || propertyWithImages.images.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Select splash image
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {propertyWithImages?.images && propertyWithImages.images.length > 0 ? (
            <div className="overflow-x-auto py-4">
              <div className="flex gap-6 w-max">
                {propertyWithImages.images.map((url: string, idx: number) => (
                  <div
                    key={idx}
                    className="shrink-0 bg-gray-50 rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col cursor-pointer"
                    style={{ width: '320px', height: '320px' }}
                    onClick={() => openImageViewer(url, idx)}
                  >
                    {/* property image - fixed 320px height (full card) */}
                    <div className="w-full bg-muted flex items-center justify-center overflow-hidden" style={{ height: '320px' }}>
                      <img
                        src={url}
                        alt={`Property Image ${idx + 1}`}
                        className="w-full h-full"
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No images available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Viewer Overlay */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
          onClick={closeImageViewer}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes imageZoom {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>

          {/* Navigation Button - Previous */}
          {propertyWithImages?.images && propertyWithImages.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateToPreviousImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all z-10"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Image Container */}
          <div
            className="relative flex items-center justify-center p-4"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              animation: 'imageZoom 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Property Image"
              className="max-w-full max-h-full object-contain shadow-2xl"
              style={{
                borderRadius: '16px',
                maxWidth: '90vw',
                maxHeight: '90vh',
              }}
            />
          </div>

          {/* Navigation Button - Next */}
          {propertyWithImages?.images && propertyWithImages.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateToNextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all z-10"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={closeImageViewer}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all z-10"
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Image Counter */}
          {propertyWithImages?.images && propertyWithImages.images.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-2 rounded-full text-sm z-10"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              {selectedImageIndex + 1} / {propertyWithImages.images.length}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Spaces & Assets</h2>
        <Button onClick={handleCreateSpace}>
          <Plus className="h-4 w-4 mr-2" />Create New Space
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {propertyWithImages?.spaces?.filter((space: Space) => !space.deleted).map((space: Space) => (
          <SpecificationSection
            key={space.id}
            title={space.name}
            spaceId={space.id}
            spaceName={space.name}
            assets={(space.assets ?? []).filter((asset: Asset) => !asset.deleted).map((asset: Asset) => ({
              id: asset.id,
              description: asset.description,
              discipline: asset.assetTypes?.discipline ?? "",
              currentSpecifications: asset.currentSpecifications ?? {},
              assetTypes: {
                id: asset.assetTypes?.id ?? "",
                name: asset.assetTypes?.name ?? "",
                discipline: asset.assetTypes?.discipline ?? "",
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
            property={propertyWithImages}
            jobs={allJobs}
            jobAssets={allJobAssets}
            onDeleteJob={handleDeleteJob}
            onSaveJobEdits={handleSaveJobEdits}
          />
        </CardContent>
      </Card>

      <PinManagementDialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen} propertyId={propertyId} property={mapToSharedProperty(propertyWithImages)} onSave={handleSavePin} />

      {renderDialog()}

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
                    <p className="text-sm mb-2">{item.changeDescription}</p>
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
                      </div>
                      <span className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm mb-2">{item.changeDescription}</p>
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

      {/* Image Upload Dialog */}
      <Dialog open={isImageUploadDialogOpen} onOpenChange={setIsImageUploadDialogOpen}>
        <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
            <DialogDescription>Select images to upload to this property</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Choose Images
            </Button>
            
            {selectedFiles.length > 0 ? (
              <div className="grid grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative border rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleRemoveSelectedFile(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="p-2 bg-muted">
                      <p className="text-xs truncate">{file.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                No images selected
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageUploadDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />Cancel
            </Button>
            <Button 
              onClick={() => { setImageAction('upload'); handleConfirmImageAction('upload'); }} 
              disabled={selectedFiles.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Delete Dialog */}
      <Dialog open={isImageDeleteDialogOpen} onOpenChange={setIsImageDeleteDialogOpen}>
        <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delete Images</DialogTitle>
            <DialogDescription>Select images to delete from this property</DialogDescription>
          </DialogHeader>


          <div className="space-y-4">
            {propertyWithImages?.images && propertyWithImages.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-2">
                {propertyWithImages.images.map((url: string, idx: number) => (
                  <div 
                    key={idx} 
                    className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedImagesToDelete.includes(url) 
                        ? 'border-destructive ring-2 ring-destructive' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                    onClick={() => handleToggleImageForDeletion(url)}
                  >
                    <img
                      src={url}
                      alt={`Image ${idx + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    {selectedImagesToDelete.includes(url) && (
                      <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                        <div className="bg-destructive text-white rounded-full p-2">
                          <Trash2 className="h-6 w-6" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No images available
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDeleteDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => { setImageAction('delete'); handleConfirmImageAction('delete'); }} 
              disabled={selectedImagesToDelete.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedImagesToDelete.length > 0 && `(${selectedImagesToDelete.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Splash image selection*/}
      <Dialog open={isSplashDialogOpen} onOpenChange={setIsSplashDialogOpen}>
        <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Splash Image</DialogTitle>
            <DialogDescription>Choose an image to use as the main property splash image</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {propertyWithImages?.images && propertyWithImages.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-2">
                {propertyWithImages.images.map((imgUrl: string, idx: number) => (
                  <div
                    key={imgUrl} // use url as key for uniqueness
                    className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedSplashImage === imgUrl
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedSplashImage(imgUrl)}
                  >
                    <img
                      src={imgUrl}
                      alt={`Property Image ${idx + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    {selectedSplashImage === imgUrl && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-white rounded-full p-2">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No images available
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSplashDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              // Calls the handler, explicitly passing the 'setSplash' action.
              onClick={() => handleConfirmImageAction('setSplash')} 
              disabled={!selectedSplashImage}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Set as Splash Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Image Action Confirmation Dialog */}
      <AlertDialog open={isImageConfirmOpen} onOpenChange={setIsImageConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {/* CORRECTED TITLE LOGIC */}
              {imageAction === 'upload'
                ? 'Confirm Image Upload'
                : imageAction === 'delete'
                ? 'Confirm Image Deletion'
                : 'Confirm Splash Image Change'}
            </AlertDialogTitle>
            
            <AlertDialogDescription>
              {/* CORRECTED DESCRIPTION LOGIC */}
              {imageAction === 'upload'
                ? `Are you sure you want to upload ${selectedFiles.length} image(s)?`
                : imageAction === 'delete'
                ? `Are you sure you want to delete ${selectedImagesToDelete.length} image(s)? This action cannot be undone.`
                : 'Are you sure you want to set the selected image as the new property splash image?'} 
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            {/* Retain the setImageAction(null) on Cancel to clear the state */}
            <AlertDialogCancel onClick={() => setImageAction(null)}>Cancel</AlertDialogCancel>
            
            <AlertDialogAction onClick={handleFinalImageAction}>
              {/* CORRECTED ACTION BUTTON TEXT */}
              {imageAction === 'upload'
                ? 'Upload'
                : imageAction === 'delete'
                ? 'Delete'
                : imageAction === 'setSplash'
                ? 'Set Splash Image' // User-friendly text
                : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}