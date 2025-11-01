// backend/ChangeLogService.ts
import supabase from "../config/supabaseClient";
import { ChangeLog } from "@housebookgroup/shared-types";
import { apiClient } from "../frontend_web/src/shared/api/wrappers";

export enum ChangeLogStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED'
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
    const outData = await apiClient.getAssetHistory(assetId);
    console.log("getAssetHistory outData:", outData);
    if(outData){
      return outData;
    }

    // --------------- Already handled in apiClient above ---------------
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
    const outData = await apiClient.getSpaceHistory(spaceId);
    console.log("getSpaceHistory outData:", outData);
    if(outData){
      return outData;
    }

    //--------------- Already handled in apiClient above ---------------
    // 1) fetch asset IDs for the space (including soft-deleted assets)
    const { data: assets, error: assetsErr } = await supabase
      .from("Assets")
      .select("id")
      .eq("space_id", spaceId);

    if (assetsErr) {
      console.error("Error fetching assets for space:", assetsErr);
      throw new Error(`Failed to fetch assets for space: ${assetsErr.message}`);
    }

    const assetIds = (assets || []).map((a: any) => a.id).filter(Boolean);

    if (assetIds.length === 0) {
      return [];
    }

    // 2) fetch changelog entries for those assets
    const { data, error } = await supabase
      .from("ChangeLog")
      .select(`
        *,
        Assets(
          id,
          description,
          deleted,
          AssetTypes(name),
          Spaces(id, name, property_id, deleted)
        )
      `)
      .in("asset_id", assetIds)
      .eq("status", ChangeLogStatus.ACCEPTED)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching space history:", error);
      throw new Error(`Failed to fetch space history: ${error.message}`);
    }

    // filter out any entries where Assets relation could not be joined
    return (data || []).filter((entry: any) => entry.Assets !== null);
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
    const outData = await apiClient.getPropertyHistory(propertyId);
    console.log("getPropertyHistory outData:", outData);
    if(outData){
      return outData;
    }


    // --------------- Already handled in apiClient above ---------------
    // Step 1: Get all spaces for this property (including soft-deleted)
    const { data: spaces, error: spacesError } = await supabase
      .from("Spaces")
      .select("id")
      .eq("property_id", propertyId);

    if (spacesError) {
      console.error("Error fetching spaces for property:", spacesError);
      throw new Error(`Failed to fetch spaces for property: ${spacesError.message}`);
    }

    const spaceIds = (spaces || []).map((s: any) => s.id).filter(Boolean);

    if (spaceIds.length === 0) {
      console.log("No spaces found for property:", propertyId);
      return [];
    }

    // Step 2: Get all assets for those spaces (including soft-deleted)
    const { data: assets, error: assetsError } = await supabase
      .from("Assets")
      .select("id")
      .in("space_id", spaceIds);

    if (assetsError) {
      console.error("Error fetching assets for spaces:", assetsError);
      throw new Error(`Failed to fetch assets for spaces: ${assetsError.message}`);
    }

    const assetIds = (assets || []).map((a: any) => a.id).filter(Boolean);

    if (assetIds.length === 0) {
      console.log("No assets found for property:", propertyId);
      return [];
    }

    // Step 3: Get all changelog entries for those assets
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
      .in("asset_id", assetIds)
      .eq("status", ChangeLogStatus.ACCEPTED)
      .order("created_at", { ascending: false });

    console.log("getPropertyHistory result:", data?.length, "entries for property:", propertyId);

    if (error) {
      console.error("Error fetching property history:", error);
      throw new Error(`Failed to fetch property history: ${error.message}`);
    }

    // Filter out any entries where Assets relation could not be joined
    return (data || []).filter((entry: any) => entry.Assets !== null);
  } catch (error) {
    console.error("Error in getPropertyHistory:", error);
    throw error;
  }
}




// export const approveEdit = async (id: string) => {
//     const { data, error } = await supabase
//       .from("ChangeLog")
//       .update({ status: "ACCEPTED" })
//       .eq("id", id);

//     if (error) {
//       console.error("Error updating change log status:", error);
//     } else {
//       console.log(`Approved edit ${id}`);
//       setRequests(prev =>
//       prev.map(r =>
//         r.changelog_id === id ? { ...r, changelog_status: "ACCEPTED" } : r
//       )
//       );

//     }
//   };

// export const rejectEdit = async (id: string) => {
//     const { data, error } = await supabase
//       .from("ChangeLog")
//       .update({ status: "DECLINED" })
//       .eq("id", id);

//     if (error) {
//       console.error("Error updating change log status:", error);
//     } else {
//       console.log(`Declined edit ${id}`);
//       setRequests(prev =>
//       prev.map(r =>
//         r.changelog_id === id ? { ...r, changelog_status: "DECLINED" } : r
//       )
//       );
//     }
//   }