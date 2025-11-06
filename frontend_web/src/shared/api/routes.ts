// routes.ts
// API Routes Configuration for Housebook Backend

const BASE_URL = "https://housebook-backend-ehwcbj9oo-group-11s-projects.vercel.app/api";

export const API_ROUTES = {
  // Base URL
  BASE_URL,

  // Authentication Routes
  AUTH: {
    LOGIN: `${BASE_URL}/auth?action=login`,
    SIGNUP: `${BASE_URL}/auth?action=signup`,
    VERIFY: `${BASE_URL}/auth/verify`,
    REFRESH: `${BASE_URL}/refresh`,
    LOGOUT: `${BASE_URL}/logout`,
  },

  // User Routes ------ will need to update soon?
  USER: {
    INFO_BY_EMAIL: (email: string) =>
      `${BASE_URL}/user?action=getUserInfoByEmail&email=${encodeURIComponent(email)}`,

    INFO_BY_OWNER_ID: (ownerId: string) =>
      `${BASE_URL}/user?action=getUserInfoByOwnerId&ownerId=${encodeURIComponent(ownerId)}`,
  },

  // Owner Routes
  OWNER: {
    GET_ID: (userId: string) => `${BASE_URL}/owner?userId=${userId}`,
    ONBOARD_PROPERTY: `${BASE_URL}/owner?action=onboarding`,
    GET_OWNER_ID_BY_USER: (userId: string) => `${BASE_URL}/owner/id?userId=${userId}`,
  },

  // Admin Routes
  ADMIN: {
    ONBOARD_PROPERTY: `${BASE_URL}/admin?action=onboarding`,
    GET_ADMIN_PROPERTIES: (userId: string, userType: string) => 
      `${BASE_URL}/admin?action=getAdminProperty&userId=${encodeURIComponent(userId)}&userType=${encodeURIComponent(userType)}`,
    GET_ALL_OWNERS: `${BASE_URL}/admin?action=getAllOwners`,
  },

  // Property Routes
  PROPERTY: {
    LIST: (userId: string) =>
      `${BASE_URL}/property?action=list&userId=${userId}`,
    OWNERS: (propertyId: string) =>
      `${BASE_URL}/property?action=owners&propertyId=${propertyId}`,
    DETAILS: (propertyId: string) =>
      `${BASE_URL}/property?action=details&propertyId=${propertyId}`,

    ASSET_TYPES: `${BASE_URL}/property?action=assetTypes`,

    // Update routes (PATCH)
    UPDATE_PROPERTY: `${BASE_URL}/property?action=updateProperty`,
    UPDATE_SPACE: `${BASE_URL}/property?action=updateSpace`,
    UPDATE_ASSET: `${BASE_URL}/property?action=updateAsset`,
    UPDATE_FEATURES: `${BASE_URL}/property?action=updateFeatures`,

    // Create routes (POST)
    CREATE_SPACE: `${BASE_URL}/property?action=createSpace`,
    CREATE_ASSET: `${BASE_URL}/property?action=createAsset`,

    // Delete routes (DELETE)
    DELETE_SPACE: (spaceId: string) =>
      `${BASE_URL}/property?action=deleteSpace&spaceId=${spaceId}`,
    DELETE_ASSET: (assetId: string) =>
      `${BASE_URL}/property?action=deleteAsset&assetId=${assetId}`,
    DELETE_FEATURE: (assetId: string, featureName: string) =>
      `${BASE_URL}/property?action=deleteFeature&assetId=${assetId}&featureName=${encodeURIComponent(featureName)}`,
  },



  // Images Routes
  IMAGES: {
    GET: (propertyId: string, imageName?: string) => {
      let url = `${BASE_URL}/images?propertyId=${propertyId}`;
      if (imageName) {
        url += `&imageName=${encodeURIComponent(imageName)}`;
      }
      return url;
    },
    UPLOAD: `${BASE_URL}/images`,
    DELETE: `${BASE_URL}/images`,
    PATCH: `${BASE_URL}/images`,
  },

  // Videos Routes
  VIDEOS: {
    GET_UPLOAD_URL: (propertyId: string, fileName: string) => {
      return `${BASE_URL}/images?propertyId=${propertyId}&action=getVideoUploadUrl&fileName=${encodeURIComponent(
        fileName
      )}`;
    },
    RECORD_UPLOAD: `${BASE_URL}/images?action=recordVideoUpload`, // POST to record in db
  },

  // Changelog Routes
  CHANGELOG: {
    // Original: fetch multiple property change logs
    GET: (propertyIds: string[]) =>
      `${BASE_URL}/changelog?propertyIds=${encodeURIComponent(propertyIds.join(","))}`,

    // Fetch asset history
    ASSET_HISTORY: (assetId: string) =>
      `${BASE_URL}/changelog?action=getAssetHistory&assetId=${encodeURIComponent(assetId)}`,

    // Fetch space history
    SPACE_HISTORY: (spaceId: string) =>
      `${BASE_URL}/changelog?action=getSpaceHistory&spaceId=${encodeURIComponent(spaceId)}`,

    // Fetch property history
    PROPERTY_HISTORY: (propertyId: string) =>
      `${BASE_URL}/changelog?action=getPropertyHistory&propertyId=${encodeURIComponent(propertyId)}`,
    // Create changelog entry
    CREATE: `${BASE_URL}/changelog`,
  },


  // Transfer Routes
  TRANSFER: {
    GET: (params: { action: "byOwner" | "byProperty"; id: string }) =>
      `${BASE_URL}/transfer?action=${params.action}&${params.action === "byOwner" ? `userId=${params.id}` : `propertyId=${params.id}`}`,

    INITIATE: `${BASE_URL}/transfer`,
    GET_BY_PROPERTY: (propertyId: string) => `${BASE_URL}/transfer?propertyId=${encodeURIComponent(propertyId)}`,
    GET_BY_USER: (userId: string) => `${BASE_URL}/transfer?userId=${encodeURIComponent(userId)}`,

    // PATCH requests - action goes in query params, data in body
    APPROVE: (transferId: string, ownerId: string) =>
      `${BASE_URL}/transfer?action=approve`,
    
    REJECT: (transferId: string, ownerId: string) =>
      `${BASE_URL}/transfer?action=reject`,
  },
  

    // Jobs Routes
  JOBS: {
    // Fetch jobs for a property
    FETCH_JOBS: (propertyId: string, expired?: boolean | null, last?: number | null) => {
      let url = `${BASE_URL}/jobs?action=fetchJobs&propertyId=${encodeURIComponent(propertyId)}`;
      if (expired !== null && expired !== undefined) {
        url += `&expired=${expired}`;
      }
      if (last !== null && last !== undefined) {
        url += `&last=${last}`;
      }
      return url;
    },

    // Fetch job assets (with optional details)
    FETCH_JOB_ASSETS: (jobId: string, withDetails?: boolean) => {
      let url = `${BASE_URL}/jobs?action=fetchJobAssets&jobId=${encodeURIComponent(jobId)}`;
      if (withDetails) {
        url += `&withDetails=true`;
      }
      return url;
    },

    // Create job (POST)
    CREATE_JOB: `${BASE_URL}/jobs?action=createJob`,

    // Update job (POST)
    UPDATE_JOB: `${BASE_URL}/jobs?action=updateJob`,

    // Delete job (POST)
    DELETE_JOB: `${BASE_URL}/jobs?action=deleteJob`,
  },

} as const;

// Type definitions for route parameters
export interface LoginParams {
  email: string;
  password: string;
}

export interface OwnerOnboardParams {
  userId: string;
  formData: any;
  spaces: any[];
}

export interface AdminOnboardParams {
  ownerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  formData: any;
  spaces: any[];
}

export interface ImageUploadParams {
  propertyId: string;
  file: File;
  description?: string;
}
