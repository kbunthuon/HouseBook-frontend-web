import supabase from "../config/supabaseClient";
import { Property, Space, Asset, Owner } from "@housebookgroup/shared-types";
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
      spaces: [],  // populate later if needed
      images: [],  // populate later if needed
      splashImage: splashImageUrl,
    };
  });

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
