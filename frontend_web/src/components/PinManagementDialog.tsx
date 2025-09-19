import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Property, Owner, getPropertyOwners, getPropertyDetails } from "../../../backend/FetchData";

interface PinManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (pin: string, sections: string[]) => void;
  propertyId: string;
}

export function PinManagementDialog({ open, onOpenChange, onSave, propertyId }: PinManagementDialogProps) {
  const [generatedPin, setGeneratedPin] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  // NOTE: repetitive fetch code... should I move this to PropertyDetails or keep it separate??

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [owners, setOwners] = useState<Owner[] | null>(null);

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


  const propertySections =
    property?.spaces?.flatMap((space) =>
        space.assets.map((asset) => `${space.name}: ${asset.type}`)
    ) ?? [];


  const generatePin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedPin(pin);
  };

  const handleSectionChange = (section: string, checked: boolean) => {
    if (checked) {
      setSelectedSections(prev => [...prev, section]);
    } else {
      setSelectedSections(prev => prev.filter(s => s !== section));
    }
  };

  const handleSave = () => {
    if (generatedPin && selectedSections.length > 0) {
      onSave(generatedPin, selectedSections);
      setGeneratedPin("");
      setSelectedSections([]);
      onOpenChange(false);
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
          <DialogTitle>Generate Property Access PIN</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* PIN Generation Section */}
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

          <Separator />

          {/* Sections Access Control */}
          <div className="space-y-3">
            <Label>Select accessible sections for this PIN:</Label>
            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
              {propertySections.map((section) => (
                <div key={section} className="flex items-center space-x-2">
                  <Checkbox
                    id={section}
                    checked={selectedSections.includes(section)}
                    onCheckedChange={(checked) => 
                      handleSectionChange(section, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={section}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {section}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!generatedPin || selectedSections.length === 0}
          >
            Save PIN
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}