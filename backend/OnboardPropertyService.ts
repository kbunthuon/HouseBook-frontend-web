import supabase from "../config/supabaseClient";

// Setting what OwnerData looks like
import { Owner, FormData, SpaceInt } from "@housebookgroup/shared-types";
import { apiClient } from "../frontend_web/src/api/wrappers";

export async function ownerOnboardProperty(formData: FormData, spaces: SpaceInt[]) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("User ID not returned from signup");
  const userId = user.id;
  
  const ownerId = await apiClient.getOwnerId(userId);
  const propertyId = await saveProperty(formData, ownerId);

  // Upload property images
  for (const file of (formData.floorPlans)) {
    await apiClient.uploadPropertyImage(propertyId, file);
  }
  for (const file of (formData.buildingPlans)) {
    await apiClient.uploadPropertyImage(propertyId, file);
  }


  await saveDetails(spaces, propertyId, userId, true);

  return propertyId;
}

export async function adminOnboardProperty(ownerData: Owner, formData: FormData, spaces: SpaceInt[]) {

  // Get the user id using the owner's email
  const userId = await apiClient.getUserInfoByEmail(ownerData.email);
  if (!userId) throw new Error("User ID not returned from signup");
  console.log("userId:");
  console.log(userId);
  
  // Get the owner id
  const ownerId = await apiClient.getOwnerId(userId);

  // Insert to Property table and OwnerProperty Table
  const propertyId = await saveProperty(formData, ownerId);

  // Insert to Spaces table, Assets table, AssetTypes table and Changelog table
  // Needs propertyId when inserting into Spaces table, userId when inserting into Changelog table
  await saveDetails(spaces, propertyId, userId);

  return propertyId || null;

}

const checkOwnerExists = async (owner: Owner) => {
  const { data, error } = await supabase
    .from("User")
    .select("user_id")
    .eq("firstName", owner.firstName)
    .eq("lastName", owner.lastName)
    .eq("phone", owner.phone)
    .eq("email", owner.email)
    .maybeSingle();

  if (error) {
    console.error("Error checking owner:", error);
    return false;
  }

  return !!data; // true if owner exists, false otherwise
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

const saveDetails = async (spaces: SpaceInt[], propertyId: string, userId: string, isOwnerOnboarding: boolean = true) => {
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
        // Build specifications object from features
        const specifications: Record<string, string> = {};
        if (asset.features && asset.features.length > 0) {
          asset.features.forEach((feature) => {
            specifications[feature.name] = feature.value;
          });
        }

        // 2. Insert Asset with current_specifications
        const { data: insertedAsset, error: assetError } = await supabase
          .from("Assets")
          .insert([
            {
              space_id: spaceId,
              asset_type_id: asset.typeId,
              description: asset.description || null,
              current_specifications: specifications,
            },
          ])
          .select("id")
          .single();

        if (assetError) throw assetError;

        const assetId = insertedAsset.id;

        // 3. Insert ChangeLog entry
        // For owner onboarding, automatically approve the changes
        const changelogStatus = isOwnerOnboarding ? 'APPROVED' : 'PENDING';
        
        const { error: changelogError } = await supabase
          .from("ChangeLog")
          .insert([
            {
              asset_id: assetId,
              specifications: specifications,
              change_description: "Onboarding",
              changed_by_user_id: userId,
              status: changelogStatus,
              actions: 'CREATED', // New asset created during onboarding
            },
          ]);

        if (changelogError) throw changelogError;
      }
    }
    console.log("All spaces, assets, and features saved successfully.");
    return true;
  } catch (err) {
    console.error("Error saving details", err);
    return null;
  }
};
