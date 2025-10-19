import supabase from "../config/supabaseClient";
import { Property, Space, Asset, Owner, AssetType, ChangeLog, ChangeLogAction, ChangeLogStatus } from "@housebookgroup/shared-types";

interface OwnerChangeLog {
  userEmail: string;
  userFirstName: string;
  userLastName: string;
}

// Takes in userId
// Returns the OwnerId if it exists, otherwise return null
export const getOwnerId = async (userId: string): Promise<string> => {
  console.log("userId in getOwnerId in FetchData", userId);
  const { data, error } = await supabase
    .from("Owner")
    .select("owner_id")
    .eq("user_id", userId)
    .maybeSingle();

  console.log("data in getOwnerId in FetchData", data);
  if (error) {
    console.error("Error fetching owner id:", error.message);
    return "";
  }

  return data?.owner_id || "";
};

// Takes in userId
// Returns property objects that the user owns
export const getProperty = async (userID: string): Promise<Property[]> => {
  const { data, error } = await supabase
    .from("owner_property_view")
    .select(`
      address,
      description,
      pin,
      property_name, 
      property_id,
      property_created_at,
      type,
      status,
      last_updated,
      completion_status,
      total_floor_area,
      splash_image
    `)
    .eq("user_id", userID)
    .order("property_created_at", { ascending: false });

  if (error) {
    console.error("Error fetching property id:", error.message);
    return [];
  }

  const properties: Property[] = data.map((row) => {
    const splashImageUrl = row.splash_image
      ? supabase.storage
          .from("PropertyImage")
          .getPublicUrl(row.splash_image)
          .data?.publicUrl ?? ""
      : "";

    return {
      propertyId: row.property_id,
      name: row.property_name,
      address: row.address,
      description: row.description,
      pin: row.pin,
      createdAt: row.property_created_at,
      type: row.type,
      status: row.status,
      lastUpdated: row.last_updated,
      completionStatus: row.completion_status,
      totalFloorArea: row.total_floor_area,
      spaces: [],
      images: [], 
      splashImage: splashImageUrl,
    };
  });

  return properties;
};

export const getChangeLogs = async (propertyIds: string[]) => {
  const { data: changes, error } = await supabase
    .from("changelog_with_assets")
    .select(`
      id,
      asset_id,
      specifications,
      change_description,
      status,
      changed_by_user_id,
      created_at,
      actions,
      asset_description,
      space_name,
      property_id,
      user:User!changed_by_user_id (
        first_name,
        last_name,
        email
      )
    `)
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching changelogs:", error.message);
    return null;
  }

  const changelogs: OwnerChangeLog[] = changes.map((row: any) => ({
    id: row.id,
    assetId: row.asset_id,
    specifications: row.specifications,
    changeDescription: row.change_description,
    changedByUserId: row.changed_by_user_id,
    created_at: row.created_at,
    status: row.status as ChangeLogStatus,
    actions: row.actions as ChangeLogAction,
    deleted: false, 
    assetName: row.asset_description,
    spaceName: row.space_name,
    propertyId: row.property_id,

    userFirstName: row.user?.first_name,
    userLastName: row.user?.last_name,
    userEmail: row.user?.email,
  }));
  return changelogs;
};

export const getPropertyDetails = async (propertyId: string): Promise<Property | null> => {
  const { data, error } = await supabase
    .from("property_assets_full_view")
    .select("*")
    .eq("property_id", propertyId);

  if (error) {
    console.error("Error fetching property id:", error.message);
    return null;
  }

  if (!data || data.length === 0) return null;

  const first = data[0];

  const property: Property = {
    propertyId: first.property_property_id,
    name: first.property_name,
    address: first.property_address,
    description: first.property_description,
    pin: first.property_pin,
    type: first.property_type,
    status: first.property_status,
    lastUpdated: first.property_lastupdated,
    completionStatus: first.property_completionstatus,
    totalFloorArea: first.property_total_floor_area,
    createdAt: first.property_created_at,
    spaces: [],
    images: [],
  };

  const spaceMap: Record<string, Space> = {};

  for (const row of data) {
    if (!row.spaces_id) continue;

    if (!spaceMap[row.spaces_id]) {
      spaceMap[row.spaces_id] = {
        id: row.spaces_id,
        name: row.spaces_name,
        type: row.spaces_type,
        assets: [],
        deleted: row.spaces_deleted ?? false,
      };
    }

    if (row.assets_id) {
      const asset: Asset = {
        id: row.assets_id,
        type: row.assettypes_name ?? "",
        description: row.assets_description ?? "",
        deleted: row.assets_deleted ?? false,
        currentSpecifications: row.assets_current_specifications ?? {},
        assetTypes: {
          id: row.assettypes_id ?? "",
          name: row.assettypes_name ?? "",
          discipline: row.assettypes_discipline ?? "",
        },
      };
      spaceMap[row.spaces_id].assets.push(asset);
    }
  }

  property.spaces = Object.values(spaceMap);

  property.images = (await getPropertyImages(propertyId)) ?? [];

  return property;
};

