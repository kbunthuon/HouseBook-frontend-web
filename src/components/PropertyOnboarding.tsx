import React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Upload, CheckCircle, Building } from "lucide-react";

import { Trash2 } from "lucide-react";

import { fetchSpaceEnum } from "../services/FetchSpaceEnum";
import { fetchAssetTypes } from "../services/FetchAssetTypes";
import { onboardProperty, FormData, Space} from "../services/OnboardPropertyService";

export function PropertyOnboarding() {
  const [spaceTypes, setSpaceTypes] = useState<String[]>([]);
  const [assetTypes, setAssetTypes] = useState<{ id: string; name: string }[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    // Basic Information
    propertyName: "",
    propertyDescription: "",
    address: "",
    // Plans & Documents
    floorPlans: [] as File[],
    buildingPlans: [] as File[]
  });

  useEffect(() => {
    const getEnums = async () => {
      const types = await fetchSpaceEnum();
      setSpaceTypes(types);
    };
    getEnums();
  }, []);

  useEffect(() => {
    const getAssetTypes = async () => {
      const types = await fetchAssetTypes();
      setAssetTypes(types);
    };
    getAssetTypes();
  }, []);

  const steps = [
    { id: 1, title: "Basic Information", description: "Property details and location" },
    { id: 2, title: "Adding Spaces and Assets", description: "Insert the rooms and assets in each room" },
    { id: 3, title: "Submission", description: "Check if all the data is correct and submit" }
  ];

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep == steps.length) {
      // No longer Next button, this will be complete onboarding
      // Let backend handle saving information in database
      onboardProperty(formData, spaces);
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

  // Add a new Space
  const addSpace = () => {
    setSpaces((prev: Space[]) => [...prev, { type: "", name: "", assets: [] }]);
  };

  // Update Space Name
  const updateSpaceName = (index: number, name: string) => {
    setSpaces((prev: Space[]) => {
      const newSpaces = [...prev]
      newSpaces[index] = { ...newSpaces[index], name };
      return newSpaces;
    })
  };

  // Update Space Type
  const updateSpaceType = (index: number, type: string) => {
    setSpaces((prev) => {
      const newSpaces = [...prev];
      newSpaces[index] = { ...newSpaces[index], type };
      return newSpaces;
    });
  };

  // Add Asset to a Space
  const addAsset = (spaceIndex: number) => {
    setSpaces((prev) => {
      const newSpaces = [...prev];
      newSpaces[spaceIndex].assets = [
        ...newSpaces[spaceIndex].assets,
        { name: "", description: "" , typeId: "", features: []},
      ];
      return newSpaces;
    });
  };

  // // Update Asset fields
  const updateAsset = (
    spaceIndex: number,
    assetIndex: number,
    field: "name" | "description" | "typeId",
    value: string
  ) => {
    setSpaces((prev) => {
      const newSpaces = [...prev];
      const updatedAsset = {
        ...newSpaces[spaceIndex].assets[assetIndex],
        [field]: value,
      };
      newSpaces[spaceIndex].assets[assetIndex] = updatedAsset;
      return newSpaces;
    });
  };

  // Delete Asset
  const deleteAsset = (spaceIndex: number, assetIndex: number) => {
    setSpaces((prev) => {
      const newSpaces = [...prev];
      newSpaces[spaceIndex].assets.splice(assetIndex, 1);
      return newSpaces;
    });
  };

  // Delete Space
  const deleteSpace = (spaceIndex: number) => {
    setSpaces((prev) => prev.filter((_, i) => i !== spaceIndex));
  };

  // Add a feature to an asset
  const addFeature = (spaceIndex: number, assetIndex: number) => {
    setSpaces((prev) => {
      const newSpaces = [...prev];
      newSpaces[spaceIndex].assets[assetIndex].features.push({ name: "", value: "" });
      return newSpaces;
    });
  };

  // Update a feature's field
  const updateFeature = (
    spaceIndex: number,
    assetIndex: number,
    featureIndex: number,
    field: "name" | "value",
    value: string
  ) => {
    setSpaces((prev) => {
      const newSpaces = [...prev];
      newSpaces[spaceIndex].assets[assetIndex].features[featureIndex][field] = value;
      return newSpaces;
    });
  };

  // Delete a feature
  const deleteFeature = (spaceIndex: number, assetIndex: number, featureIndex: number) => {
    setSpaces((prev) => {
      const newSpaces = [...prev];
      newSpaces[spaceIndex].assets[assetIndex].features.splice(featureIndex, 1);
      return newSpaces;
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
                  onChange={(e: React.FormEvent) => setFormData({...formData, propertyName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="propertyDescription">Description</Label>
                <Input
                  id="propertyDescription"
                  value={formData.propertyDescription}
                  onChange={(e: React.FormEvent) => setFormData({...formData, propertyDescription: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e: React.FormEvent) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div>
              <Label>Floor Plans</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e: React.FormEvent) => handleFileUpload('floorPlans', e.target.files)}
                    className="hidden"
                    id="floorPlans"
                  />
                  <Label htmlFor="floorPlans" className="block text-center cursor-pointer text-primary hover:underline">
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
                    onChange={(e: React.FormEvent) => handleFileUpload('buildingPlans', e.target.files)}
                    className="hidden"
                    id="buildingPlans"
                  />
                  <Label htmlFor="buildingPlans" className="block text-center cursor-pointer text-primary hover:underline">
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

      case 2:
        return (
          <div className="space-y-4">
            {spaces.map((space, spaceIndex) => (
              <div key={spaceIndex} className="relative border p-4 rounded-lg space-y-4">
                {/* Delete Space Button */}
                <button
                  onClick={() => deleteSpace(spaceIndex)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>

                {/* Space name + type */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor={`space-type-${spaceIndex}`}>Space Type</Label>
                    <select
                      id={`space-type-${spaceIndex}`}
                      value={space.type}
                      onChange={(e) => updateSpaceType(spaceIndex, e.target.value)}
                      className="w-full border rounded p-2"
                    >
                      <option value="">Select a space</option>
                      {spaceTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor={`space-name-${spaceIndex}`}>Space Name</Label>
                    <Input
                      id={`space-name-${spaceIndex}`}
                      value={space.name}
                      onChange={(e) => updateSpaceName(spaceIndex, e.target.value)}
                      placeholder="Downstairs Bedroom"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Assets */}
                {space.assets.map((asset, assetIndex) => (
                  <div key={assetIndex} className="border p-2 rounded-lg space-y-2">
                    <div className="grid gap-4 md:grid-cols-3 items-center">
                      {/* Asset Type */}
                      <div>
                        <Label htmlFor={`asset-type-${spaceIndex}-${assetIndex}`}>Asset Type</Label>
                        <select
                          id={`asset-type-${spaceIndex}-${assetIndex}`}
                          value={asset.typeId}
                          onChange={(e) => {
                            const selectedName =
                              e.target.options[e.target.selectedIndex].text;
                            updateAsset(spaceIndex, assetIndex, "name", selectedName);
                            updateAsset(spaceIndex, assetIndex, "typeId", e.target.value);
                          }}
                          className="w-full border rounded p-2"
                        >
                          <option value="">Select Asset Type</option>
                          {assetTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Asset Description */}
                      <div>
                        <Label htmlFor={`asset-desc-${spaceIndex}-${assetIndex}`}>
                          If other, please specify
                        </Label>
                        <Input
                          id={`asset-desc-${spaceIndex}-${assetIndex}`}
                          value={asset.description}
                          onChange={(e) =>
                            updateAsset(spaceIndex, assetIndex, "description", e.target.value)
                          }
                        />
                      </div>

                      {/* Delete Asset */}
                      <div className="flex justify-end items-end">
                        <button
                          onClick={() => deleteAsset(spaceIndex, assetIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Features for this asset */}
                    {asset.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="grid gap-4 md:grid-cols-3 items-center mt-2"
                      >
                        <Input
                          placeholder="Feature Name"
                          value={feature.name}
                          onChange={(e) =>
                            updateFeature(spaceIndex, assetIndex, featureIndex, "name", e.target.value)
                          }
                        />
                        <Input
                          placeholder="Feature Value"
                          value={feature.value}
                          onChange={(e) =>
                            updateFeature(spaceIndex, assetIndex, featureIndex, "value", e.target.value)
                          }
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => deleteFeature(spaceIndex, assetIndex, featureIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Feature Button */}
                    <Button
                      variant="secondary"
                      onClick={() => addFeature(spaceIndex, assetIndex)}
                      className="mt-2"
                    >
                      Add Feature
                    </Button>
                  </div>
                ))}

                {/* Add Asset Button */}
                <Button variant="secondary" onClick={() => addAsset(spaceIndex)}>
                  Add Asset
                </Button>
              </div>
            ))}

            {/* Add Space Button */}
            <Button onClick={addSpace}>Add Space</Button>
            </div>
            )

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Review Your Submission</h2>

            {spaces.length === 0 ? (
              <p className="text-muted-foreground">No spaces added yet.</p>
            ) : (
              spaces.map((space, spaceIndex) => (
                <div
                  key={spaceIndex}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Space */}
                  <h3 className="font-medium ml-0">
                    {space.type || "No Type Selected"} - {space.name || "Unnamed Room"}
                  </h3>

                  {/* Assets */}
                  {space.assets.length > 0 ? (
                    <ul className="list-disc pl-6 space-y-1">
                      {space.assets.map((asset, assetIndex) => (
                        <li key={assetIndex}>
                          <span className="font-medium">{asset.name || "Unnamed Asset"}</span>
                          {asset.description && (
                            <span className="text-muted-foreground"> — {asset.description}</span>
                          )}

                          {/* Asset Features */}
                          {asset.features && asset.features.length > 0 && (
                            <ul className="list-disc pl-6 mt-1 space-y-1 text-sm text-muted-foreground">
                              {asset.features.map((feature, featureIndex) => (
                                <li key={featureIndex}>
                                  {feature.name || "Unnamed Feature"}: {feature.value || "No Value"}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground ml-6">No assets added.</p>
                  )}
                </div>
              ))
            )}
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
            >
              {currentStep === steps.length ? "Complete Onboarding" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}