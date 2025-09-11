import supabase from "../config/supabaseClient";

// Takes in userId
// Returns the OwnerId if it exists, otherwise return null
export const getOwnerId = async (userId: string) => {
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

// Takes in userId
// Returns property objects that the user owns
export const getProperty = async (ownerId: string) => {
    const { data, error } = await supabase
        .from("OwnerProperty")
        .select(`
            property: Property (
            property_id, 
            address, 
            created_at
            )
        `)
        .eq("owner_id", ownerId);

    if (error) {
        console.error("Error fetching property id:", error.message);
        return null;
    }

    return data || null;
}