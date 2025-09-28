import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { RefreshCw, Space } from "lucide-react";
import { useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPropertyDetails } from "../../../backend/FetchData";
import { fetchAssetTypesGroupedByDiscipline } from "../../../backend/FetchAssetTypes";
import { insertJobsInfo, Job, JobStatus } from "../../../backend/JobService";
import { Property } from "../types/serverTypes"

interface PinManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (pin: string, sections: string[]) => void;
  propertyId: string;
}

export function PinManagementDialog({ open, onOpenChange, onSave, propertyId }: PinManagementDialogProps) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [generatedPin, setGeneratedPin] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [assetTypeMap, setAssetTypeMap] = useState<Record<string, string[]>>({});
  const [jobData, setJobData] = useState<Job>({
    id: "",
    property_id: "",
    tradie_id: null,
    title: "",
    status: JobStatus.PENDING,
    created_at: "",
    end_time: null,
    expired: false,
    pin: "",
  });

  // Updating jobData, keeping info already in it the same and enforcing types eg with status. Status requires type JobStatus
  const updateJobData = <K extends keyof Job>(field: K, value: Job[K]) => {
    setJobData((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  // Fetch the asset type mapping
  useEffect(() => {
    fetchAssetTypesGroupedByDiscipline().then(setAssetTypeMap);
  }, []);

  // NOTE: repetitive fetch code... should I move this to PropertyDetails or keep it separate??

  const [property, setProperty] = useState<Property | null>(null);
  const [openSpaces, setOpenSpaces] = useState<Record<string, boolean>>({});

  const toggleSpace = (name: string) => setOpenSpaces((prev) => ({ ...prev, [name]: !prev[name] }));

  // Fetching property details (What is this?)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // console.log("Fetching details for property ID:", propertyId);
        const result = await getPropertyDetails(propertyId);
        if (result) {
          setProperty(result);
        }

      } catch (err: any) {
        console.error(err.message);
        return;
      }
    };

    fetchData();
  }, [propertyId]); // re-run if the propertyId changes

  // Check what the Spaces are for this property
  type PropertySection = { name: string; assets: { id: string; type: string }[]; };
  const propertySections: PropertySection[] =
  (property?.spaces ?? []).map(s => ({
    name: s.name,
    assets: (s.assets ?? []).map(a => ({
      id: a.asset_id, 
      type: a.type,
    })),
  }));

  // Mapping asset key to id
  const assetKeyToId: Record<string, string> = {};
  for (const section of propertySections) {
    for (const asset of section.assets) {
      const uiKey = `${section.name}: ${asset.type}`;
      assetKeyToId[uiKey] = asset.id;
    }
  }

  const norm = (s: string) => s.trim().toLowerCase();

  // Building a list of keys of string type
  // Each element in the list is of the format "space_name : asset_type"
  // ["space_name : asset_type", "space_name : asset_type", ...]
  // map is in the format {"asset_type" : "space_name : asset_type", ...}
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

  /**
   * 
   * @param disciplineName : string
   * @returns 
   * keys : string[]  =>  has the format of ["space_name : asset_type", ...]
   */
  const uiKeysForDiscipline = (disciplineName: string) => {
    const types = assetTypeMap[disciplineName] ?? [];
    const keys: string[] = [];
    types.forEach(t => {
      const arr = assetTypeToUIKeys.get(norm(t)) ?? [];
      keys.push(...arr);
    });
    // console.log("keys: ", keys);
    return keys;
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

  // helpers
  const isChildKey = (key: string) => key.includes(": ");
  const childKey = (space: string, asset: string) => `${space}: ${asset}`;

  const childKeysForSpace = (spaceName: string) =>
  (propertySections.find(s => s.name === spaceName)?.assets ?? [])
    .map(a => childKey(spaceName, a.type));


  const getAssetsForSpace = (spaceName: string) =>
    propertySections.find(s => s.name === spaceName)?.assets ?? [];

  const updateSelectedAssets = (changedKey: string, checked: boolean) => {
    setSelectedAssets(prev => {
      const next = new Set(prev);

      if (isChildKey(changedKey)) {
        // child = asset
        const assetId = assetKeyToId[changedKey];
        if (!assetId) return [...next]; // safety

        if (checked) next.add(assetId);
        else next.delete(assetId);

      } else {
        // parent = space
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




  /** Toggle a whole space exactly like clicking the parent checkbox */
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
      return [...next];
    });
    updateSelectedAssets(spaceName, checked);
  };


const syncParentsFromChildren = (keys: Set<string>) => {
  for (const s of propertySections) {
    const kids = childKeysForSpace(s.name);
    const selectedCount = kids.filter(k => keys.has(k)).length;

    if (kids.length > 0 && selectedCount === kids.length) {
      // all children selected -> parent ON
      keys.add(s.name);
    } else {
      // none or partial -> parent OFF (indeterminate is visual only)
      keys.delete(s.name);
    }
  }
  return [...keys];
};

// --- unified handler (parent + child) ---
const handleSectionChange = (section: string, checked: boolean) => {
  // Parent clicked: act on parent + all children.
  if (!isChildKey(section)) {
    applyParentToggle(section, checked);
    return;
  }

  // Child clicked: update child only, then recalc parent state.
  const [spaceName] = section.split(": ");

  setSelectedSections(prev => {
    const next = new Set(prev);

    if (checked) next.add(section);
    else next.delete(section);

    // Recalculate the parent: checked only if ALL children are selected.
    const kids = childKeysForSpace(spaceName);
    const allKidsSelected = kids.every(k => next.has(k));

    if (allKidsSelected) {
      // Imitate clicking the parent ON (keeps behavior identical to parent toggle)
      next.add(spaceName);
      // (kids are already all selected by definition)
    } else {
      // Any child missing -> parent must be OFF
      next.delete(spaceName);
    }

    updateSelectedAssets(section, checked);

    return [...next];
  });
};

  const isSpaceIndeterminate = (spaceName: string) => {
    const kids = childKeysForSpace(spaceName);
    const picked = kids.filter(k => selectedSections.includes(k)).length;
    return picked > 0 && picked < kids.length;
  };

  const [endAt, setEndAt] = useState<string>("");  // e.g. "2025-09-26T14:30"

  // for <input type="datetime-local"> min/default value in LOCAL time
  function localInputValue(d = new Date()) {
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60_000);
    return local.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
  }

  function oneHourFromNowISO() {
    return new Date(Date.now() + 60 * 60 * 1000).toISOString();
  }

  const onCreate = async () => {
    // console.log("[onCreate] start");
    try {
      setSaving(true);
  
      // console.log("[onCreate] inserting job:", jobData);
      
      

    
      // Setting the propertyId
      const newJobData = { ...jobData, property_id: propertyId }; // merge property_id
      console.log("newJobData propertyId: ", newJobData.property_id);
      // Inserting the data to the Jobs table
      const insertedJobInfo = await insertJobsInfo(newJobData, selectedAssets);
  
      console.log("[onCreate] insert OK");
      onOpenChange(false);                       // close dialogs
      navigate(`/owner/properties/${propertyId}#access-pins`);
    } catch (e: any) {
      // PostgREST returns rich fields — surface them:
      console.error("[onCreate] insert error", {
        message: e?.message,
        details: e?.details,
        hint: e?.hint,
        code: e?.code,
      });
      console.error(e.message);
    } finally {
      setSaving(false);
      console.log("[onCreate] done");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setGeneratedPin("");
      setSelectedSections([]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full sm:w-[400px]">
        <DialogHeader>
          <DialogTitle>Create a New Job</DialogTitle>
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
              min={localInputValue()}          // can’t pick a past time
              value={jobData.end_time || undefined}
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
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto justify-items-start">
              
              {propertySections.map((space) => {
              const expanded = !!openSpaces[space.name];
              const parentChecked = selectedSections.includes(space.name);
              const indeterminate = isSpaceIndeterminate(space.name);

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
                      onCheckedChange={(checked : boolean) => 
                        handleSectionChange(space.name, checked)
                      }
                    />
                    <Label 
                      htmlFor={space.name}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {space.name}
                    </Label>
                    <button
                      type="button"
                      onClick={() => toggleSpace(space.name)}
                      aria-expanded={expanded}
                      aria-controls={`children-${space.name}`}
                      className="p-1 rounded hover:bg-muted"
                    >
                      {expanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {/* Child checkbox */}
                  <div id={`children-${space.name}`}
                    className={expanded ? "mt-1 pl-6 space-y-1" : "hidden"}>
                    {space.assets.map((asset) => {
                      const key = `${space.name}: ${asset.type}`;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <Checkbox
                            id={key}
                            checked={selectedSections.includes(key)}
                            onCheckedChange={(checked: boolean) =>
                              handleSectionChange(key, checked)
                            }
                          />
                          <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                            {asset.type}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={saving}>
            {saving ? "Creating…" : "Create Job"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}