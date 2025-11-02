import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@ui/dialog';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { Textarea } from '@ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select';
import { Button } from '@ui/button';
import { Separator } from '@ui/separator';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import FeatureCard from './FeatureCard';

export type DialogMode = 'property' | 'space' | 'asset' | 'feature' | 'createSpace' | 'createAsset' | null;

export default function PropertyDialogController({
  mode,
  isOpen,
  onOpenChange,
  dialogContext,
  formData,
  setFormData,
  saving,
  showFeatureFormAssetEdit,
  setShowFeatureFormAssetEdit,
  showFeatureFormCreateAsset,
  setShowFeatureFormCreateAsset,
  featureFormCreateSpaceIndex,
  setFeatureFormCreateSpaceIndex,
  newSpaceAssets,
  setNewSpaceAssets,
  assetTypes,
  spaceTypes,
  onSave,
}: any) {
  if (!mode) return null;

  // Handler helpers (left intentionally thin - parent manages data persistence)
  return (
    <>
      {mode === 'property' && (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent
            className="overflow-y-auto"
            style={{ width: 'clamp(400px, 33vw, 600px)', height: 'clamp(350px, 33vh, 500px)' }}
          >
            <DialogHeader>
              <DialogTitle>Edit Property Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Property Name</Label>
                <Input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <Label>Total Floor Area (m²)</Label>
                <Input type="number" value={formData.total_floor_area || ''} onChange={(e) => setFormData({ ...formData, total_floor_area: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />Cancel
              </Button>
              <Button onClick={onSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {mode === 'space' && (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="w-[80vw] max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {dialogContext.spaceName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Space Name</Label>
                <Input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label>Space Type</Label>
                <Select value={formData.type} onValueChange={(value: string) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {spaceTypes.map((st: string) => (
                      <SelectItem key={st} value={st}>{st}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />Cancel
              </Button>
              <Button onClick={onSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {mode === 'asset' && (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="w-[90vw] max-w-[90vh] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {dialogContext.assetType}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
              </div>
              <Separator />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-lg">Features / Specifications</Label>
                  <Button size="sm" variant="outline" onClick={() => setShowFeatureFormAssetEdit(true)}>
                    <Plus className="h-3 w-3 mr-1" />Add Feature
                  </Button>
                </div>

                {showFeatureFormAssetEdit && (
                  <div className="mt-2">
                    <FeatureCard
                      className="w-full"
                      onAdd={(name: string, value: string) => {
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
                        onChange={(e) => setFormData({ ...formData, current_specifications: { ...formData.current_specifications, [key]: e.target.value } })}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="sm" onClick={() => {
                        const specs = { ...formData.current_specifications };
                        delete specs[key];
                        setFormData({ ...formData, current_specifications: specs });
                      }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />Cancel
              </Button>
              <Button onClick={onSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {mode === 'createSpace' && (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Space</DialogTitle>
              <DialogDescription>Add a new space with at least one asset and one feature per asset</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Space Name *</Label>
                  <Input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Master Bedroom" />
                </div>
                <div>
                  <Label>Space Type *</Label>
                  <Select value={formData.type} onValueChange={(value: string) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {spaceTypes.map((st: string) => (
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
                  <Button size="sm" onClick={() => {
                    setNewSpaceAssets([...newSpaceAssets, { tempId: `temp-${Date.now()}`, assetTypeId: 0, assetTypeName: '', description: '', specifications: {} }]);
                  }}>
                    <Plus className="h-3 w-3 mr-1" />Add Asset
                  </Button>
                </div>

                {newSpaceAssets.map((asset: any, idx: number) => (
                  <div key={asset.tempId} className="mb-3 relative border rounded-lg">
                    <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => setNewSpaceAssets(newSpaceAssets.filter((_: any, i: number) => i !== idx))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <div className="p-4 space-y-3">
                      <div>
                        <Label>Asset Type *</Label>
                        <Select value={String(asset.assetTypeId)} onValueChange={(value: string) => {
                          const assetType = assetTypes.find((t: any) => t.id === parseInt(value));
                          const updated = [...newSpaceAssets];
                          updated[idx] = { ...asset, assetTypeId: parseInt(value), assetTypeName: assetType?.name || '' };
                          setNewSpaceAssets(updated);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select asset type" />
                          </SelectTrigger>
                          <SelectContent>
                            {assetTypes.map((type: any) => (
                              <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea value={asset.description} onChange={(e) => {
                          const updated = [...newSpaceAssets];
                          updated[idx] = { ...asset, description: e.target.value };
                          setNewSpaceAssets(updated);
                        }} rows={2} />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label>Features * (at least one)</Label>
                          <Button size="sm" variant="outline" onClick={() => { setFeatureFormCreateSpaceIndex(idx); setShowFeatureFormCreateAsset(true); }}>
                            <Plus className="h-3 w-3 mr-1" />Add
                          </Button>
                        </div>

                        {showFeatureFormCreateAsset && featureFormCreateSpaceIndex === idx && (
                          <FeatureCard className="w-full mb-2" onAdd={(name: string, value: string) => {
                            const updated = [...newSpaceAssets];
                            updated[idx] = { ...asset, specifications: { ...asset.specifications, [name]: value } };
                            setNewSpaceAssets(updated);
                            setShowFeatureFormCreateAsset(false);
                            setFeatureFormCreateSpaceIndex(null);
                          }} onCancel={() => { setShowFeatureFormCreateAsset(false); setFeatureFormCreateSpaceIndex(null); }} />
                        )}

                        <div className="space-y-1">
                          {Object.entries(asset.specifications).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2 text-sm">
                              <span className="font-medium">{key}:</span>
                              <span>{String(value)}</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
                                const specs = { ...asset.specifications };
                                delete specs[key];
                                const updated = [...newSpaceAssets];
                                updated[idx] = { ...asset, specifications: specs };
                                setNewSpaceAssets(updated);
                              }}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {Object.keys(asset.specifications).length === 0 && (
                            <p className="text-xs text-destructive">At least one feature required</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {newSpaceAssets.length === 0 && (
                  <div className="text-center p-4 border border-dashed rounded">
                    <p className="text-sm text-muted-foreground">No assets added yet. Click "Add Asset" to get started.</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />Cancel
              </Button>
              <Button onClick={onSave} disabled={!formData.name || newSpaceAssets.length === 0}>
                <Save className="h-4 w-4 mr-2" />Create Space
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {mode === 'createAsset' && (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Asset in {dialogContext.spaceName}</DialogTitle>
              <DialogDescription>Asset must have at least one feature</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Asset Type *</Label>
                <Select value={formData.assetTypeId} onValueChange={(value: string) => setFormData({ ...formData, assetTypeId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((type: any) => (
                      <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
              </div>
              <Separator />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-lg">Features * (at least one)</Label>
                  <Button size="sm" variant="outline" onClick={() => setShowFeatureFormCreateAsset(true)}>
                    <Plus className="h-3 w-3 mr-1" />Add Feature
                  </Button>
                </div>

                {showFeatureFormCreateAsset && (
                  <FeatureCard className="w-full mt-2" onAdd={(name: string, value: string) => {
                    setFormData({ ...formData, specifications: { ...(formData.specifications || {}), [name]: value } });
                    setShowFeatureFormCreateAsset(false);
                  }} onCancel={() => setShowFeatureFormCreateAsset(false)} />
                )}

                <div className="space-y-2">
                  {Object.entries(formData.specifications || {}).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 gap-2 items-center p-2 border rounded">
                      <div className="font-medium">{key}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">{String(value)}</div>
                        <Button variant="ghost" size="sm" onClick={() => {
                          const specs = { ...(formData.specifications || {}) };
                          delete specs[key];
                          setFormData({ ...formData, specifications: specs });
                        }}>
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
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />Cancel
              </Button>
              <Button onClick={onSave} disabled={!formData.assetTypeId || Object.keys(formData.specifications || {}).length === 0}>
                <Save className="h-4 w-4 mr-2" />{saving ? 'Creating...' : 'Create Asset'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
