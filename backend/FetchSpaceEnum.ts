// FetchSpaceEnum.ts
import supabase from "../config/supabaseClient";

export const fetchSpaceEnum = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .rpc("get_enum_values", { enum_name: "space_type" });

    if (error) {
      console.error("Error fetching space enum:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Unexpected error fetching space enum:", err);
    return [];
  }
};
