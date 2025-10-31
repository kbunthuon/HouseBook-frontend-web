// routes.ts
// API Routes Configuration for Housebook Backend

//const BASE_URL = "https://housebook-backend.vercel.app/api";

// This is the url for backend on "move-refresh-to-ss" branch
// As of now, refreshing token doesnt work properly for super short JWT TTLs, so set to 3600s (1 hour)
// ------- UPDATE ------- works now with short TTLs (300s) with refresh token in body
// But this fixes the restrictive CORS policy on Vercel for all endpoints
// Change to allow all origins, but refresh token verification done via req body instead of cookies (security risk..?)
const BASE_URL = "https://housebook-backend-5v23yigxj-kenneth-lims-projects-dffe5cf5.vercel.app/api";

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
  },


  // Transfer Routes
  TRANSFER: {
    GET: (params: { action: "byOwner" | "byProperty"; id: string }) =>
      `${BASE_URL}/transfer?action=${params.action}&${params.action === "byOwner" ? `userId=${params.id}` : `propertyId=${params.id}`}`,

    INITIATE: `${BASE_URL}/transfer`,
    APPROVE: (transferId: string, ownerId: string) =>
      `${BASE_URL}/transfer?action=approve&transferId=${transferId}&ownerId=${ownerId}`,
    REJECT: (transferId: string, ownerId: string) =>
      `${BASE_URL}/transfer?action=reject&transferId=${transferId}&ownerId=${ownerId}`,
    GET_BY_PROPERTY: (propertyId: string) => `${BASE_URL}/transfer?propertyId=${encodeURIComponent(propertyId)}`,
    GET_BY_USER: (userId: string) => `${BASE_URL}/transfer?userId=${encodeURIComponent(userId)}`,
  },

} as const;

// Type definitions for route parameters
export interface LoginParams {
  email: string;
  password: string;
}

export interface OwnerOnboardParams {
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
