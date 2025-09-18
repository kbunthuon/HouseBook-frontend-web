const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

import { Property, Space, Asset, Owner, AssetType, ChangeLog} from "../types";

export const fetchPropertiesByUserId = async (userId: string): Promise<Property[]> => {
  const res = await fetch(`${BACKEND_URL}/properties/${userId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch properties: ${res.statusText}`);
  }
  const data = await res.json();
  return data.properties || [];
};

export const getAssetTypes = async (): Promise<AssetType[] | { error: string }> => {
  try {
    const res = await fetch(`${BACKEND_URL}/asset-types`);
    if (!res.ok) {
      const data = await res.json();
      return { error: data.error || "Failed to fetch asset types" };
    }
    const data = await res.json();
    return data.assetTypes || [];
  } catch (err: any) {
    return { error: err.message || "Failed to fetch asset types" };
  }
};

export const getSpaceEnums = async (): Promise<string[] | { error: string }> => {
  try {
    const res = await fetch(`${BACKEND_URL}/space-enum`);
    if (!res.ok) {
      const data = await res.json();
      return { error: data.error || "Failed to fetch space types" };
    }
    const data = await res.json();
    return data.spaceTypes || [];
  } catch (err: any) {
    return { error: err.message || "Failed to fetch space types" };
  }
};

// Fetch property details by propertyId
export const getPropertyDetails = async (
  propertyId: string
): Promise<Property | { error: string }> => {
  try {
    const res = await fetch(`${BACKEND_URL}/property/${propertyId}`);
    if (!res.ok) {
      const data = await res.json();
      return { error: data.error || "Failed to fetch property details" };
    }
    const data = await res.json();
    return data.property;
  } catch (err: any) {
    return { error: err.message || "Unexpected error fetching property details" };
  }
};

// Fetch owners for a given propertyId
export const getPropertyOwners = async (
  propertyId: string
): Promise<Owner[] | { error: string }> => {
  try {
    const res = await fetch(`${BACKEND_URL}/property/${propertyId}/owners`);
    if (!res.ok) {
      const data = await res.json();
      return { error: data.error || "Failed to fetch owners" };
    }
    const data = await res.json();
    return data.owners;
  } catch (err: any) {
    return { error: err.message || "Unexpected error fetching owners" };
  }
};

// Get userId by email
export const getUserIdByEmail = async (
  email: string
): Promise<string | { error: string }> => {
  try {
    const res = await fetch(`${BACKEND_URL}/userId?email=${encodeURIComponent(email)}`);
    if (!res.ok) {
      const data = await res.json();
      return { error: data.error || "Failed to fetch userId" };
    }
    const data = await res.json();
    return data.userId;
  } catch (err: any) {
    return { error: err.message || "Unexpected error fetching userId" };
  }
};

// Fetch ownerId by userId
export const getOwnerId = async (userId: string): Promise<{ ownerId?: string; error?: string }> => {
  try {
    const res = await fetch(`${BACKEND_URL}/owner/${userId}`);
    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || "Failed to fetch owner ID" };
    }

    return { ownerId: data.ownerId };
  } catch (err: any) {
    return { error: err.message || "Unknown error" };
  }
};


// Fetch properties by userId
export const getProperty = async (
  userId: string
): Promise<Property[] | { error: string }> => {
  try {
    const res = await fetch(`${BACKEND_URL}/properties/${userId}`);
    if (!res.ok) {
      const data = await res.json();
      return { error: data.error || "Failed to fetch properties" };
    }
    const data = await res.json();
    return data.properties;
  } catch (err: any) {
    return { error: err.message || "Unexpected error fetching properties" };
  }
};

export const fetchChangeLogs = async (
  propertyIds: string[]
): Promise<{ changes?: ChangeLog[]; error?: string }> => {
  try {
    const res = await fetch(`${BACKEND_URL}/changelogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyIds }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.error || "Failed to fetch change logs" };
    }

    const data = await res.json();
    return { changes: data.changes };
  } catch (err: any) {
    return { error: err.message || "Failed to fetch change logs" };
  }
};