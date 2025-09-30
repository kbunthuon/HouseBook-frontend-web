// src/services/ChangeLogService.ts
import supabase from "../config/supabaseClient";

export enum ChangeLogStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface ChangeLogEntry {
  id: string;
  asset_id: string;
  specifications: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    timestamp: string;
  };
  change_description: string;
  changed_by_user_id?: string;
  created_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  // Joined data from the query
  Assets?: {
    id: string;
    AssetTypes?: {
      name: string;
    };
    Spaces?: {
      id: string;
      name: string;
      property_id: string;
    };
  };
}

/**
 * Creates a changelog entry when an asset is modified
 * @param assetId - ID of the modified asset
 * @param changeDescription - Description of what was changed
 * @param oldSpecs - Previous specifications
 * @param newSpecs - New specifications
 * @returns Created changelog entry
 */
export async function createChangeLogEntry(
  assetId: string,
  changeDescription: string,
  oldSpecs: Record<string, any> = {},
  newSpecs: Record<string, any> = {}
): Promise<ChangeLogEntry> {
  try {
    const specifications = {
      before: oldSpecs,
      after: newSpecs,
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("ChangeLog")
      .insert({
        asset_id: assetId,
        specifications,
        change_description: changeDescription,
        changed_by_user_id: (await supabase.auth.getUser()).data.user?.id || null,
        status: ChangeLogStatus.APPROVED
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating changelog entry:", error);
      throw new Error(`Failed to create changelog entry: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in createChangeLogEntry:", error);
    throw error;
  }
}

/**
 * Gets changelog entries for a specific asset
 * @param assetId - ID of the asset
 * @returns Array of changelog entries for the asset
 */
export async function getAssetHistory(assetId: string): Promise<ChangeLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from("ChangeLog")
      .select(`
        *,
        Assets!inner(
          id,
          AssetTypes!inner(name),
          Spaces!inner(
            id,
            name,
            property_id
          )
        )
      `)
      .eq("asset_id", assetId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching asset history:", error);
      throw new Error(`Failed to fetch asset history: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAssetHistory:", error);
    throw error;
  }
}

/**
 * Gets changelog entries for all assets in a specific space
 * @param spaceId - ID of the space
 * @returns Array of changelog entries for all assets in the space
 */
export async function getSpaceHistory(spaceId: string): Promise<ChangeLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from("ChangeLog")
      .select(`
        *,
        Assets!inner(
          id,
          space_id,
          AssetTypes!inner(name),
          Spaces!inner(
            id,
            name,
            property_id
          )
        )
      `)
      .eq("Assets.space_id", spaceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching space history:", error);
      throw new Error(`Failed to fetch space history: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Error in getSpaceHistory:", error);
    throw error;
  }
}

/**
 * Gets changelog entries for all assets in a specific property
 * @param propertyId - ID of the property
 * @returns Array of changelog entries for all assets in the property
 */
export async function getPropertyHistory(propertyId: string): Promise<ChangeLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from("ChangeLog")
      .select(`
        *,
        Assets!inner(
          id,
          AssetTypes!inner(name),
          Spaces!inner(
            id,
            name,
            property_id
          )
        )
      `)
      .eq("Assets.Spaces.property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching property history:", error);
      throw new Error(`Failed to fetch property history: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Error in getPropertyHistory:", error);
    throw error;
  }
}

/**
 * Updates the PropertyEditService functions to automatically create changelog entries
 */
export async function updateAssetWithHistory(
  assetId: string,
  updates: { type?: string; description?: string },
  changeDescription?: string
): Promise<any> {
  try {
    // First, get the current asset data for changelog
    const { data: currentAsset, error: fetchError } = await supabase
      .from("Assets")
      .select(`
        *,
        AssetTypes!inner(name),
        Spaces!inner(name)
      `)
      .eq("id", assetId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch current asset: ${fetchError.message}`);
    }

    const oldSpecs = {
      type: currentAsset.AssetTypes.name,
      description: currentAsset.description
    };

    // Update the asset (reuse existing updateAsset function)
    const { updateAsset } = await import('./PropertyEditService');
    const updatedAsset = await updateAsset(assetId, updates);

    const newSpecs = {
      type: updates.type || currentAsset.AssetTypes.name,
      description: updates.description || currentAsset.description
    };

    // Create changelog entry
    const description = changeDescription || 
      `Updated ${updates.type ? 'type' : ''}${updates.type && updates.description ? ' and ' : ''}${updates.description ? 'description' : ''} for ${currentAsset.AssetTypes.name} in ${currentAsset.Spaces.name}`;

    await createChangeLogEntry(assetId, description, oldSpecs, newSpecs);

    return updatedAsset;
  } catch (error) {
    console.error("Error in updateAssetWithHistory:", error);
    throw error;
  }
}