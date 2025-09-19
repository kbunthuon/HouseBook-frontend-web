import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Copy, Trash2, Settings, Check } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface AccessPin {
  id: string;
  pin: string;
  accessibleSections: string[];
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
}

interface PinTableProps {
  pins: AccessPin[];
  onUpdatePin: (pinId: string, sections: string[]) => void;
  onDeletePin: (pinId: string) => void;
  onToggleActive: (pinId: string, isActive: boolean) => void;
}

export function PinTable({ pins, onUpdatePin, onDeletePin, onToggleActive }: PinTableProps) {
  const [editingPin, setEditingPin] = useState<AccessPin | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const propertySections = [
    "General Details",
    "Walls & Ceilings", 
    "Exterior Specifications",
    "Flooring",
    "Cabinetry & Bench Tops",
    "Doors & Handles",
    "Kitchen Appliances",
    "Bathroom Fixtures",
    "Lighting & Electrical",
    "Property Images"
  ];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("PIN copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy PIN");
    }
  };

  const handleAccessEdit = (pin: AccessPin) => {
    setEditingPin(pin);
    setSelectedSections(pin.accessibleSections);
  };

  const handleSectionChange = (section: string, checked: boolean) => {
    if (checked) {
      setSelectedSections(prev => [...prev, section]);
    } else {
      setSelectedSections(prev => prev.filter(s => s !== section));
    }
  };

  const handleSaveAccess = () => {
    if (editingPin && selectedSections.length > 0) {
      onUpdatePin(editingPin.id, selectedSections);
      setEditingPin(null);
      setSelectedSections([]);
      toast.success("PIN access updated successfully");
    }
  };

  const handleCloseDialog = () => {
    setEditingPin(null);
    setSelectedSections([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (pins.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No access PINs generated yet</p>
        <p className="text-sm">Generate a PIN to start sharing property access</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PIN</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Accessible Sections</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pins.map((pin) => (
            <TableRow key={pin.id}>
              <TableCell>
                <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                  {pin.pin}
                </code>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={pin.isActive ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => onToggleActive(pin.id, !pin.isActive)}
                >
                  {pin.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="max-w-xs">
                  <p className="text-sm text-muted-foreground">
                    {pin.accessibleSections.length} section{pin.accessibleSections.length !== 1 ? 's' : ''}
                  </p>
                  <div className="text-xs text-muted-foreground truncate">
                    {pin.accessibleSections.slice(0, 2).join(", ")}
                    {pin.accessibleSections.length > 2 && "..."}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(pin.createdAt)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {pin.lastUsed ? formatDate(pin.lastUsed) : "Never"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAccessEdit(pin)}
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(pin.pin)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeletePin(pin.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Access Edit Dialog */}
      <Dialog open={!!editingPin} onOpenChange={() => handleCloseDialog()}>
        <DialogContent className="w-full sm:w-[400px]">
          <DialogHeader>
            <DialogTitle>
              Edit Access for PIN: {editingPin?.pin}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Label>Select accessible sections for this PIN:</Label>
            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
              {propertySections.map((section) => (
                <div key={section} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${section}`}
                    checked={selectedSections.includes(section)}
                    onCheckedChange={(checked) => 
                      handleSectionChange(section, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`edit-${section}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {section}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAccess}
              disabled={selectedSections.length === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}