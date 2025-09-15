import supabase from "../config/supabaseClient";

export const fetchAssetTypes = async (): Promise<{ id: string; name: string }[]> => {
  const { data, error } = await supabase
    .from("AssetTypes")
    .select("id, name");

  if (error) {
    console.error("Error fetching asset types:", error.message);
    return [];
  }
  return data || [];
};