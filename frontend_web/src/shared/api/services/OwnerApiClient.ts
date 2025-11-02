import { checkOwnerExists } from "@backend/OnboardPropertyService";
import { ImageApiClient } from "./ImageApiClient";
import { API_ROUTES, OwnerOnboardParams } from "../routes";

export class OwnerApiClient extends ImageApiClient {
  // Owner methods
  async getOwnerId(userId: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.OWNER.GET_ID(userId)
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch owner ID");
    }

    return response.json();
  }

  async checkOwnerExists(email: string): Promise<boolean> {
    try {
      const exists = await checkOwnerExists(email);
      return exists;
    } catch (error) {
      console.error("Error checking owner exists:", error);
      throw new Error("Failed to verify owner");
    }
  }

  async ownerOnboardProperty(params: OwnerOnboardParams) {
    const response = await this.authenticatedRequest(
      API_ROUTES.OWNER.ONBOARD_PROPERTY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to onboard property");
    }

    const data = await response.json();
    const propertyId = data.propertyId;
    if (!propertyId) throw new Error("Property ID not returned from onboarding");

    const { userId, formData, spaces } = params;

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

  async getOwnerIdByUserId(userId: string) {
      try {
          const ownerId = await this.getOwnerId(userId);
          console.log("getOwnerIdByUserId response:", ownerId);
          return ownerId;
      } catch (error: any) {
          console.error("Failed to get owner ID:", error);
          throw new Error(error.message || "Failed to get owner ID");
      }
  }
}