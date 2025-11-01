import { PropertyUpdate, SpaceUpdate, AssetUpdate } from "@backend/PropertyEditService";
import { BaseApiClient } from "./ApiClient";
import { API_ROUTES } from "../routes";
import { CreateAssetParams, CreateSpaceParams } from "../wrappers";

export class PropertyApiClient extends BaseApiClient {
  // Property methods
  async getPropertyList(userId: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.LIST(userId)
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch properties");
    }

    return response.json();
  }

  async getPropertyOwners(propertyId: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.OWNERS(propertyId)
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch property owners");
    }

    return response.json();
  }

  async getPropertyDetails(propertyId: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.DETAILS(propertyId)
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch property details");
    }

    return response.json();
  }

 // Property Editing methods 

  /**
   * Get all available asset types
   */
  async getAssetTypes() {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.ASSET_TYPES
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch asset types");
    }

    const data = await response.json();
    return data.assetTypes;
  }

  // Update Methods (PATCH)
  /**
   * Update property information
   */
  async updateProperty(propertyId: string, updates: PropertyUpdate) {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.UPDATE_PROPERTY,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, updates }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update property");
    }

    const data = await response.json();
    return data.property;
  }

  /**
   * Update space information
   */
  async updateSpace(spaceId: string, updates: SpaceUpdate) {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.UPDATE_SPACE,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId, updates }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update space");
    }

    const data = await response.json();
    return data.space;
  }

  /**
   * Update asset information
   */
  async updateAsset(assetId: string, updates: AssetUpdate) {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.UPDATE_ASSET,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId, updates }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update asset");
    }

    const data = await response.json();
    return data.asset;
  }

  /**
   * Update or add features to an asset
   */
  async updateFeatures(assetId: string, features: Record<string, any>) {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.UPDATE_FEATURES,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId, features }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update features");
    }

    const data = await response.json();
    return data.asset;
  }


  // Create Methods (POST)

  /**
   * Create a new space with assets
   */
  async createSpace(params: CreateSpaceParams) {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.CREATE_SPACE,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create space");
    }

    const data = await response.json();
    return data.space;
  }

  /**
   * Create a new asset in an existing space
   */
  async createAsset(params: CreateAssetParams) {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.CREATE_ASSET,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create asset");
    }

    const data = await response.json();
    return data.asset;
  }

  // Delete Methods (DELETE)

  /**
   * Soft delete a space (also deletes all assets in the space)
   */
  async deleteSpace(spaceId: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.DELETE_SPACE(spaceId),
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete space");
    }

    return response.json();
  }

  /**
   * Soft delete an asset
   */
  async deleteAsset(assetId: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.DELETE_ASSET(assetId),
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete asset");
    }

    return response.json();
  }

  /**
   * Delete a specific feature from an asset
   */
  async deleteFeature(assetId: string, featureName: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.DELETE_FEATURE(assetId, featureName),
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete feature");
    }

    const data = await response.json();
    return data.asset;
  }
}