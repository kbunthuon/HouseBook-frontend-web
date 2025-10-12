import supabase from "../config/supabaseClient";
import { Property, Space, Asset, Owner, AssetType } from "@housebookgroup/shared-types";

// Takes in userId
// Returns the OwnerId if it exists, otherwise return null
export const getOwnerId = async (userId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from("Owner")
    .select("owner_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching owner id:", error.message);
    return null;
  }

  return data?.owner_id || null;
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
      property_id: row.property_id,
      name: row.property_name,
      address: row.address,
      description: row.description,
      pin: row.pin,
      created_at: row.property_created_at,
      type: row.type,
      status: row.status,
      lastUpdated: row.last_updated,
      completionStatus: row.completion_status,
      total_floor_area: row.total_floor_area,
      Spaces: [], // use consistent capitalization
      images: [], 
      splash_image: splashImageUrl,
    };
  });

  return properties;
};

export const getChangeLogs = async (propertyIds: string[]) => {
  const { data: changes, error } = await supabase
    .from("changelog_property_view")
    .select(`
      changelog_id,
      changelog_specifications,
      changelog_description,
      changelog_created_at,
      changelog_status,
      user_first_name,
      user_last_name,
      property_id
    `)
    .in("property_id", propertyIds)
    .order("changelog_created_at", { ascending: false });

  if (error) {
    console.error("Error fetching change log:", error);
    return null;
  }

  return changes;
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
    property_id: first.property_property_id,
    name: first.property_name,
    address: first.property_address,
    description: first.property_description,
    pin: first.property_pin,
    type: first.property_type,
    status: first.property_status,
    lastUpdated: first.property_lastupdated,
    completionStatus: first.property_completionstatus,
    total_floor_area: first.property_total_floor_area,
    created_at: first.property_created_at,
    Spaces: [],
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
        Assets: [],
        deleted: row.spaces_deleted ?? false,
      };
    }

    if (row.assets_id) {
      const asset: Asset = {
        id: row.assets_id,
        type: row.assettypes_name ?? "",
        description: row.assets_description ?? "",
        deleted: row.assets_deleted ?? false,
        current_specifications: row.assets_current_specifications ?? {},
        AssetTypes: {
          id: row.assettypes_id ?? "",
          name: row.assettypes_name ?? "",
          discipline: row.assettypes_discipline ?? "",
        },
      };
      spaceMap[row.spaces_id].Assets.push(asset);
    }
  }

  property.Spaces = Object.values(spaceMap);

  property.images = (await getPropertyImages(propertyId)) ?? [];

  return property;
};

export const getPropertyImages = async (propertyId: string, imageName?: string): Promise<string[]> => {
  let query = supabase
    .from("PropertyImages")
    .select("image_link")
    .eq("property_id", propertyId);

  if (imageName) query = query.eq("image_name", imageName);

  const { data: imagesData, error } = await query;

  if (error) {
    console.error("Error fetching images:", error);
    return [];
  }

  const imageSet = new Set<string>();

  imagesData?.forEach((row) => {
    const { data: publicUrl } = supabase.storage
      .from("PropertyImage")
      .getPublicUrl(row.image_link);

    if (publicUrl?.publicUrl) imageSet.add(publicUrl.publicUrl);
  });

  return Array.from(imageSet);
};

export const getPropertyOwners = async (propertyId: string): Promise<Owner[] | null> => {
  const { data, error } = await supabase
    .from("owner_property_view")
    .select("owner_id, first_name, last_name, email")
    .eq("property_id", propertyId);

  if (error) {
    console.error("Error fetching property owners:", error.message);
    return null;
  }

  const owners: Owner[] = data.map((row) => ({
    owner_id: row.owner_id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
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

  const properties: Property[] = data.map((row) => {
    // Get the actual public URL for the splash image
    const splashImageUrl = row.splash_image
      ? supabase.storage
          .from("PropertyImage")
          .getPublicUrl(row.splash_image)
          .data?.publicUrl ?? ''
      : '';

    return {
      property_id: row.property_id,
      name: row.property_name,
      address: row.address,
      description: row.description,
      pin: row.pin,
      created_at: row.property_created_at,
      type: row.type,
      status: row.status,
      lastUpdated: row.last_updated,
      completionStatus: row.completion_status,
      totalFloorArea: row.total_floor_area,
      spaces: [],  // populate later if needed
      images: [],  // populate later if needed
      splash_image: splashImageUrl,
    };
  });

  console.log("Returning properties:", properties);
  return properties;
};

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
