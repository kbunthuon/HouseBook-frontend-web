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
import { Property, Owner, getPropertyOwners, getPropertyDetails, AssetType, fetchAssetType } from "../../../backend/FetchData";
import { createPropertyPin } from "../../../backend/HandlePin";


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
  const [assetTypeMap, setAssetTypeMap] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState({
    title: "",
    end_time: "",
  })

  useEffect(() => { fetchAssetType().then(setAssetTypeMap); }, []);


  // NOTE: repetitive fetch code... should I move this to PropertyDetails or keep it separate??

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [owners, setOwners] = useState<Owner[] | null>(null);
  const [openSpaces, setOpenSpaces] = useState<Record<string, boolean>>({});

  const toggleSpace = (name: string) =>
    setOpenSpaces((prev) => ({ ...prev, [name]: !prev[name] }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching details for property ID:", propertyId);
        const result = await getPropertyDetails(propertyId);
        if (result) {
          setProperty(result);
        } else {
          setError("Property not found");
        }

        console.log("Spaces data:", result?.spaces);

        const ownerResult = await getPropertyOwners(propertyId);
        if (ownerResult) {
          setOwners(ownerResult);
        } else {
          setError("Owner not found");
        }
      } catch (err: any) {
        setError(err.message ?? "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propertyId]); // re-run if the propertyId changes

  console.log("PinManagementDialog propertyId:", propertyId);


  type PropertySection = { name: string; assets: string[] };

  const propertySections: PropertySection[] =
    (property?.spaces ?? []).map(s => ({
      name: s.name,
      assets: (s.assets ?? []).map(a => a.type),
    }));

  const norm = (s: string) => s.trim().toLowerCase();

  const assetTypeToUIKeys = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of propertySections) {
      for (const a of s.assets) {
        const uiKey = `${s.name}: ${a}`;
        const k = norm(a);
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


  // const generatePin = () => {
  //   const pin = Math.floor(100000 + Math.random() * 900000).toString();
  //   setGeneratedPin(pin);
  // };

  const reconcileParents = (keys: string[]) => {
    const next = new Set(keys);
    for (const s of propertySections) {
      const allChild = s.assets.map(a => childKey(s.name, a));
      const allPicked = allChild.every(k => next.has(k));
      if (!allPicked) next.delete(s.name); // keep parent only if ALL children are picked
    }
    return [...next];
  };

  const handleDisciplineToggle = (disciplineName: string, checked: boolean) => {
    const thisKeys = new Set(uiKeysForDiscipline(disciplineName));
  
    if (checked) {
      setSelectedDisciplines(prev => [...new Set([...prev, disciplineName])]);
      setSelectedSections(prev => {
        const next = new Set(prev);
        thisKeys.forEach(k => next.add(k));           // add children
        return syncParentsFromChildren(next);                       // <-- update parents
      });
      return;
    }
  
    // deselect: remove keys from this discipline unless covered by another selected discipline
    setSelectedDisciplines(prev => prev.filter(d => d !== disciplineName));
    setSelectedSections(prev => {
      const next = new Set(prev);
      const keepByOthers = new Set<string>();

      selectedDisciplines
      .filter(d => d !== disciplineName)
      .forEach(d => uiKeysForDiscipline(d).forEach(k => keepByOthers.add(k)));

      thisKeys.forEach(k => {
      if (!keepByOthers.has(k)) next.delete(k);                   // remove only if not kept
    });

    return syncParentsFromChildren(next);                         
    });
  };

  // helpers
  const isChildKey = (key: string) => key.includes(": ");
  const childKey = (space: string, asset: string) => `${space}: ${asset}`;

  const childKeysForSpace = (spaceName: string) =>
  getAssetsForSpace(spaceName).map(a => childKey(spaceName, a));

  const getAssetsForSpace = (spaceName: string) =>
    propertySections.find(s => s.name === spaceName)?.assets ?? [];

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

    return [...next];
  });
};

  const isSpaceIndeterminate = (spaceName: string) => {
    const kids = childKeysForSpace(spaceName);
    const picked = kids.filter(k => selectedSections.includes(k)).length;
    return picked > 0 && picked < kids.length;
  };

  // const handleSave = () => {
  //   if (generatedPin && selectedSections.length > 0) {
  //     onSave(generatedPin, selectedSections);
  //     setGeneratedPin("");
  //     setSelectedSections([]);
  //     onOpenChange(false);
  //   }
  // };
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
    console.log("[onCreate] start");
    try {
      setSaving(true);
      setError(null);
  
      const row = {
        property_id: propertyId,
        tradie_id: null,
        title: formData.title,
        status: "PENDING" as const,
        created_at: new Date().toISOString(),
        end_time: endAt           // if user picked a time
        ? new Date(endAt).toISOString()
        : oneHourFromNowISO(),  // fallback
      };
  
      console.log("[onCreate] inserting row:", row);
  
      const propertyPin = await createPropertyPin(row);
  
      console.log("[onCreate] insert OK");
      onOpenChange(false);                       // close dialog
      navigate(`/owner/properties/${propertyId}#access-pins`);
    } catch (e: any) {
      // PostgREST returns rich fields — surface them:
      console.error("[onCreate] insert error", {
        message: e?.message,
        details: e?.details,
        hint: e?.hint,
        code: e?.code,
      });
      setError(e?.message ?? "Failed to create PIN");
    } finally {
      setSaving(false);
      console.log("[onCreate] done");
    }
  };
  


  // const onCreate = async () => {
  //   console.log("[onCreate] start");
  //   try {
  //     setSaving(true);
  //     setError(null);
  
  //     const now = new Date();
  //     const t = formData.title.trim();
  //     if (!t) {
  //       setError("Please enter a title for this PIN.");
  //       return;
  //     }
    
  //     if (!endAt) {
  //       setError("Please choose an expiry time.");
  //       return;
  //     }
  //     const end = new Date(endAt);              // "YYYY-MM-DDTHH:mm" (local)
  //     if (Number.isNaN(end.getTime())) {
  //       setError("Expiry time is invalid.");
  //       return;
  //     }
  //     if (end <= now) {
  //       setError("Expiry time must be in the future.");
  //       return;
  //     }

  //     const row = {
  //       property_id: propertyId,
  //       tradie_id: undefined,
  //       title: t,
  //       status: "Active",
  //       created_at: now.toISOString(),
  //       end_time: endAt           // if user picked a time
  //       ? new Date(endAt).toISOString()
  //       : oneHourFromNowISO(),  // fallback
  //     };
  //     console.log("[onCreate] inserting", row);
  
  //     await createPropertyPin({
  //       property_id: propertyId,
  //       tradie_id: undefined,
  //       title: t,
  //       status: "Active",
  //       created_at: now.toISOString(),
  //       end_time: endAt           // if user picked a time
  //       ? new Date(endAt).toISOString()
  //       : oneHourFromNowISO(),  // fallback
  //     });
  
  //     console.log("[onCreate] success – closing dialog");
  //     onOpenChange(false);
  //     navigate(`/owner/properties/${propertyId}#access-pins`);
  //     document.getElementById("access-pins")?.scrollIntoView({ behavior: "smooth" });
  //   } catch (e: any) {
  //     setError(e.message ?? "Failed to create PIN");
  //   } finally {
  //     setSaving(false);
  //     console.log("[onCreate] done");
  //   }
  // };
  

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
              value={formData.title}
              onChange={(t) => setFormData({...formData, title: t.target.value})}
              placeholder="National Grid"
            />
          </div>
          <div>
            <Label htmlFor="endTime">Pin Expiry</Label>
            <input
              id="endTime"
              type="datetime-local"
              className="mt-1 w-full rounded-md border px-3 py-2"
              min={localInputValue()}          // can’t pick a past time
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </div>
          {/* PIN Generation Section
          <div className="space-y-3">
            <Label>Generated PIN</Label>
            <div className="flex items-center space-x-2">
              <Input 
                value={generatedPin} 
                readOnly 
                placeholder="Click generate to create PIN"
                className="font-mono"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generatePin}
                className="flex items-center space-x-1"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Generate</span>
              </Button>
            </div>
          </div>

          <Separator /> */}

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
                  onCheckedChange={(c) => handleDisciplineToggle(d, Boolean(c))}
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
                      onCheckedChange={(checked) => 
                        handleSectionChange(space.name, checked as boolean)
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
                      const key = `${space.name}: ${asset}`;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <Checkbox
                            id={key}
                            checked={selectedSections.includes(key)}
                            onCheckedChange={(checked) =>
                              handleSectionChange(key, checked as boolean)
                            }
                          />
                          <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                            {asset}
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