// src/services/PropertyEditService.ts
import supabase from "../config/supabaseClient";

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
  type?: string;
  description?: string;
}

/**
 * Updates property information
 * @param propertyId - ID of the property to update
 * @param updates - Object containing fields to update
 * @returns Updated property object
 */
export async function updateProperty(propertyId: string, updates: PropertyUpdate): Promise<any> {
  try {
    // Prepare update object with only defined fields
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.total_floor_area !== undefined) updateData.total_floor_area = updates.total_floor_area;
    
    // Add timestamp
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
 * @param spaceId - ID of the space to update
 * @param updates - Object containing fields to update
 * @returns Updated space object
 */
export async function updateSpace(spaceId: string, updates: SpaceUpdate): Promise<any> {
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
 * Updates asset information including type changes
 * @param assetId - ID of the asset to update
 * @param updates - Object containing fields to update
 * @returns Updated asset object
 */
export async function updateAsset(assetId: string, updates: AssetUpdate): Promise<any> {
  try {
    const updateData: any = {};
    
    // Handle description update
    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }
    
    // Handle type update by finding or creating the AssetType
    if (updates.type !== undefined && updates.type !== '') {
      let assetTypeId: number;
      
      // Try to find existing asset type
      const { data: existingType, error: findError } = await supabase
        .from("AssetTypes")
        .select("id")
        .ilike("name", updates.type) // Case-insensitive search
        .single();

      if (existingType && !findError) {
        assetTypeId = existingType.id;
      } else {
        // Create new asset type if it doesn't exist
        const { data: newType, error: createError } = await supabase
          .from("AssetTypes")
          .insert({ name: updates.type, discipline: 'General' })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating asset type:", createError);
          throw new Error(`Failed to create asset type: ${createError.message}`);
        }
        
        if (!newType) {
          throw new Error("Failed to create asset type - no data returned");
        }
        
        assetTypeId = newType.id;
      }
      
      updateData.asset_type_id = assetTypeId;
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

    return data;
  } catch (error) {
    console.error("Error in updateAsset:", error);
    throw error;
  }
}

/**
 * Updates asset type by finding or creating the appropriate AssetTypes record
 * @param assetId - ID of the asset to update
 * @param newTypeName - New asset type name
 * @param updates - Other fields to update
 * @returns Updated asset object
 */
export async function updateAssetWithType(assetId: string, newTypeName: string, updates: Omit<AssetUpdate, 'type'>): Promise<any> {
  try {
    // First, find or create the asset type
    let assetTypeId: number;
    
    // Try to find existing asset type
    const { data: existingType, error: findError } = await supabase
      .from("AssetTypes")
      .select("id")
      .eq("name", newTypeName)
      .single();

    if (existingType) {
      assetTypeId = existingType.id;
    } else {
      // Create new asset type if it doesn't exist
      const { data: newType, error: createError } = await supabase
        .from("AssetTypes")
        .insert({ name: newTypeName, discipline: 'General' })
        .select("id")
        .single();

      if (createError || !newType) {
        throw new Error(`Failed to create asset type: ${createError?.message}`);
      }
      
      assetTypeId = newType.id;
    }

    // Update the asset with new type and other fields
    const updateData: any = {
      asset_type_id: assetTypeId,
      ...updates
    };

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
      console.error("Error updating asset with type:", error);
      throw new Error(`Failed to update asset: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in updateAssetWithType:", error);
    throw error;
  }
}

/**
 * Bulk update multiple assets in a space
 * @param spaceId - ID of the space containing the assets
 * @param assetUpdates - Array of asset updates with asset IDs
 * @returns Array of updated assets
 */
export async function updateSpaceAssets(spaceId: string, assetUpdates: Array<{ id: string; type?: string; description?: string }>): Promise<any[]> {
  try {
    const updatedAssets: any[] = [];

    for (const assetUpdate of assetUpdates) {
      if (assetUpdate.type && assetUpdate.type !== '') {
        // Update asset with new type
        const updated = await updateAssetWithType(
          assetUpdate.id, 
          assetUpdate.type, 
          { description: assetUpdate.description }
        );
        updatedAssets.push(updated);
      } else {
        // Update only description
        const updated = await updateAsset(
          assetUpdate.id, 
          { description: assetUpdate.description }
        );
        updatedAssets.push(updated);
      }
    }

    return updatedAssets;
  } catch (error) {
    console.error("Error in updateSpaceAssets:", error);
    throw error;
  }
}

/**
 * Gets property details with all related data for editing
 * @param propertyId - ID of the property
 * @returns Complete property object with spaces and assets
 */
export async function getPropertyForEdit(propertyId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("Property")
      .select(`
        *,
        Spaces!inner(
          id,
          name,
          type,
          Assets!inner(
            id,
            description,
            AssetTypes!inner(id, name, discipline)
          )
        )
      `)
      .eq("property_id", propertyId)
      .single();

    if (error) {
      console.error("Error fetching property for edit:", error);
      throw new Error(`Failed to fetch property: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in getPropertyForEdit:", error);
    throw error;
  }
}