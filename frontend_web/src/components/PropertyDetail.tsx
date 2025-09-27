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
import { Property } from "../types/serverTypes";
import { Owner, AccessPin } from "../types/serverTypes";
// import { AccessPin } from "./PinTable"

interface EditHistoryItem {
  id: number;
  date: string;
  section: string;
  field?: string;
  description: string;
  editedBy: string;
}

// interface AccessPin {
//   id: string;
//   pin: string;
//   accessibleSections: string[];
//   isActive: boolean;
//   createdAt: string;
//   lastUsed?: string;
// }

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
  const [accessPins, setAccessPins] = useState<AccessPin[]>([
    {
      id: "1",
      pin: "123456",
      accessibleSections: ["General Details", "Exterior Specifications", "Property Images"],
      isActive: true,
      createdAt: "2024-01-15T10:30:00Z",
      lastUsed: "2024-01-18T14:20:00Z"
    },
    {
      id: "2", 
      pin: "789012",
      accessibleSections: ["Kitchen Appliances", "Bathroom Fixtures", "Lighting & Electrical"],
      isActive: false,
      createdAt: "2024-01-10T09:15:00Z",
      lastUsed: "2024-01-12T16:45:00Z"
    }
  ]);

  // Define all editable fields organized by section
  const sectionFields = {
    "General Details": [
      "bedrooms",
      "bathrooms", 
      "livingAreas",
      "garage",
      "totalFloorArea",
      "blockSize"
    ],
    "Walls & Ceilings": [
      "paintColour",
      "ceilingHeight",
      "cornices"
    ],
    "Exterior Specifications": [
      "roof",
      "wallsBrick",
      "renderFeature",
      "windows",
      "fasciaGutters",
      "frontDoor",
      "driveway",
      "fencing"
    ],
    "Flooring": [
      "livingAreas",
      "bedrooms",
      "wetAreas"
    ],
    "Cabinetry & Bench Tops": [
      "kitchenCabinets",
      "kitchenBenchtop",
      "bathroomVanities",
      "bathroomBenchtops"
    ],
    "Doors & Handles": [
      "internalDoors",
      "handles"
    ],
    "Kitchen Appliances": [
      "oven",
      "cooktop",
      "rangehood",
      "dishwasher"
    ],
    "Bathroom Fixtures": [
      "showerScreens",
      "bathtub",
      "tapware",
      "toilets"
    ],
    "Lighting & Electrical": [
      "lighting",
      "powerPoints",
      "heatingCooling",
      "hotWater"
    ]
  };

  // Mock edit history data - in real app this would come from API
  const editHistory = {
    generalDetails: [
      {
        id: 1,
        date: "2024-01-15T10:30:00Z",
        section: "General Details",
        field: "bedrooms",
        description: "Updated bedroom count from 3 to 3 + study",
        editedBy: "John Smith"
      },
      {
        id: 2,
        date: "2024-01-10T14:15:00Z",
        section: "General Details",
        field: "totalFloorArea", 
        description: "Initial property setup with basic details",
        editedBy: "System"
      }
    ],
    wallsCeilings: [
      {
        id: 3,
        date: "2024-01-12T09:45:00Z",
        section: "Walls & Ceilings",
        field: "paintColour",
        description: "Changed paint color from Vivid White to Natural White",
        editedBy: "John Smith"
      },
      {
        id: 4,
        date: "2024-01-05T11:20:00Z",
        section: "Walls & Ceilings",
        field: "ceilingHeight",
        description: "Updated ceiling height specification",
        editedBy: "John Smith"
      }
    ],
    exteriorSpecs: [
      {
        id: 5,
        date: "2024-01-08T16:20:00Z",
        section: "Exterior Specifications",
        field: "roof",
        description: "Updated roof color from Woodland Grey to Basalt",
        editedBy: "John Smith"
      }
    ],
    flooring: [
      {
        id: 6,
        date: "2024-01-14T13:45:00Z",
        section: "Flooring",
        field: "bedrooms",
        description: "Changed carpet color from Charcoal to Storm Grey",
        editedBy: "John Smith"
      }
    ],
    cabinetryBenchtops: [
      {
        id: 7,
        date: "2024-01-11T15:30:00Z",
        section: "Cabinetry & Bench Tops",
        field: "kitchenCabinets",
        description: "Updated kitchen cabinet finish",
        editedBy: "John Smith"
      }
    ],
    doorsHandles: [
      {
        id: 8,
        date: "2024-01-09T10:15:00Z",
        section: "Doors & Handles",
        field: "handles",
        description: "Changed handle finish to matte black",
        editedBy: "John Smith"
      }
    ],
    kitchenAppliances: [
      {
        id: 9,
        date: "2024-01-13T14:20:00Z",
        section: "Kitchen Appliances",
        field: "cooktop",
        description: "Upgraded cooktop from 600mm to 900mm induction",
        editedBy: "John Smith"
      }
    ],
    bathroomFixtures: [
      {
        id: 10,
        date: "2024-01-07T12:30:00Z",
        section: "Bathroom Fixtures",
        field: "tapware",
        description: "Updated tapware finish to matte black",
        editedBy: "John Smith"
      }
    ],
    lightingElectrical: [
      {
        id: 11,
        date: "2024-01-16T09:15:00Z",
        section: "Lighting & Electrical",
        field: "lighting",
        description: "Added pendant lighting specification",
        editedBy: "John Smith"
      }
    ]
  };

  const handleEdit = (sectionTitle: string, specificField?: string) => {
    setEditingSection(sectionTitle);
    if (specificField) {
      setEditingField(specificField);
    } else {
      // If no specific field provided, default to first field of the section
      const fields = sectionFields[sectionTitle as keyof typeof sectionFields];
      setEditingField(fields?.[0] || "");
    }
    setEditDescription("");
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    // In real app, this would make an API call to save the edit
    const currentTime = new Date().toISOString();
    console.log({
      section: editingSection,
      field: editingField,
      description: editDescription,
      timestamp: currentTime
    });
    
    setIsEditDialogOpen(false);
    setEditDescription("");
    setEditingSection("");
    setEditingField("");
  };

  const handleFieldChange = (fieldValue: string) => {
    setEditingField(fieldValue);
  };

  // Get fields for the current editing section only
  const getCurrentSectionFields = () => {
    if (!editingSection) return [];
    const fields = sectionFields[editingSection as keyof typeof sectionFields] || [];
    return fields.map(field => ({
      value: field,
      label: field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }));
  };

  const handleShowTimeline = (sectionTitle: string) => {
    setSelectedSectionForTimeline(sectionTitle);
    setIsTimelineDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSectionKey = (title: string): keyof typeof editHistory => {
    const keyMap: Record<string, keyof typeof editHistory> = {
      "General Details": "generalDetails",
      "Walls & Ceilings": "wallsCeilings", 
      "Exterior Specifications": "exteriorSpecs",
      "Flooring": "flooring",
      "Cabinetry & Bench Tops": "cabinetryBenchtops",
      "Doors & Handles": "doorsHandles",
      "Kitchen Appliances": "kitchenAppliances",
      "Bathroom Fixtures": "bathroomFixtures",
      "Lighting & Electrical": "lightingElectrical"
    };
    return keyMap[title] || "generalDetails";
  };

  // PIN management functions
  const handleSavePin = (pin: string, sections: string[]) => {
    const newPin: AccessPin = {
      id: Date.now().toString(),
      pin,
      accessibleSections: sections,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    setAccessPins(prev => [...prev, newPin]);
    toast.success("Access PIN created successfully");
  };

  const handleUpdatePin = (pinId: string, sections: string[]) => {
    setAccessPins(prev => prev.map(pin => 
      pin.id === pinId ? { ...pin, accessibleSections: sections } : pin
    ));
  };

  const handleDeletePin = (pinId: string) => {
    setAccessPins(prev => prev.filter(pin => pin.id !== pinId));
    toast.success("Access PIN deleted successfully");
  };

  const handleToggleActive = (pinId: string, isActive: boolean) => {
    setAccessPins(prev => prev.map(pin => 
      pin.id === pinId ? { ...pin, isActive } : pin
    ));
    toast.success(`PIN ${isActive ? 'activated' : 'deactivated'} successfully`);
  };


  // Mock property data - in real app this would come from API
  /*
  const propertyData = {
    id: propertyId,
    name: "Rose Wood Retreat",
    description: "Single-storey contemporary home",
    status: "Active",
    owner: "John Smith",
    pin: "123456",
    address: "123 Maple Street, Downtown",
    generalDetails: {
      bedrooms: "3 + study",
      bathrooms: "2",
      livingAreas: "2 (Open-plan living/dining + separate lounge)",
      garage: "Double garage with panel-lift door",
      totalFloorArea: "212 m²",
      blockSize: "590 m²"
    },
    exteriorSpecs: {
      roof: "Colorbond steel in Basalt",
      wallsBrick: "Clay bricks in Smokey Ash",
      renderFeature: "Acrylic render in Shale Grey",
      windows: "Aluminium framed in Black Matt with tinted double glazing",
      fasciaGutters: "Colorbond Basalt",
      frontDoor: "Solid Timber in Spotted Gum with vertical glass inserts",
      driveway: "Stamped concrete in Charcoal Slate pattern",
      fencing: "1.8m timber paling fence with stained finish in Walnut"
    },
    wallsCeilings: {
      paintColour: "Dulux Natural White",
      ceilingHeight: "2.55m, painted Dulux Ceiling White",
      cornices: "Square set in living areas, 75mm cove in bedrooms"
    },
    flooring: {
      livingAreas: "Hybrid vinyl planks in Spotted Gum",
      bedrooms: "Plush twist carpet in Storm Grey",
      wetAreas: "300x600 porcelain tiles in Travertine Beige"
    },
    cabinetryBenchtops: {
      kitchenCabinets: "Laminex Blackbutt Natural finish with matte black handles",
      kitchenBenchtop: "20mm Caesarstone Cloudburst Concrete",
      bathroomVanities: "Laminex Whitewashed Oak",
      bathroomBenchtops: "20mm Caesarstone Pure White"
    },
    doorsHandles: {
      internalDoors: "Solid core profile doors, painted white",
      handles: "Matte black lever"
    },
    kitchenAppliances: {
      oven: "600mm electric oven, black glass finish",
      cooktop: "900mm induction cooktop",
      rangehood: "Concealed under-mount ducted",
      dishwasher: "Stainless steel, semi-integrated"
    },
    bathroomFixtures: {
      showerScreens: "Semi-frameless clear glass",
      bathtub: "Back-to-wall acrylic tub, 1700mm",
      tapware: "Matte black mixers",
      toilets: "Wall-faced soft-close suites"
    },
    lightingElectrical: {
      lighting: "LED downlights throughout, black pendant lights over kitchen island",
      powerPoints: "Matte black finish",
      heatingCooling: "Zoned ducted reverse-cycle system",
      hotWater: "Electric heat pump hot water system"
    }
  };
  */

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
        console.log("Property images:", result?.images);
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

  const SpecificationSection = ({ title, items, children }: { title: string; items?: Record<string, string>; children?: React.ReactNode }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShowTimeline(title)}
            className="text-muted-foreground hover:text-foreground"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(title)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items && (
          <div className="space-y-2">
            {Object.entries(items).map(([key, value]) => (
              <div 
                key={key} 
                className="flex justify-between items-start group cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded"
                onClick={() => handleEdit(title, key)}
              >
                <span className="font-medium capitalize text-muted-foreground">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-right max-w-2xl">{value}</span>
                  <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
  
  const value = "https://house-book-frontend-web.vercel.app/owner";

  // const length = 6;

  // // make a fresh pin when length changes; user can also regenerate
  // const [seed, setSeed] = useState(0);
  // const pin = useMemo(() => generatePin(length), [length, seed]);

  // const regenerate = () => setSeed(s => s + 1);

  // const copy = async () => {
  //   await navigator.clipboard.writeText(pin);
  //   alert("PIN copied!");
  // };

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
          <h1>{property?.name?? "No name"}</h1>
          <p className="text-muted-foreground text-lg">{property?.description?? "..."}</p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Owner: {owners?.[0] ? `${owners[0].first_name} ${owners[0].last_name}` : "N/A"}</span>
            <span>•</span>
            <span>Address: {property?.address?? "Missing address"}</span>
          </div>
        </div>
        

        {/* Access Control Section */}
        <div className="space-y-2 flex flex-col items-center">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center w-64 max-w-xs mx-auto">
            <QRCodeCanvas
              value={value}
              size={200}        // size in px
              level="H"         // error correction: L, M, Q, H
              includeMargin={true}
            />
            
          </div>
          <Button 
              onClick={() => setIsPinDialogOpen(true)}
              className="w-64 max-w-xs mx-auto items-center justify-center"
              size="sm"
            >
              Create a New Job
            </Button>
          </div>
      </div>

      

      <Separator />

      {/* Property Images Placeholder */}
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
              property?.images.map((url, idx) => (
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


      {/* Specifications Grid */}

      {/* 
      <div className="grid gap-6 md:grid-cols-2">
        
        <SpecificationSection 
          title="General Details" 
          items={propertyData.generalDetails} 
        />

        <SpecificationSection 
          title="Walls & Ceilings" 
          items={propertyData.wallsCeilings} 
        />

        <SpecificationSection 
          title="Exterior Specifications" 
          items={propertyData.exteriorSpecs} 
        />

        <SpecificationSection 
          title="Flooring" 
          items={propertyData.flooring} 
        />

        <SpecificationSection 
          title="Cabinetry & Bench Tops" 
          items={propertyData.cabinetryBenchtops} 
        />

        <SpecificationSection 
          title="Doors & Handles" 
          items={propertyData.doorsHandles} 
        />

        <SpecificationSection 
          title="Kitchen Appliances" 
          items={propertyData.kitchenAppliances} 
        />

        <SpecificationSection 
          title="Bathroom Fixtures" 
          items={propertyData.bathroomFixtures} 
        />

        <SpecificationSection 
          title="Lighting & Electrical" 
          items={propertyData.lightingElectrical} 
        />

      </div>
      */}
      <div className="grid gap-6 md:grid-cols-2">
        {property?.spaces?.map((space) => (
          <SpecificationSection
            key={space.space_id}
            title={space.name} // e.g. "Bedroom", "Kitchen", "Living Area"
            items={
              space.assets.reduce<Record<string, string>>((acc, asset) => {
                acc[asset.type] =
                  asset.description || "No description available";
                return acc;
              }, {})
            }
          />
        ))}
      </div>

      {/* Access PINs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Access PINs Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PinTable 
            propertyId={propertyId}
            pins={accessPins}
            onUpdatePin={handleUpdatePin}
            onDeletePin={handleDeletePin}
            onToggleActive={handleToggleActive}
          />
        </CardContent>
      </Card>

      {/*
      <div className="grid gap-6 md:grid-cols-2">
        
        <SpecificationSection 
          title="General Details" 
          items={propertyData.generalDetails} 
        />

        <SpecificationSection 
          title="Exterior Specifications" 
          items={propertyData.exteriorSpecs} 
        />

        <SpecificationSection 
          title="Bedroom" 
          items={{"Flooring": propertyData.flooring.bedrooms, 
                ...propertyData.wallsCeilings,
                ...propertyData.doorsHandles
              }} 
        />

        <SpecificationSection 
          title="Living Area" 
          items={{"Flooring": propertyData.flooring.livingAreas, 
                ...propertyData.wallsCeilings,
                ...propertyData.doorsHandles
              }} 
        />

        <SpecificationSection 
          title="Kitchen" 
          items={{"Flooring": propertyData.flooring.livingAreas, 
          ...propertyData.wallsCeilings,
          ...propertyData.doorsHandles, 
          "Benchtop": propertyData.cabinetryBenchtops.kitchenBenchtop, 
          "Cabinets": propertyData.cabinetryBenchtops.kitchenCabinets,
          ...propertyData.kitchenAppliances}} 
        />

        <SpecificationSection 
          title="Bathroom" 
          items={{"Flooring": propertyData.flooring.wetAreas, 
          ...propertyData.wallsCeilings,
          ...propertyData.doorsHandles,
          "Benchtop": propertyData.cabinetryBenchtops.bathroomBenchtops, 
          "Vanity": propertyData.cabinetryBenchtops.bathroomVanities,
          ...propertyData.bathroomFixtures}} 
        />

        <SpecificationSection 
          title="Hallway" 
          items={{"Flooring": propertyData.flooring.livingAreas,
          ...propertyData.wallsCeilings,
          ...propertyData.doorsHandles}} 
        />

        <SpecificationSection 
          title="Lighting" 
          items={propertyData.lightingElectrical} 
        />

      </div>
      */}
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-full sm:w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Property Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="datetime">Date & Time</Label>
              <Input
                id="datetime"
                value={new Date().toLocaleString()}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="field">Editing Field</Label>
              <Select 
                value={editingField} 
                onValueChange={handleFieldChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field to edit" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                    {editingSection}
                  </div>
                  {getCurrentSectionFields().map((field) => (
                    <SelectItem 
                      key={field.value} 
                      value={field.value}
                      className="pl-4"
                    >
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description of Update</Label>
              <Textarea
                id="description"
                placeholder="Describe the changes you're making..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editDescription.trim() || !editingField}>
            {/* <Button onClick={handleSaveEdit} disabled={!editDescription.trim() || !editingField}> */}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Management Dialog */}
      <section id="access-pins">
        <PinManagementDialog 
          open={isPinDialogOpen}
          onOpenChange={setIsPinDialogOpen}
          onSave={handleSavePin}
          propertyId={propertyId}
        />
      </section>
    </div>
  );
}