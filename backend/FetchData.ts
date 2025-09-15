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


export type Property = { 
  property_id: string;
  address: string; 
  description: string; 
  pin: string; 
  name: string; 
  type?: string; 
  status?: string; 
  lastUpdated?: string; 
  completionStatus?: number; 
};
// Takes in userId
// Returns property objects that the user owns
export const getProperty = async (userID: string) => {
    const { data, error } = await supabase
        .from("owner_property_view")
        .select(`
            address,
            description,
            pin,
            property_name, 
            property_id
        `)
        .eq("user_id", userID);

    if (error) {
        console.error("Error fetching property id:", error.message);
        return null;
    }

    // Map raw DB columns to your Property type
    const properties: Property[] = data.map((row) => ({
      property_id: row.property_id,
      name: row.property_name, // map DB column → type field
      address: row.address,
      description: row.description,
      pin: row.pin,
    }));

    return properties || null;

    //return data || null;
}


