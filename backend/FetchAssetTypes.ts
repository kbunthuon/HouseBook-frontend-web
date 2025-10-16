import supabase from "../config/supabaseClient";

export type AssetType = {
  id: string;
  name: string; 
  discipline: string;
};

export async function fetchAssetTypes(): Promise<AssetType[]> {
  const { data, error } = await supabase
    .from("AssetTypes")
    .select("*");

  if (error) {
    console.error("Error fetching asset types:", error.message);
    return [];
  }
  console.log(data);
  return data || [];
};

// Calls the fetchAssetType function and then group the AssetTypes together by trade discipline
// Outputs: {discipline : list of asset types}
export async function fetchAssetTypesGroupedByDiscipline(): Promise<Record<string, string[]>> {
  const byDiscipline: Record<string, string[]> = {};
  fetchAssetTypes().then((flatArray) => {
    // Group by discipline
    flatArray.forEach(({ name, discipline }) => {
      (byDiscipline[discipline] ||= []).push(name);
    });
  });

  return byDiscipline;
}