// backend/PropertyEditService.ts
import {supabase} from "../config/supabaseClient";
import { createChangeLogEntry, ChangeLogAction } from "./ChangeLogService";
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
  //
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.total_floor_area !== undefined) updateData.total_floor_area = updates.total_floor_area;
    
    updateData.last_updated = new Date().toISOString();

    const { data, error } = await supabase
      .from("Property")
      .update(updateData)
      .eq("property_id", propertyId)
      .select()
      .single();

    if (error) {
      console.error("Error updating property:", error);
      throw new Error(`Failed to update property: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in updateProperty:", error);
    throw error;
  }
}

/**
 * Updates space information
 */
export async function updateSpace(spaceId: string, updates: SpaceUpdate): Promise<any> {
  // backend
  return await apiClient.updateSpace(spaceId, updates);
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;

    const { data, error } = await supabase
      .from("Spaces")
      .update(updateData)
      .eq("id", spaceId)
      .select()
      .single();

    if (error) {
      console.error("Error updating space:", error);
      throw new Error(`Failed to update space: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in updateSpace:", error);
    throw error;
  }
}

/**
 * Soft deletes a space by setting deleted = TRUE
 */
export async function deleteSpace(spaceId: string): Promise<boolean> {
  // backend
  return await apiClient.deleteSpace(spaceId);
  try {
    // First, soft delete all assets in the space
    const { data: assets } = await supabase
      .from("Assets")
      .select("id, current_specifications, AssetTypes!inner(name)")
      .eq("space_id", spaceId)
      .eq("deleted", false);

    // Create changelog entries for all deleted assets
    if (assets) {
      for (const asset of assets) {
        await createChangeLogEntry(
          asset.id,
          `Asset deleted as part of space deletion`,
          ChangeLogAction.DELETED,
          asset.current_specifications
        );
      }
    }

    // Soft delete all assets
    const { error: assetsError } = await supabase
      .from("Assets")
      .update({ deleted: true })
      .eq("space_id", spaceId);

    if (assetsError) throw assetsError;

    // Soft delete the space
    const { error } = await supabase
      .from("Spaces")
      .update({ deleted: true })
      .eq("id", spaceId);

    if (error) {
      console.error("Error deleting space:", error);
      throw new Error(`Failed to delete space: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error("Error in deleteSpace:", error);
    throw error;
  }
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
  try {
    // Validate at least one asset
    if (!assets || assets.length === 0) {
      throw new Error("At least one asset is required to create a space");
    }

    // Validate each asset has at least one feature
    for (const asset of assets) {
      if (!asset.specifications || Object.keys(asset.specifications).length === 0) {
        throw new Error("Each asset must have at least one feature");
      }
    }

    // Create the space
    const { data: space, error: spaceError } = await supabase
      .from("Spaces")
      .insert({
        property_id: propertyId,
        name: spaceName,
        type: spaceType
      })
      .select()
      .single();

    if (spaceError) throw spaceError;

    // Create assets with specifications
    for (const asset of assets) {
      const { data: createdAsset, error: assetError } = await supabase
        .from("Assets")
        .insert({
          space_id: space.id,
          asset_type_id: asset.assetTypeId,
          description: asset.description,
          current_specifications: asset.specifications
        })
        .select()
        .single();

      if (assetError) throw assetError;

      // Create changelog entry
      await createChangeLogEntry(
        createdAsset.id,
        `Asset created in ${spaceName}`,
        ChangeLogAction.CREATED,
        asset.specifications
      );
    }

    return space;
  } catch (error) {
    console.error("Error in createSpace:", error);
    throw error;
  }
}

/**
 * Updates asset description and creates changelog
 */
export async function updateAsset(assetId: string, updates: AssetUpdate): Promise<any> {
  // backend
  return await apiClient.updateAsset(assetId, updates);

  try {
    const updateData: any = {};
    
    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    if (updates.current_specifications !== undefined) {
      updateData.current_specifications = updates.current_specifications;
    }

    const { data, error } = await supabase
      .from("Assets")
      .update(updateData)
      .eq("id", assetId)
      .select(`
        *,
        AssetTypes!inner(id, name, discipline),
        Spaces!inner(id, name, property_id)
      `)
      .single();

    if (error) {
      console.error("Error updating asset:", error);
      throw new Error(`Failed to update asset: ${error.message}`);
    }

    // Create changelog entry with full snapshot
    await createChangeLogEntry(
      assetId,
      `Asset updated: ${data.AssetTypes.name}`,
      ChangeLogAction.UPDATED,
      data.current_specifications
    );

    return data;
  } catch (error) {
    console.error("Error in updateAsset:", error);
    throw error;
  }
}

/**
 * Soft deletes an asset
 */
export async function deleteAsset(assetId: string): Promise<boolean> {
  // backend
  return await apiClient.deleteAsset(assetId);
  try {
    // Get current asset data
    const { data: asset } = await supabase
      .from("Assets")
      .select("*, AssetTypes!inner(name), Spaces!inner(name)")
      .eq("id", assetId)
      .single();

    if (!asset) throw new Error("Asset not found");

    // Create changelog entry before deletion
    await createChangeLogEntry(
      assetId,
      `Asset deleted: ${asset.AssetTypes.name} in ${asset.Spaces.name}`,
      ChangeLogAction.DELETED,
      asset.current_specifications
    );

    // Soft delete
    const { error } = await supabase
      .from("Assets")
      .update({ deleted: true })
      .eq("id", assetId);

    if (error) {
      console.error("Error deleting asset:", error);
      throw new Error(`Failed to delete asset: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error("Error in deleteAsset:", error);
    throw error;
  }
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
  try {
    // Validate at least one feature
    if (!specifications || Object.keys(specifications).length === 0) {
      throw new Error("At least one feature is required to create an asset");
    }

    const { data, error } = await supabase
      .from("Assets")
      .insert({
        space_id: spaceId,
        asset_type_id: assetTypeId,
        description,
        current_specifications: specifications
      })
      .select(`
        *,
        AssetTypes!inner(id, name, discipline),
        Spaces!inner(id, name, property_id)
      `)
      .single();

    if (error) {
      console.error("Error creating asset:", error);
      throw new Error(`Failed to create asset: ${error.message}`);
    }

    // Create changelog entry
    await createChangeLogEntry(
      data.id,
      `Asset created: ${data.AssetTypes.name} in ${data.Spaces.name}`,
      ChangeLogAction.CREATED,
      specifications
    );

    return data;
  } catch (error) {
    console.error("Error in createAsset:", error);
    throw error;
  }
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
  try {
    // Get current asset
    const { data: asset } = await supabase
      .from("Assets")
      .select("current_specifications, AssetTypes!inner(name), Spaces!inner(name)")
      .eq("id", assetId)
      .single();

    if (!asset) throw new Error("Asset not found");

    // Merge new features with existing
    const updatedSpecifications = {
      ...asset.current_specifications,
      ...features
    };

    // Update asset
    const { data, error } = await supabase
      .from("Assets")
      .update({ current_specifications: updatedSpecifications })
      .eq("id", assetId)
      .select(`
        *,
        AssetTypes!inner(id, name, discipline),
        Spaces!inner(id, name, property_id)
      `)
      .single();

    if (error) throw error;

    // Create changelog entry
    const changedFeatures = Object.keys(features).join(", ");
    await createChangeLogEntry(
      assetId,
      `Features updated: ${changedFeatures}`,
      ChangeLogAction.UPDATED,
      updatedSpecifications
    );

    return data;
  } catch (error) {
    console.error("Error in updateFeatures:", error);
    throw error;
  }
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
  try {
    // Get current asset
    const { data: asset } = await supabase
      .from("Assets")
      .select("current_specifications, AssetTypes!inner(name), Spaces!inner(name)")
      .eq("id", assetId)
      .single();

    if (!asset) throw new Error("Asset not found");

    // Store the deleted feature for the changelog
    const deletedFeature = { [featureName]: asset.current_specifications[featureName] };

    // Remove feature
    const updatedSpecifications = { ...asset.current_specifications };
    delete updatedSpecifications[featureName];

    // Update asset
    const { error } = await supabase
      .from("Assets")
      .update({ current_specifications: updatedSpecifications })
      .eq("id", assetId);

    if (error) throw error;

    // Create changelog entry with the deleted feature (not the updated state)
    await createChangeLogEntry(
      assetId,
      `Feature deleted: ${featureName}`,
      ChangeLogAction.DELETED,
      deletedFeature
    );

    return { success: true, updatedSpecifications };
  } catch (error) {
    console.error("Error in deleteFeature:", error);
    throw error;
  }
}

/**
 * Gets all asset types for dropdown selection
 */
export async function getAssetTypes(): Promise<any[]> {
  // backend
  return await apiClient.getAssetTypes();
  try {
    const { data, error } = await supabase
      .from("AssetTypes")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching asset types:", error);
    throw error;
  }
}