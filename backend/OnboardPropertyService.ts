import {supabase} from "../config/supabaseClient";

// Setting what OwnerData looks like
import { Owner, FormData, SpaceInt } from "@housebookgroup/shared-types";
import { apiClient } from "../frontend_web/src/shared/api/wrappers";

export async function checkOwnerExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("User")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error checking owner:", error);
      return false;
    }

    return !!data; // true if owner exists, false otherwise
  } catch (error) {
    console.error("Error in checkOwnerExists:", error);
    return false;
  }
}

const saveProperty = async (formData: FormData, ownerId: string) => {
  try {
    // 1. Insert into Property table
    const { data: property, error: propertyError } = await supabase
      .from("Property")
      .insert([
        {
          name: formData.propertyName,
          description: formData.propertyDescription,
          address: formData.address,
          total_floor_area: formData.totalFloorArea
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
    console.log(`Starting saveDetails for propertyId: ${propertyId}, userId: ${userId}, isOwnerOnboarding: ${isOwnerOnboarding}`);
    console.log(`Number of spaces to insert: ${spaces.length}`);

    for (let i = 0; i < spaces.length; i++) {
      const space = spaces[i];
      console.log(`Processing space ${i + 1}/${spaces.length}: ${space.name} (${space.type})`);

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

      if (spaceError) {
        console.error(`Error inserting space "${space.name}":`, spaceError);
        throw spaceError;
      }

      const spaceId = insertedSpace.id;
      console.log(`Space inserted successfully with ID: ${spaceId}`);

      for (let j = 0; j < space.assets.length; j++) {
        const asset = space.assets[j];
        console.log(`Processing asset ${j + 1}/${space.assets.length} in space "${space.name}": ${asset.name}`);

        // Build specifications object from features
        const specifications: Record<string, string> = {};
        if (asset.features && asset.features.length > 0) {
          asset.features.forEach((feature) => {
            specifications[feature.name] = feature.value;
          });
        }
        console.log(`Asset specifications:`, specifications);

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

        if (assetError) {
          console.error(`Error inserting asset "${asset.name}":`, assetError);
          throw assetError;
        }

        const assetId = insertedAsset.id;
        console.log(`Asset inserted successfully with ID: ${assetId}`);

        // 3. Insert ChangeLog entry
        // For owner onboarding, automatically accept the changes (use ACCEPTED not APPROVED)
        const changelogStatus = isOwnerOnboarding ? 'ACCEPTED' : 'PENDING';

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

        if (changelogError) {
          console.error(`Error inserting changelog for asset "${asset.name}" (ID: ${assetId}):`, changelogError);
          throw changelogError;
        }

        console.log(`ChangeLog entry inserted successfully for asset ID: ${assetId}`);
      }
    }
    console.log("All spaces, assets, and changelogs saved successfully.");
    return true;
  } catch (err) {
    console.error("Error saving details:", err);
    // Re-throw the error so it can be caught by the calling function
    throw err;
  }
};
