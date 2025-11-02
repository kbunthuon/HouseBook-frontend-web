import { useMemo } from 'react';
import { Property, Asset, Space } from '@housebookgroup/shared-types';

export function useMappedProperty(property: Property | null) {
  return useMemo(() => {
    if (!property) return null;
    return {
      propertyId: property.propertyId,
      address: property.address || "",
      description: property.description || "",
      pin: property.pin || "",
      name: property.name,
      type: property.type || "",
      status: property.status || "",
      lastUpdated: property.lastUpdated || "",
      completionStatus: property.completionStatus || 0,
      totalFloorArea: property.totalFloorArea,
      spaces: property.spaces?.map((s: Space) => ({
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
      images: property.images || [],
      createdAt: property.createdAt || "",
      splashImage: property.splashImage,
    };
  }, [property]);
}
