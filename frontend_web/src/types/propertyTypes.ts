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
  totalFloorArea?: number;
  spaces?: Space[];
  images?: string[];
  created_at: string;
  splash_image?: string;
};

export type Space = {
  space_id: string;
  name: string;
  type: string;
  assets: Asset[];
};

export type Asset = {
  asset_id: string;
  type: string;
  description: string;
};
