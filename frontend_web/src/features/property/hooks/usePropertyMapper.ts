import { Property, Space, Asset } from "@housebookgroup/shared-types";

export function usePropertyMapper() {
  const mapToSharedProperty = (bp: Property | null): Property | null => {
    if (!bp) return null;

    return {
      propertyId: bp.propertyId,
      address: bp.address || "",
      description: bp.description || "",
      pin: bp.pin || "",
      name: bp.name,
      type: bp.type || "",
      status: bp.status || "",
      lastUpdated: bp.lastUpdated || "",
      completionStatus: bp.completionStatus || 0,
      totalFloorArea: bp.totalFloorArea,
      spaces: bp.spaces?.map((s: Space) => ({
        id: s.id,
        name: s.name,
        type: s.type || "",
        deleted: s.deleted || false,
        assets: s.assets?.map((a: Asset) => ({
          id: a.id,
          description: a.description || "",
          type: a.type,
          currentSpecifications: a.currentSpecifications || {},
          deleted: a.deleted || false,
          assetTypes: a.assetTypes,
        })) || [],
      })) || [],
      images: bp.images || [],
      createdAt: bp.createdAt || "",
      splashImage: bp.splashImage,
    };
  };

  return { mapToSharedProperty };
}