export async function getPropertyImages(
  propertyId: string,
  imageLink?: string
): Promise<string[]> {
  if (!propertyId) throw new Error("Missing propertyId");

  // Fetch image links from Supabase table
  let query = supabase
    .from("PropertyImages")
    .select("image_link")
    .eq("property_id", propertyId);

  if (imageLink) {
    query = query.eq("image_link", imageLink);
  }

  const { data: imagesData, error } = await query;

  if (error) {
    console.error("Error fetching images:", error);
    return [];
  }

  if (!imagesData || imagesData.length === 0) return [];

  // Deduplicate image links
  const uniqueLinks = Array.from(
    new Set(imagesData.map((row: any) => row.image_link))
  );

  // Generate signed URLs
  const imageUrls = await Promise.all(
    uniqueLinks.map(async (link) => {
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("Property_Images")
          .createSignedUrl(link, 60 * 10); // 10 minutes

      if (signedUrlError) {
        console.error("Error creating signed URL for", link, signedUrlError);
        return null;
      }

      return signedUrlData?.signedUrl || null;
    })
  );

  // Filter out any failed URLs
  return imageUrls.filter(Boolean) as string[];
}

export const getPropertyOwners = async (propertyId: string): Promise<Owner[] | null> => {
  const { data, error } = await supabase
    .from("owner_property_view")
    .select("owner_id, first_name, last_name, email, phone")
    .eq("property_id", propertyId);

  if (error) {
    console.error("Error fetching property owners:", error.message);
    return null;
  }

  const owners: Owner[] = data.map((row) => ({
    ownerId: row.owner_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone
  }));

  return owners || null;
};

export const getUserIdByEmail = async (email: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from("User")
    .select("user_id")
    .eq("email", email.trim())
    .maybeSingle();

  if (error) {
    console.error("Error fetching user ID:", error);
    return null;
  }

  return data?.user_id || null;
};


// Returns property objects that the admin can view
export const getAdminProperty = async (userID: string, userType: string) => {
const { data, error } = await supabase
    .from("owner_property_view")
    .select(`
      address,
      description,
      pin,
      property_name, 
      property_id,
      property_created_at,
      type,
      status,
      last_updated,
      completion_status,
      total_floor_area,
      splash_image
    `)
    .order("property_created_at", {ascending: false});

  if (error) {
    console.error("Error fetching property id:", error.message);
    return [];
  }

  const properties: Property[] = await Promise.all(
    data.map(async (row) => {
      // If getPropertyImages returns string[], take first; if string, just use it
      const splashImageResult = await getPropertyImages(row.property_id, row.splash_image);
      const splashImageUrl = Array.isArray(splashImageResult)
        ? splashImageResult[0] || undefined
        : splashImageResult || undefined;

      return {
        propertyId: row.property_id,
        name: row.property_name,
        address: row.address,
        description: row.description,
        pin: row.pin,
        createdAt: row.property_created_at,
        type: row.type,
        status: row.status,
        lastUpdated: row.last_updated,
        completionStatus: row.completion_status,
        totalFloorArea: row.total_floor_area,
        spaces: [], // populate later if needed
        images: [], // populate later if needed
        splashImage: splashImageUrl,
      };
    })
  );

  console.log("Returning properties:", properties);
  return properties;
};

export async function getAllOwners() {
  const { data, error } = await supabase
    .from("owner_user_view")
    .select(
      `
      owner_id,
      first_name,
      last_name,
      email,
      phone
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching property owners:", error.message);
    return [];
  }

  const owners: Owner[] = data.map((row: any) => ({
    ownerId: row.owner_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
  }));

  console.log(owners);
  return owners;
}

// export async function fetchAssetType(): Promise<Record<string, string[]>> {
//   const { data, error } = await supabase
//     .from("AssetTypes")
//     .select("name, discipline");

//   if (error) throw error;

//   // { "Painting": ["Interior Wall","Exterior Wall","Ceiling"], ... }
//   const byDiscipline: Record<string, string[]> = {};
//   (data as AssetType[]).forEach(({ name, discipline }) => {
//     (byDiscipline[discipline] ||= []).push(name);
//   });
//   return byDiscipline;
// }
