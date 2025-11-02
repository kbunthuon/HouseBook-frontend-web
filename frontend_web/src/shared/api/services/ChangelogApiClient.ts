import { BaseApiClient } from "./ApiClient";
import { API_ROUTES } from "../routes";

export class ChangelogApiClient extends BaseApiClient {
 // Changelog methods
  async getChangeLogs(propertyIds: string[]) {
    console.log("propertyIds being sent:", propertyIds);
    const url = API_ROUTES.CHANGELOG.GET(propertyIds);
    console.log("Fetching changelogs from:", url);
    const response = await this.authenticatedRequest(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch change logs");
    }

    const data = await response.json();
    console.log("API RESPONSE - getChangeLogs:", data);
    console.log("First change log entry (if exists):", data?.[0]);
    return data;
  }

  async getAssetHistory(assetId: string) {
    console.log("Fetching asset history for assetId:", assetId);
    const url = API_ROUTES.CHANGELOG.ASSET_HISTORY(assetId);
    console.log("Fetching from:", url);

    const response = await this.authenticatedRequest(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch asset history");
    }

    return response.json();
  }

  async getSpaceHistory(spaceId: string) {
    console.log("Fetching space history for spaceId:", spaceId);
    const url = API_ROUTES.CHANGELOG.SPACE_HISTORY(spaceId);
    console.log("Fetching from:", url);

    const response = await this.authenticatedRequest(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch space history");
    }

    return response.json();
  }

  async getPropertyHistory(propertyId: string) {
    console.log("Fetching property history for propertyId:", propertyId);
    const url = API_ROUTES.CHANGELOG.PROPERTY_HISTORY(propertyId);
    console.log("Fetching from:", url);

    const response = await this.authenticatedRequest(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch property history");
    }

    return response.json();
  }

  // Create a changelog
  async createChangeLogEntry(
    assetId: string,
    changeDescription: string,
    action?: 'CREATED' | 'UPDATED' | 'DELETED',
    currentSpecifications?: Record<string, any>
  ) {
    console.log("Creating changelog entry for asset:", assetId);
    console.log("Change description:", changeDescription);
    console.log("Action:", action || 'UPDATED');
    
    const url = API_ROUTES.CHANGELOG.CREATE;
    console.log("Posting to:", url);
    
    const response = await this.authenticatedRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assetId,
        changeDescription,
        action: action || 'UPDATED',
        currentSpecifications: currentSpecifications || {},
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create changelog entry");
    }
    
    const data = await response.json();
    console.log("API RESPONSE - createChangeLogEntry:", data);
    return data;
  }
}