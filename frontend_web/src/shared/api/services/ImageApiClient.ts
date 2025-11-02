import { BaseApiClient } from "./ApiClient";
import { API_ROUTES } from "../routes";

export class ImageApiClient extends BaseApiClient {
// Image methods
  async getPropertyImages(propertyId: string, imageName?: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.IMAGES.GET(propertyId, imageName)
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch images");
    }

    return response.json();
  }

  async uploadPropertyImage(
    propertyId: string,
    file: File,
    description?: string
  ) {
    const formData = new FormData();
    formData.append("propertyId", propertyId);
    formData.append("file", file);
    if (description) {
      formData.append("description", description);
    }

    const response = await this.authenticatedRequest(API_ROUTES.IMAGES.UPLOAD, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header, let browser set it with boundary
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload image");
    }

    return response.json();
  }

  // deletes image(s) based on signed URL(s)
  async deletePropertyImages(signedUrls: string | string[]) {
    // Ensure signedUrls is an array
    const urls = Array.isArray(signedUrls) ? signedUrls : [signedUrls];

    // Construct query string
    const query = `?signedUrls=${urls.map(encodeURIComponent).join(",")}`;

    const response = await this.authenticatedRequest(
      `${API_ROUTES.IMAGES.DELETE}${query}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete images");
    }

    return response.json();
  }

  // Updates the property's splash image
  async updatePropertySplashImage(signedUrl: string) {
    const body = { signedUrl };

    const response = await this.authenticatedRequest(API_ROUTES.IMAGES.PATCH, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update splash image");
    }
    const data = response.json();
    console.log("updatePropertySplashImage response data:", data);
    return data; // { result: ... }
  }
}