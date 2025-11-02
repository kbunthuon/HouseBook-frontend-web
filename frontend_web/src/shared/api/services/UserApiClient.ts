import { BaseApiClient } from "./ApiClient";
import { API_ROUTES } from "../routes";

export class UserApiClient extends BaseApiClient {
// User methods
  async getUserInfoByEmail(email: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.USER.INFO_BY_EMAIL(email)
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch user info");
    }

    const data = await response.json();

    // Transform snake_case to camelCase
    return {
      userId: data.user_id,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
    };
  }

  async getUserInfoByOwnerId(ownerId: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.USER.INFO_BY_OWNER_ID(ownerId)
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch user info");
    }

    const data = await response.json();

    // Transform snake_case to camelCase
    return {
      ownerId: data.ownerId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    };
  }
}