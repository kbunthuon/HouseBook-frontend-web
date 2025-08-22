import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ArrowLeft, Edit, Key, FileText, Image } from "lucide-react";

interface PropertyDetailProps {
  propertyId: string;
  onBack: () => void;
}

export function PropertyDetail({ propertyId, onBack }: PropertyDetailProps) {
  // Mock property data - in real app this would come from API
  const propertyData = {
    id: propertyId,
    name: "Rose Wood Retreat",
    description: "Single-storey contemporary home",
    status: "Active",
    owner: "John Smith",
    pin: "123456",
    token: "abc123def456",
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

  const SpecificationSection = ({ title, items, children }: { title: string; items?: Record<string, string>; children?: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items && (
          <div className="space-y-2">
            {Object.entries(items).map(([key, value]) => (
              <div key={key} className="flex justify-between items-start">
                <span className="font-medium capitalize text-muted-foreground">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </span>
                <span className="text-right max-w-2xl">{value}</span>
              </div>
            ))}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );

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
          <Badge variant="default">{propertyData.status}</Badge>
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
      <div className="space-y-2">
        <h1>{propertyData.name}</h1>
        <p className="text-muted-foreground text-lg">{propertyData.description}</p>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>Owner: {propertyData.owner}</span>
          <span>•</span>
          <span>PIN: {propertyData.pin}</span>
          <span>•</span>
          <span>Token: {propertyData.token}</span>
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Property Image {i}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Specifications Grid */}
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

      {/* Access Control Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Access Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4>Property PIN</h4>
              <div className="flex items-center space-x-2 mt-2">
                <code className="bg-muted px-3 py-2 rounded font-mono">{propertyData.pin}</code>
                <Button variant="outline" size="sm">
                  Regenerate
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Share this PIN with authorized personnel for property access
              </p>
            </div>
            <div>
              <h4>Access Token</h4>
              <div className="flex items-center space-x-2 mt-2">
                <code className="bg-muted px-3 py-2 rounded font-mono text-sm">{propertyData.token}</code>
                <Button variant="outline" size="sm">
                  Regenerate
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                API access token for system integrations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}