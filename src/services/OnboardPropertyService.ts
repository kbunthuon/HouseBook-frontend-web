import supabase from "../config/supabaseClient";

// Setting what a FormData looks like
export interface FormData {
    // Basic Information
    propertyName: String,
    propertyDescription: String,
    address: String,
    // Plans & Documents
    floorPlans: File[],
    buildingPlans: File[]
}

// Setting what an Asset or Space looks like
export interface AssetFeature {
  name: string;
  value: string;
}

export interface Asset {
  typeId: string;
  name: string;  // Only to display in the frontend, name is not stored in database
  description: string; // description is stored in database
  features: AssetFeature[];
}

export interface Space {
  type: string;
  name: string;
  assets: Asset[];
}

export async function onboardProperty(formData: FormData, spaces: Space[]) {
  // Get the user id
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("User ID not returned from signup");
  const userId = user.id;
  
  // Get the owner id
  const ownerId = await getOwnerId(userId);

  // Insert to Property table and OwnerProperty Table
  const propertyId = await saveProperty(formData, ownerId);

  // Insert to Spaces table, Assets table, AssetTypes table and Changelog table
  // Needs propertyId when inserting into Spaces table, userId when inserting into Changelog table
  await saveDetails(spaces, propertyId, userId);

}

const getOwnerId = async (userId: string) => {
  const { data, error } = await supabase
    .from("Owner")
    .select("owner_id")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching owner id:", error.message);
    return null;
  }

  return data?.owner_id || null;
};

const saveProperty = async (formData: FormData, ownerId: string) => {
  try {
    // 1. Insert into Property table
    const { data: property, error: propertyError } = await supabase
      .from("Property")
      .insert([
        {
          name: formData.propertyName,
          description: formData.propertyDescription,
          address: formData.address
        }
      ])
      .select("property_id")
      .single();

    if (propertyError) throw propertyError;

    const propertyId = property.property_id;

    // 2. Insert into OwnerProperty relationship table
    const { error: relationError } = await supabase
      .from("OwnerProperty")
      .insert([
        {
          property_id: propertyId,
          owner_id: ownerId
        }
      ]);

    if (relationError) throw relationError;

    console.log("Property and relationship inserted successfully");
    return propertyId;
  } catch (err) {
    console.error("Error inserting property:", err);
    return null;
  }
};

const saveDetails = async (spaces: Space[], propertyId: string, userId: string) => {
  try {
    for (const space of spaces) {
      // 1. Insert Space
      const { data: insertedSpace, error: spaceError } = await supabase
        .from("Spaces")
        .insert([
          {
            property_id: propertyId,
            type: space.type,
            name: space.name,
          },
        ])
        .select("id")
        .single();

      if (spaceError) throw spaceError;

      const spaceId = insertedSpace.id;

      for (const asset of space.assets) {
        // 2. Insert Asset
        const { data: insertedAsset, error: assetError } = await supabase
          .from("Assets")
          .insert([
            {
              space_id: spaceId,
              asset_type_id: asset.typeId,
              name: asset.description,
            },
          ])
          .select("id")
          .single();

        if (assetError) throw assetError;

        const assetId = insertedAsset.id;

        // 3. Insert Asset Features into ChangeLog as JSON
        if (asset.features && asset.features.length > 0) {
          const specifications: Record<string, string> = {};
          asset.features.forEach((feature) => {
            specifications[feature.name] = feature.value;
          });

          const { error: changelogError } = await supabase
            .from("ChangeLog")
            .insert([
              {
                asset_id: assetId,
                specifications: specifications,
                change_description: "Onboarding",
                changed_by_user_id: userId,
              },
            ]);

          if (changelogError) throw changelogError;
        }
      }
    }
    console.log("All spaces, assets, and features saved successfully.");
    return true;
  } catch (err) {
    console.error("Error saving details", err);
    return null;
  }
};
