// routes.ts
// API Routes Configuration for Housebook Backend

const BASE_URL = "https://housebook-backend.vercel.app/api";

export const API_ROUTES = {
  // Base URL
  BASE_URL,

  // Authentication Routes
  AUTH: {
    LOGIN: `${BASE_URL}/auth?action=login`,
    SIGNUP: `${BASE_URL}/auth?action=signup`,
    VERIFY: `${BASE_URL}/auth/verify`,
    REFRESH: `${BASE_URL}/refresh`,
  },

  // User Routes ------ will need to update soon?
  USER: {
    INFO_BY_EMAIL: (email: string) => `${BASE_URL}/user/infoByEmail?email=${encodeURIComponent(email)}`,
  },

  // Owner Routes
  OWNER: {
    GET_ID: (userId: string) => `${BASE_URL}/owner?userId=${userId}`,
    ONBOARD_PROPERTY: `${BASE_URL}/owner/onboard`,
  },

  // Admin Routes
  ADMIN: {
    ONBOARD_PROPERTY: `${BASE_URL}/admin/onboard`,
  },

  // Property Routes
  PROPERTY: {
    LIST: (userId: string) => `${BASE_URL}/property?action=list&userId=${userId}`,
    OWNERS: (propertyId: string) => `${BASE_URL}/property?action=owners&propertyId=${propertyId}`,
    DETAILS: (propertyId: string) => `${BASE_URL}/property?action=details&propertyId=${propertyId}`,
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
  },

  // Changelog Routes
  CHANGELOG: {
    GET: (propertyIds: string[]) => `${BASE_URL}/changelog?propertyIds=${propertyIds.join(",")}`,
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