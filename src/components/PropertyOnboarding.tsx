import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Upload, CheckCircle, Building } from "lucide-react";

export function PropertyOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    propertyName: "",
    address: "",
    propertyType: "",
    developer: "",
    totalUnits: "",
    // Plans & Documents
    floorPlans: [] as File[],
    buildingPlans: [] as File[],
    // Utilities
    electricalProvider: "",
    gasProvider: "",
    waterProvider: "",
    internetProvider: "",
    // Fittings & Features
    kitchenType: "",
    bathroomType: "",
    flooringType: "",
    heatingType: "",
    // Access Control
    accessPIN: "",
    accessToken: ""
  });

  const steps = [
    { id: 1, title: "Basic Information", description: "Property details and location" },
    { id: 2, title: "Plans & Documents", description: "Upload floor plans and documents" },
    { id: 3, title: "Utilities", description: "Utility providers and connections" },
    { id: 4, title: "Fittings & Features", description: "Interior specifications" },
    { id: 5, title: "Access Control", description: "Set PIN and access tokens" }
  ];

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = (field: string, files: FileList | null) => {
    if (files) {
      setFormData({
        ...formData,
        [field]: Array.from(files)
      });
    }
  };

  const generateAccessCode = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setFormData({
      ...formData,
      accessPIN: pin,
      accessToken: token
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="propertyName">Property Name</Label>
                <Input
                  id="propertyName"
                  value={formData.propertyName}
                  onChange={(e) => setFormData({...formData, propertyName: e.target.value})}
                  placeholder="Maple Heights Development"
                />
              </div>
              <div>
                <Label htmlFor="propertyType">Property Type</Label>
                <Select onValueChange={(value) => setFormData({...formData, propertyType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment Complex</SelectItem>
                    <SelectItem value="residential">Residential Development</SelectItem>
                    <SelectItem value="commercial">Commercial Building</SelectItem>
                    <SelectItem value="mixed">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Full property address"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="developer">Developer/Owner</Label>
                <Input
                  id="developer"
                  value={formData.developer}
                  onChange={(e) => setFormData({...formData, developer: e.target.value})}
                  placeholder="Development Company Ltd"
                />
              </div>
              <div>
                <Label htmlFor="totalUnits">Total Units</Label>
                <Input
                  id="totalUnits"
                  type="number"
                  value={formData.totalUnits}
                  onChange={(e) => setFormData({...formData, totalUnits: e.target.value})}
                  placeholder="50"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>Floor Plans</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('floorPlans', e.target.files)}
                    className="hidden"
                    id="floorPlans"
                  />
                  <Label htmlFor="floorPlans" className="cursor-pointer text-primary hover:underline">
                    Click to upload floor plans
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    PDF, PNG, JPG up to 10MB each
                  </p>
                </div>
                {formData.floorPlans.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm">{formData.floorPlans.length} files selected</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Building Plans & Documents</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('buildingPlans', e.target.files)}
                    className="hidden"
                    id="buildingPlans"
                  />
                  <Label htmlFor="buildingPlans" className="cursor-pointer text-primary hover:underline">
                    Click to upload building plans
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Technical drawings, specifications, etc.
                  </p>
                </div>
                {formData.buildingPlans.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm">{formData.buildingPlans.length} files selected</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="electricalProvider">Electrical Provider</Label>
                <Input
                  id="electricalProvider"
                  value={formData.electricalProvider}
                  onChange={(e) => setFormData({...formData, electricalProvider: e.target.value})}
                  placeholder="National Grid"
                />
              </div>
              <div>
                <Label htmlFor="gasProvider">Gas Provider</Label>
                <Input
                  id="gasProvider"
                  value={formData.gasProvider}
                  onChange={(e) => setFormData({...formData, gasProvider: e.target.value})}
                  placeholder="British Gas"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="waterProvider">Water Provider</Label>
                <Input
                  id="waterProvider"
                  value={formData.waterProvider}
                  onChange={(e) => setFormData({...formData, waterProvider: e.target.value})}
                  placeholder="Thames Water"
                />
              </div>
              <div>
                <Label htmlFor="internetProvider">Internet Provider</Label>
                <Input
                  id="internetProvider"
                  value={formData.internetProvider}
                  onChange={(e) => setFormData({...formData, internetProvider: e.target.value})}
                  placeholder="BT Openreach"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="kitchenType">Kitchen Type</Label>
                <Select onValueChange={(value) => setFormData({...formData, kitchenType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select kitchen type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="traditional">Traditional</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bathroomType">Bathroom Type</Label>
                <Select onValueChange={(value) => setFormData({...formData, bathroomType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bathroom type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ensuite">En-suite</SelectItem>
                    <SelectItem value="family">Family Bathroom</SelectItem>
                    <SelectItem value="luxury">Luxury Suite</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="flooringType">Flooring Type</Label>
                <Select onValueChange={(value) => setFormData({...formData, flooringType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select flooring" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardwood">Hardwood</SelectItem>
                    <SelectItem value="laminate">Laminate</SelectItem>
                    <SelectItem value="carpet">Carpet</SelectItem>
                    <SelectItem value="tile">Tile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="heatingType">Heating Type</Label>
                <Select onValueChange={(value) => setFormData({...formData, heatingType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select heating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="central">Central Heating</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="gas">Gas</SelectItem>
                    <SelectItem value="heat-pump">Heat Pump</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Button onClick={generateAccessCode} variant="outline">
                Generate Access Codes
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Click to generate secure PIN and access token
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="accessPIN">Property PIN</Label>
                <Input
                  id="accessPIN"
                  value={formData.accessPIN}
                  onChange={(e) => setFormData({...formData, accessPIN: e.target.value})}
                  placeholder="6-digit PIN"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Share this PIN with authorized personnel
                </p>
              </div>
              <div>
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  value={formData.accessToken}
                  onChange={(e) => setFormData({...formData, accessToken: e.target.value})}
                  placeholder="Secure access token"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  API access token for integrations
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Property Onboarding</h1>
        <p className="text-muted-foreground">
          Complete the setup for a new property
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Step {currentStep} of {steps.length}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {steps[currentStep - 1].description}
              </p>
            </div>
            <Badge variant="secondary">
              {Math.round(progress)}% Complete
            </Badge>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center space-x-4 overflow-x-auto pb-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 min-w-fit ${
                    step.id === currentStep
                      ? "text-primary"
                      : step.id < currentStep
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                        step.id === currentStep
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground"
                      }`}
                    >
                      {step.id}
                    </div>
                  )}
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
              ))}
            </div>
          </div>

          {renderStep()}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentStep === steps.length}
            >
              {currentStep === steps.length ? "Complete Onboarding" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}