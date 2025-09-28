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
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

import { fetchSpaceEnum } from "../../../backend/FetchSpaceEnum";
import { fetchAssetTypes } from "../../../backend/FetchAssetTypes";
import { ownerOnboardProperty} from "../../../backend/OnboardPropertyService";
import { FormData, SpaceInt} from "../types/serverTypes";
import { ROUTES } from "../Routes";
import { useFormContext } from "./FormContext";
export function OwnerPropertyOnboarding() {
  const [spaceTypes, setSpaceTypes] = useState<string[]>([]);
  const [assetTypes, setAssetTypes] = useState<{ id: string; name: string }[]>([]);
  

  const navigate = useNavigate();

  const {
    formData,
    setFormData,
    spaces,
    setSpaces,
    currentStep,
    setCurrentStep,
    resetForm
  } = useFormContext();

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
    { id: 1, title: "General Information", description: "Property details, location and images" },
    { id: 2, title: "Adding Spaces and Assets", description: "Insert the rooms and assets in each room" },
    { id: 3, title: "Submission", description: "Check if all the data is correct and submit" }
  ];

  const progress = (currentStep / steps.length) * 100;

  const handleNext = async () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep == steps.length) {
      try {
        const propertyId = await ownerOnboardProperty(formData, spaces);
        console.log(propertyId);
        
        // Reset the form data after successful submission
        resetForm();
        
        navigate(ROUTES.properties.detail(propertyId));
      } catch (error) {
        console.error("Failed to onboard property:", error);
        // Handle error (maybe show a toast or error message)
      }
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
    setSpaces((prev: SpaceInt[]) => [...prev, { type: "", name: "", assets: [] }]);
  };

  // Update Space Name
  const updateSpaceName = (index: number, name: string) => {
    setSpaces((prev: SpaceInt[]) => {
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

  // Step validators
  const validateStep1 = () => {
    return (
      formData.propertyName.trim() !== "" &&        // Property name not null
      formData.propertyDescription.trim() !== "" && // Property description not null
      formData.address.trim() !== ""                // Property address not null 
    );
  };

  const validateStep2 = () => {
    return (
      spaces.length > 0 && 
      spaces.every(
        s => s.name.trim() !== "" && 
        s.type.trim() !== "" &&
        s.assets.length > 0 && // Space must have at least one Asset
        s.assets.every(
          a => a.name.trim() !== "" && // Asset name not null
          a.typeId != "" &&            // Asset type not null
          a.features.length > 0 &&     // Asset must have at least one Feature
          a.features.every(f => f.name.trim() !== "" && f.value.trim() !== "") // Each feature must have its fields filled
        )
      )
    );
  };

  // Step validator mapping
  const stepValidators: Record<number, () => boolean> = {
    1: validateStep1,
    2: validateStep2
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, propertyName: e.target.value})}
                  
                />
              </div>
              <div>
                <Label htmlFor="propertyDescription">Description</Label>
                <Input
                  id="propertyDescription"
                  value={formData.propertyDescription}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, propertyDescription: e.target.value})}
                  
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, address: e.target.value})}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload('floorPlans', e.target.files)}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload('buildingPlans', e.target.files)}
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
                          onChange={(e) => updateAsset(spaceIndex, assetIndex, "description", e.target.value)}
                          
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
                          onChange={(e) => updateFeature(spaceIndex, assetIndex, featureIndex, "name", e.target.value)}
                          
                        />
                        <Input
                          placeholder="Feature Value"
                          value={feature.value}
                          onChange={(e) => updateFeature(spaceIndex, assetIndex, featureIndex, "value", e.target.value)}
                          
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

            {/* General Info */}
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-lg">General Information</h3>
              <p>
                <span className="font-medium">Property Name:</span>{" "}
                {formData.propertyName || "Not provided"}
              </p>
              <p>
                <span className="font-medium">Description:</span>{" "}
                {formData.propertyDescription || "Not provided"}
              </p>
              <p>
                <span className="font-medium">Address:</span>{" "}
                {formData.address || "Not provided"}
              </p>
            </div>

            {/* Plans & Documents */}
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-lg">Plans & Documents</h3>

              {/* Floor Plans */}
              <div>
                <span className="font-medium">Floor Plans:</span>
                {formData.floorPlans.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {formData.floorPlans.map((file, idx) => (
                      <div key={idx} className="space-y-1">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Floor Plan ${idx + 1}`}
                          className="w-full h-40 object-cover rounded border"
                        />
                        <p className="text-xs text-muted-foreground">{file.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No floor plans uploaded</p>
                )}
              </div>

              {/* Building Plans */}
              <div>
                <span className="font-medium">Building Plans:</span>
                {formData.buildingPlans.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {formData.buildingPlans.map((file, idx) => (
                      <div key={idx} className="space-y-1">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Building Plan ${idx + 1}`}
                          className="w-full h-40 object-cover rounded border"
                        />
                        <p className="text-xs text-muted-foreground">{file.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No building plans uploaded</p>
                )}
              </div>
            </div>

            {/* Spaces */}
            <div className="border rounded-lg p-4 space-y-1">
              {spaces.length === 0 ? (
                <p className="text-muted-foreground">
                  No spaces added yet.
                </p> // Fallback in case no spaces exist past the validation
              ) : (
                <ul className="space-y-4">
                  {spaces.map((space, spaceIndex) => (
                    <li key={spaceIndex} className="list-disc pl-6">
                      {/* Space */}
                      <span className="font-medium">
                        {space.type || "No Type Selected"} - {space.name || "Unnamed Room"}
                      </span>

                      {/* Assets */}
                      <div className="p-4">
                        {space.assets.length > 0 ? (
                          <ul className="list-disc pl-6 space-y-2 mt-3">
                            {space.assets.map((asset, assetIndex) => (
                              <li key={assetIndex}>
                                <span className="font-medium">
                                  {asset.name || "Unnamed Asset"}
                                </span>
                                {asset.description && (
                                  <span className="text-muted-foreground">
                                    {" "}— {asset.description}
                                  </span>
                                )}

                                {/* Asset Features */}
                                <div className="p-4">
                                  {asset.features && asset.features.length > 0 && (
                                    <ul className="pl-2 mt-3 space-y-2 text-sm text-muted-foreground">
                                      {asset.features.map((feature, featureIndex) => (
                                        <li key={featureIndex}>
                                          {feature.name || "Unnamed Feature"}:{" "}
                                          {feature.value || "No Value"}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="ml-6 text-sm text-muted-foreground">
                            No assets added.
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
              disabled={stepValidators[currentStep] ? !stepValidators[currentStep]() : false}
            >
              {currentStep === steps.length ? "Complete Onboarding" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}