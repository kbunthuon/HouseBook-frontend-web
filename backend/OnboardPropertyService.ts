import supabase from "../config/supabaseClient";
import { getOwnerId, getUserInfoByEmail } from "./FetchData";

// Setting what OwnerData looks like
export interface OwnerData {
  firstName: string,
  lastName: string,
  email: string,
  phone: string
}

// Setting what FormData looks like
export interface FormData {
    // Basic Information
    propertyName: string,
    propertyDescription: string,
    address: string,
    // Plans & Documents
    floorPlans: File[],
    buildingPlans: File[]
}

// Setting what an Asset or Space looks like
export interface AssetFeature {
  name: string;
  value: string;
}

export interface AssetInt {
  typeId: string;
  name: string;  // Only to display in the frontend, name is not stored in database
  description: string; // description is stored in database
  features: AssetFeature[];
}

export interface SpaceInt {
  type: string;
  name: string;
  assets: AssetInt[];
}

export async function ownerOnboardProperty(formData: FormData, spaces: SpaceInt[]) {
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

  return propertyId || null;

}

export async function adminOnboardProperty(ownerData: OwnerData, formData: FormData, spaces: SpaceInt[]) {
  // Check if this user account exists
  // const exists = await checkOwnerExists(ownerData);
  // if (!exists) {
  //   alert("Error fetching credentials. Credentials may not exist.");
  //   return;
  // }

  // Get the user id using the owner's email
  const userData = await getUserInfoByEmail(ownerData.email);
  if (!userData) throw new Error("User data not returned from signup. Email not found.");
  console.log("userData:", userData);

  // Check details: first name, last name and phone
  let errorFound = false;
  if (ownerData.firstName != userData.first_name) {
    console.error("First name is not correct");
    errorFound = true;
  }
  if (ownerData.lastName != userData.last_name) {
    console.error("Last name is not correct");
    errorFound = true;
  }
  if (ownerData.phone != userData.phone) {
    console.error("Phone number is not correct");
    errorFound = true;
  }
  if (errorFound) console.error("Invalid inputs");


  // Get the owner id
  const ownerId = await getOwnerId(userData.user_id);

  // Insert to Property table and OwnerProperty Table
  const propertyId = await saveProperty(formData, ownerId);

  // Insert to Spaces table, Assets table, AssetTypes table and Changelog table
  // Needs propertyId when inserting into Spaces table, userId when inserting into Changelog table
  await saveDetails(spaces, propertyId, userData.user_id);

  return propertyId || null;

}

const checkOwnerExists = async (owner: OwnerData) => {
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

const saveDetails = async (spaces: SpaceInt[], propertyId: string, userId: string) => {
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
