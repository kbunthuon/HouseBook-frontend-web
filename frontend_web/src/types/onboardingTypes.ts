export interface OwnerData {
  firstName: string,
  lastName: string,
  email: string,
  phone: string
}

// Setting what FormData looks like
export interface FormData {
    // Basic Information
    propertyName: string,
    propertyDescription: string,
    address: string,
    // Plans & Documents
    floorPlans: File[],
    buildingPlans: File[]
}

// Setting what an Asset or Space looks like
export interface AssetFeature {
  name: string;
  value: string;
}

export interface AssetInt {
  typeId: string;
  name: string;  // Only to display in the frontend, name is not stored in database
  description: string; // description is stored in database
  features: AssetFeature[];
}

export interface SpaceInt {
  type: string;
  name: string;
  assets: AssetInt[];
}