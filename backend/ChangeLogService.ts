// backend/ChangeLogService.ts
import supabase from "../config/supabaseClient";
import { ChangeLog } from "@housebookgroup/shared-types";

export enum ChangeLogStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED'
}

export enum ChangeLogAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED'
}

/**
 * Creates a changelog entry when an asset is modified
 * Stores a full snapshot of the asset's current_specifications after the action
 */
export async function createChangeLogEntry(
  assetId: string,
  changeDescription: string,
  action: ChangeLogAction = ChangeLogAction.UPDATED,
  currentSpecifications: Record<string, any> = {}
): Promise<ChangeLog> {
  try {
    const { data, error } = await supabase
      .from("ChangeLog")
      .insert({
        asset_id: assetId,
        specifications: currentSpecifications, // Full snapshot after action
        change_description: changeDescription,
        changed_by_user_id: (await supabase.auth.getUser()).data.user?.id || null,
        status: ChangeLogStatus.ACCEPTED,
        actions: action
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
 * Gets changelog entries for a specific asset (only ACCEPTED status)
 * Includes soft-deleted assets in history
 */
export async function getAssetHistory(assetId: string): Promise<ChangeLog[]> {
  try {
    const { data, error } = await supabase
      .from("ChangeLog")
      .select(`
        *,
        Assets(
          id,
          description,
          deleted,
          AssetTypes!inner(name),
          Spaces!inner(
            id,
            name,
            property_id
          )
        )
      `)
      .eq("asset_id", assetId)
      .eq("status", ChangeLogStatus.ACCEPTED)
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
 * Gets changelog entries for all assets in a specific space (including deleted assets)
 */
export async function getSpaceHistory(spaceId: string): Promise<ChangeLog[]> {
  try {
    const { data, error } = await supabase
      .from("ChangeLog")
      .select(`
        *,
        Assets(
          id,
          description,
          deleted,
          AssetTypes(name),
          Spaces(
            id,
            name,
            property_id,
            deleted
          )
        )
      `)
      .eq("Assets.Spaces.id", spaceId)
      .eq("status", ChangeLogStatus.ACCEPTED)
      .order("created_at", { ascending: false });

    console.log("getSpaceHistory: ", data, spaceId);

    if (error) {
      console.error("Error fetching space history:", error);
      throw new Error(`Failed to fetch space history: ${error.message}`);
    }

    // Filter out entries where Assets is null (asset was hard-deleted)
    // This can happen if an asset's changelog entries remain after the asset is deleted
    return (data || []).filter(entry => entry.Assets !== null);
  } catch (error) {
    console.error("Error in getSpaceHistory:", error);
    throw error;
  }
}


/**
 * Gets changelog entries for all assets in a specific property (including deleted)
 */
export async function getPropertyHistory(propertyId: string): Promise<ChangeLog[]> {
  try {
    const { data, error } = await supabase
      .from("ChangeLog")
      .select(`
        *,
        Assets(
          id,
          description,
          deleted,
          AssetTypes!inner(name),
          Spaces!inner(
            id,
            name,
            property_id,
            deleted
          )
        )
      `)
      .eq("Assets.Spaces.property_id", propertyId)
      .eq("status", ChangeLogStatus.ACCEPTED)
      .order("created_at", { ascending: false });
      
      console.log("getPropertyHistory: ", data, propertyId);
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