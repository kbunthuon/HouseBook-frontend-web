export interface SignupData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  userType: "admin" | "owner";
};

export type Property = { 
  property_id: string;
  address: string; 
  description: string; 
  pin: string; 
  name: string; 
  type: string; 
  status: string; 
  lastUpdated: string; 
  completionStatus: number; 
  totalFloorArea: number;
  spaces: Space[];
  images: string[];
  created_at: string;
};

export type Space = {
  space_id?: string;
  name: string;
  type: string;
  assets: Asset[];
};

export type Asset = {
  asset_id: string;
  type: string;
  description: string;
  name?: string;
};

export type Owner = {
  owner_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

// Setting what OwnerData looks like
export interface OwnerData {
  firstName: string,
  lastName: string,
  address: string,
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

export interface LoginResponse {
  email: string;
  userType: "admin" | "owner";
  userId: string;
}

export interface AssetType {
  id: string;
  name: string;
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

export interface ChangeLog {
  property_id: string;
  changelog_id: string;
  changelog_specifications: Record<string, any>;
  changelog_description: string;
  changelog_status: "pending" | "approved" | "rejected" | "ACCEPTED"; // unify later
  changelog_created_at: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}