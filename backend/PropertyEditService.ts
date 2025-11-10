// backend/PropertyEditService.ts
import { ChangeLogAction } from "./ChangeLogService";
import { apiClient } from "../frontend_web/src/api/wrappers";

// Types for update operations
export interface PropertyUpdate {
  name?: string;
  description?: string;
  address?: string;
  type?: string;
  total_floor_area?: number;
}

export interface SpaceUpdate {
  name?: string;
  type?: string;
}

export interface AssetUpdate {
  description?: string;
  current_specifications?: Record<string, any>;
}

export interface FeatureUpdate {
  [key: string]: any;
}

/**
 * Updates property information
 */
export async function updateProperty(propertyId: string, updates: PropertyUpdate): Promise<any> {
  // backend
  return await apiClient.updateProperty(propertyId, updates);
}

/**
 * Updates space information
 */
export async function updateSpace(spaceId: string, updates: SpaceUpdate): Promise<any> {
  // backend
  return await apiClient.updateSpace(spaceId, updates);
}

/**
 * Soft deletes a space by setting deleted = TRUE
 */
export async function deleteSpace(spaceId: string): Promise<boolean> {
  return await apiClient.deleteSpace(spaceId);
}

/**
 * Creates a new space with assets and features
 */
export async function createSpace(
  propertyId: string,
  spaceName: string,
  spaceType: string,
  assets: Array<{ assetTypeId: number; description: string; specifications: Record<string, any> }>
): Promise<any> {
  // backend
  return await apiClient.createSpace({propertyId, spaceName, spaceType, assets});
}

/**
 * Updates asset description and creates changelog
 */
export async function updateAsset(assetId: string, updates: AssetUpdate): Promise<any> {
  // backend
  return await apiClient.updateAsset(assetId, updates);
}

/**
 * Soft deletes an asset
 */
export async function deleteAsset(assetId: string): Promise<boolean> {
  // backend
  return await apiClient.deleteAsset(assetId);
}

/**
 * Creates a new asset in an existing space
 */
export async function createAsset(
  spaceId: string,
  assetTypeId: number,
  description: string,
  specifications: Record<string, any>
): Promise<any> {
  // backend
  return await apiClient.createAsset({spaceId, assetTypeId, description, specifications});
}

/**
 * Updates or adds features to an asset's current_specifications
 */
export async function updateFeatures(
  assetId: string,
  features: FeatureUpdate
): Promise<any> {
  // backend
  return await apiClient.updateFeatures(assetId, features);
}

/**
 * Deletes a feature from an asset's current_specifications
 */
export async function deleteFeature(
  assetId: string,
  featureName: string
): Promise<any> {
  // backend
  return await apiClient.deleteFeature(assetId, featureName);
}

/**
 * Gets all asset types for dropdown selection
 */
export async function getAssetTypes(): Promise<any[]> {
  // backend
  return await apiClient.getAssetTypes();
}