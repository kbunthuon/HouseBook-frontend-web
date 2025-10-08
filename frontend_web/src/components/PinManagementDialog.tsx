import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchAssetTypesGroupedByDiscipline } from "../../../backend/FetchAssetTypes";
import { insertJobsInfo, updateJobInfo, Job, JobStatus, fetchJobAssets } from "../../../backend/JobService";
import { Property } from "../types/serverTypes";

interface PinManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (job: Job, assetIds?: string[]) => void;
  propertyId: string;
  property: Property | null;
  job?: Job | null;
}

export function PinManagementDialog({ open, onOpenChange, onSave, propertyId, property, job }: PinManagementDialogProps) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [assetTypeMap, setAssetTypeMap] = useState<Record<string, string[]>>({});
  const [jobData, setJobData] = useState<Job>({
    id: null,
    property_id: propertyId,
    tradie_id: null,
    title: "",
    status: JobStatus.PENDING,
    created_at: "",
    end_time: null,
    expired: false,
    pin: "",
  });

  const [openSpaces, setOpenSpaces] = useState<Record<string, boolean>>({});
  const isEdit = !!job?.id;

  // Load job data and assets for edit mode
  useEffect(() => {
    const loadJobData = async () => {
      if (job && open) {
        setJobData(job);
        
        if (job.id) {
          try {
            const existingAssets = await fetchJobAssets(job.id);
            const assetIds = existingAssets.map(asset => asset.asset_id);
            setSelectedAssets(assetIds);
            
            // Convert asset IDs back to UI keys
            const uiKeys: string[] = [];
            propertySections.forEach(section => {
              section.assets.forEach(asset => {
                if (assetIds.includes(asset.id)) {
                  const uiKey = `${section.name}: ${asset.type}`;
                  uiKeys.push(uiKey);
                }
              });
            });
            
            setSelectedSections(syncParentsFromChildren(new Set(uiKeys)));
            updateDisciplineSelections(uiKeys);
          } catch (error) {
            console.error("Failed to load job assets:", error);
          }
        }
      } else if (!job) {
        setJobData({
          id: null,
          property_id: propertyId,
          tradie_id: null,
          title: "",
          status: JobStatus.PENDING,
          created_at: "",
          end_time: null,
          expired: false,
          pin: "",
        });
      }
    };

    loadJobData();
  }, [job, open, propertyId]);

  // Reset selections for new job
  useEffect(() => {
    if (open && !job) {
      setSelectedSections([]);
      setSelectedDisciplines([]);
      setSelectedAssets([]);
    }
  }, [open, job]);

  const updateJobData = <K extends keyof Job>(field: K, value: Job[K]) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    fetchAssetTypesGroupedByDiscipline().then(setAssetTypeMap);
  }, []);

  const toggleSpace = (name: string) => setOpenSpaces(prev => ({ ...prev, [name]: !prev[name] }));

  type PropertySection = { name: string; assets: { id: string; type: string }[]; };
  const propertySections: PropertySection[] =
    (property?.spaces ?? []).map(s => ({
      name: s.name,
      assets: (s.assets ?? []).map(a => ({ id: a.asset_id, type: a.type })),
    }));

  const assetKeyToId: Record<string, string> = {};
  for (const section of propertySections) {
    for (const asset of section.assets) {
      const uiKey = `${section.name}: ${asset.type}`;
      assetKeyToId[uiKey] = asset.id;
    }
  }

  const norm = (s: string) => s.trim().toLowerCase();

  const assetTypeToUIKeys = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of propertySections) {
      for (const a of s.assets) {
        const uiKey = `${s.name}: ${a.type}`;
        const k = norm(a.type);
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(uiKey);
      }
    }
    return map;
  }, [propertySections]);

  const uiKeysForDiscipline = (disciplineName: string) => {
    const types = assetTypeMap[disciplineName] ?? [];
    const keys: string[] = [];
    types.forEach(t => {
      const arr = assetTypeToUIKeys.get(norm(t)) ?? [];
      keys.push(...arr);
    });
    return keys;
  };

  // NEW: Function to update discipline selections based on current UI keys
  const updateDisciplineSelections = (currentUIKeys: string[]) => {
    const newSelectedDisciplines: string[] = [];
    
    Object.keys(assetTypeMap).forEach(disciplineName => {
      const disciplineKeys = uiKeysForDiscipline(disciplineName);
      const selectedInDiscipline = disciplineKeys.filter(key => currentUIKeys.includes(key));
      
      if (disciplineKeys.length > 0 && selectedInDiscipline.length === disciplineKeys.length) {
        newSelectedDisciplines.push(disciplineName);
      }
    });
    
    setSelectedDisciplines(newSelectedDisciplines);
  };

  const handleDisciplineToggle = (disciplineName: string, checked: boolean) => {
    const thisKeys = new Set(uiKeysForDiscipline(disciplineName));

    if (checked) {
      setSelectedDisciplines(prev => [...new Set([...prev, disciplineName])]);
      setSelectedSections(prev => {
        const next = new Set(prev);
        thisKeys.forEach(k => next.add(k));
        return syncParentsFromChildren(next);
      });

      thisKeys.forEach(k => updateSelectedAssets(k, true));
      return;
    }

    setSelectedDisciplines(prev => prev.filter(d => d !== disciplineName));
    setSelectedSections(prev => {
      const next = new Set(prev);
      const keepByOthers = new Set<string>();

      selectedDisciplines
        .filter(d => d !== disciplineName)
        .forEach(d => uiKeysForDiscipline(d).forEach(k => keepByOthers.add(k)));

      thisKeys.forEach(k => {
        if (!keepByOthers.has(k)) {
          next.delete(k);
          updateSelectedAssets(k, false);
        }
      });

      return syncParentsFromChildren(next);
    });
  };

  const isChildKey = (key: string) => key.includes(": ");
  const childKey = (space: string, asset: string) => `${space}: ${asset}`;

  const childKeysForSpace = (spaceName: string) =>
    (propertySections.find(s => s.name === spaceName)?.assets ?? []).map(a => childKey(spaceName, a.type));

  const updateSelectedAssets = (changedKey: string, checked: boolean) => {
    setSelectedAssets(prev => {
      const next = new Set(prev);

      if (isChildKey(changedKey)) {
        const assetId = assetKeyToId[changedKey];
        if (!assetId) return [...next];
        if (checked) next.add(assetId);
        else next.delete(assetId);
      } else {
        const kids = childKeysForSpace(changedKey);
        kids.forEach(k => {
          const assetId = assetKeyToId[k];
          if (!assetId) return;
          if (checked) next.add(assetId);
          else next.delete(assetId);
        });
      }

      return [...next];
    });
  };

  const applyParentToggle = (spaceName: string, checked: boolean) => {
    const kids = childKeysForSpace(spaceName);
    setSelectedSections(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(spaceName);
        kids.forEach(k => next.add(k));
      } else {
        next.delete(spaceName);
        kids.forEach(k => next.delete(k));
      }
      // Update discipline selections after space toggle
      updateDisciplineSelections([...next]);
      return [...next];
    });
    updateSelectedAssets(spaceName, checked);
  };

  const syncParentsFromChildren = (keys: Set<string>) => {
    for (const s of propertySections) {
      const kids = childKeysForSpace(s.name);
      const selectedCount = kids.filter(k => keys.has(k)).length;
      if (kids.length > 0 && selectedCount === kids.length) keys.add(s.name);
      else keys.delete(s.name);
    }
    return [...keys];
  };

  const handleSectionChange = (section: string, checked: boolean) => {
    if (!isChildKey(section)) {
      applyParentToggle(section, checked);
      return;
    }

    const [spaceName] = section.split(": ");

    setSelectedSections(prev => {
      const next = new Set(prev);
      if (checked) next.add(section);
      else next.delete(section);

      const kids = childKeysForSpace(spaceName);
      const allKidsSelected = kids.every(k => next.has(k));

      if (allKidsSelected) next.add(spaceName);
      else next.delete(spaceName);

      updateSelectedAssets(section, checked);
      
      // NEW: Update discipline selections after section change
      updateDisciplineSelections([...next]);
      
      return [...next];
    });
  };

  const isSpaceIndeterminate = (spaceName: string) => {
    const kids = childKeysForSpace(spaceName);
    const picked = kids.filter(k => selectedSections.includes(k)).length;
    return picked > 0 && picked < kids.length;
  };

  const localInputValue = (d = new Date()) => {
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60_000);
    return local.toISOString().slice(0, 16);
  };

  const onSaveClick = async () => {
    try {
      setSaving(true);

      const payload = { ...jobData, property_id: propertyId };

      if (isEdit && job?.id) {
        const [updatedJob, updatedAssets] = await updateJobInfo(payload, selectedAssets);
        onSave(updatedJob, updatedAssets?.map(a => a.asset_id));
      } else {
        const [insertedJob, insertedAssets] = await insertJobsInfo(payload, selectedAssets);
        onSave(insertedJob, insertedAssets?.map(a => a.asset_id));
      }

      onOpenChange(false);
      navigate(`/owner/properties/${propertyId}#access-pins`);
    } catch (e: any) {
      console.error("Error saving job:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedSections([]);
      setSelectedDisciplines([]);
      setSelectedAssets([]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full sm:w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Job" : "Create a New Job"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="title"
              value={jobData.title}
              onChange={(e) => updateJobData("title", e.target.value)}
              placeholder="e.g. Painting walls in downstairs bedroom"
              required
            />
          </div>

          <div>
            <Label htmlFor="endTime">Pin Expiry</Label>
            <input
              id="endTime"
              type="datetime-local"
              className="mt-1 w-full rounded-md border px-3 py-2"
              min={localInputValue()}
              value={jobData.end_time ? jobData.end_time.slice(0, 16) : ""}
              onChange={(e) => updateJobData("end_time", e.target.value)}
            />
          </div>

          {/* Disciplines Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Label>Select disciplines for this PIN:</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(assetTypeMap).map(d => (
                <label key={d} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedDisciplines.includes(d)}
                    onCheckedChange={(c: boolean) => handleDisciplineToggle(d, c)}
                  />
                  <span className="text-sm">{d}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sections Access Control */}
          <div className="space-y-3">
            <Label>Select accessible sections for this PIN:</Label>
            <div className="flex flex-col gap-3 max-h-[35vh] overflow-y-auto justify-items-start">
              {propertySections.map((space) => {
                const expanded = !!openSpaces[space.name];

                return (  
                  <div key={space.name} className="w-full">
                    {/* Parent checkbox */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={space.name}
                        checked={
                          selectedSections.includes(space.name)
                            ? true
                            : isSpaceIndeterminate(space.name)
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={(checked: boolean) => handleSectionChange(space.name, checked)}
                      />
                      <Label htmlFor={space.name} className="text-sm font-medium cursor-pointer">
                        {space.name}
                      </Label>
                      <button
                        type="button"
                        onClick={() => toggleSpace(space.name)}
                        aria-expanded={expanded}
                        aria-controls={`children-${space.name}`}
                        className="p-1 rounded hover:bg-muted"
                      >
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Child checkbox */}
                    <div id={`children-${space.name}`} className={expanded ? "mt-1 pl-6 space-y-1" : "hidden"}>
                      {space.assets.map((asset) => {
                        const key = `${space.name}: ${asset.type}`;
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <Checkbox
                              id={key}
                              checked={selectedSections.includes(key)}
                              onCheckedChange={(checked: boolean) => handleSectionChange(key, checked)}
                            />
                            <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                              {asset.type}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSaveClick} disabled={saving}>
            {saving ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save Changes" : "Create Job")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}