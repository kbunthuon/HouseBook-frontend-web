import { ImageApiClient } from "./ImageApiClient";
import { AdminOnboardParams, API_ROUTES } from "../routes";

export class AdminApiClient extends ImageApiClient {
  // Admin methods
  async adminOnboardProperty(params: AdminOnboardParams) {
    const response = await this.authenticatedRequest(
      API_ROUTES.ADMIN.ONBOARD_PROPERTY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to onboard property as admin");
    }

    const data = await response.json();
    const propertyId = data.propertyId;
    if (!propertyId) throw new Error("Property ID not returned from onboarding");

    const { ownerData, formData, spaces } = params;

    // Step 2 — Upload floorPlans and buildingPlans
    const allFiles: File[] = [
      ...(formData.floorPlans || []),
      ...(formData.buildingPlans || []),
    ];

    if (allFiles.length > 0) {
      // Upload images concurrently
      await Promise.all(
        allFiles.map((file) =>
          this.uploadPropertyImage(propertyId, file, file.name || undefined)
        )
      );
    }

    return propertyId;
  }

  async getAdminProperties(userId: string, userType: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.ADMIN.GET_ADMIN_PROPERTIES(userId, userType)
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch admin properties");
    }
    const data = await response.json();
    return data.properties;
  }

  async getAllOwners() {
    const response = await this.authenticatedRequest(
      API_ROUTES.ADMIN.GET_ALL_OWNERS
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch all owners");
    }
    const data = await response.json();
    return data.owners;
  }
}