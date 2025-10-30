import {
  API_ROUTES,
  LoginParams,
  OwnerOnboardParams,
  AdminOnboardParams,
} from "./routes";
import { SignupData } from "@housebookgroup/shared-types";
import { supabase } from "../../../config/supabaseClient";
import { rejectTransfer } from "../../../backend/TransferService";
import { checkOwnerExists } from "../../../backend/OnboardPropertyService";
import { getOwnerId } from "../../../backend/FetchData";

// Token management
class TokenManager {
  private static ACCESS_TOKEN_KEY = "housebook_access_token";
  private static REFRESH_TOKEN_KEY = "housebook_refresh_token";
  private static EXPIRES_AT_KEY = "housebook_expires_at";

  static setTokens(
    accessToken: string,
    refreshToken: string,
    expiresAt?: number
  ) {
    console.log("Setting tokens in TokenManager");
    console.log("Access Token:", accessToken ? accessToken : "null");
    console.log("Refresh Token:", refreshToken ? refreshToken : "null");
    console.log("Expires At:", expiresAt);  

    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    if (expiresAt) {
      sessionStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());
    }
  }

  static getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
  static getExpiresAt(): number | null {
    const expiresAt = sessionStorage.getItem(this.EXPIRES_AT_KEY);
    return expiresAt ? parseInt(expiresAt) : null;
  }

  static clearTokens() {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.EXPIRES_AT_KEY);
  }

  static isTokenExpired(): boolean {
    const expiresAt = this.getExpiresAt();
    if (!expiresAt) return true;
    // Check if token expires in less than 5 minutes
    return Date.now() / 1000 > expiresAt - 300;
  }
}

// API Client class
class ApiClient {
  // Refresh the access token
  private refreshPromise: Promise<boolean> | null = null;

  private async refreshAccessToken(): Promise<boolean> {
    console.log("Refreshing access token...");
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(API_ROUTES.AUTH.REFRESH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      TokenManager.setTokens(data.access_token, data.refresh_token, data.expires_at);
      return true;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
      console.log("Token refresh process completed.");
    }
  }

  // Make authenticated request with automatic token refresh
  private async authenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // 1️⃣ Refresh if expired
    if (TokenManager.isTokenExpired()) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        TokenManager.clearTokens();
        throw new Error("Session expired. Please login again.");
      }
    }

    // 2️⃣ Add access token to headers
    let accessToken = TokenManager.getAccessToken();
    if (!accessToken) throw new Error("No access token found. Please login.");

    const headers = { ...options.headers, Authorization: `Bearer ${accessToken}` };
    let response: Response;

    try {
      response = await fetch(url, { ...options, headers });
    } catch (err) {
      console.error("Network error during fetch:", err);
      throw err;
    }

    // 3️⃣ Retry once if 401
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        TokenManager.clearTokens();
        throw new Error("Session expired. Please login again.");
      }

      // Retry request with new token
      accessToken = TokenManager.getAccessToken()!;
      const retryHeaders = { ...options.headers, Authorization: `Bearer ${accessToken}` };
      response = await fetch(url, { ...options, headers: retryHeaders });
    }

    return response;
  }

  async signup(params: SignupData) {
    // Clear any existing sessions/tokens first to ensure fresh signup
    try {
      await supabase.auth.signOut({ scope: "local" });
      TokenManager.clearTokens();
      // Clear all app-related sessionStorage
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("housebook_") || key.startsWith("sb-")) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Error clearing previous session:", error);
      // Continue with signup even if cleanup fails
    }

    const response = await fetch(API_ROUTES.AUTH.SIGNUP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      //credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Signup failed");
    }

    const data = await response.json();

    // Store new tokens in our custom TokenManager
    TokenManager.setTokens(
      data.user.accessToken,
      data.user.refreshToken,
      data.user.expiresAt
    );

    // IMPORTANT: Restore Supabase session with the tokens we received
    // This is necessary for Supabase RLS policies to work correctly
    try {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: data.user.accessToken,
        refresh_token: data.user.refreshToken,
      });

      if (setSessionError) {
        console.error("Error setting Supabase session:", setSessionError);
        throw new Error("Failed to restore Supabase session");
      }

      console.log("New session created for:", data.user.email);
      console.log("Supabase session restored");
    } catch (error) {
      console.error("Failed to set Supabase session:", error);
      throw error;
    }

    return data.user;
  }

  async verifyAuth() {
    const response = await this.authenticatedRequest(API_ROUTES.AUTH.VERIFY);

    if (!response.ok) {
      throw new Error("Token verification failed");
    }

    return response.json();
  }

  // In your ApiClient class, update the logout method:

  async logout() {
    try {
      // 1. Sign out from Supabase first
      try {
        await supabase.auth.signOut({ scope: "local" });
        console.log("Supabase session cleared");
      } catch (supabaseError) {
        console.warn("Supabase signOut warning (non-critical):", supabaseError);
      }

      // 2. Nuclear option: Clear ALL sessionStorage
      sessionStorage.clear();
      console.log("Logout successful - all sessionStorage cleared");

      // 3. Return true - let the calling component handle navigation
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      sessionStorage.clear(); // Clear everything even on error
      return true;
    }
  }

  // Also update the login method to ensure clean state:

  async login(params: LoginParams) {
    // Clear any existing sessions/tokens first to ensure fresh login
    try {
      // Clear Supabase session
      //await supabase.auth.signOut({ scope: "local" });

      // Nuclear option: Clear ALL sessionStorage
      sessionStorage.clear();

      console.log("Previous session cleared completely");
    } catch (error) {
      console.warn("Error clearing previous session:", error);
    }

    const response = await fetch(API_ROUTES.AUTH.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      //credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Login failed");
    }

    const data = await response.json();

    // Store new tokens
    TokenManager.setTokens(
      data.user.accessToken,
      data.user.refreshToken,
      data.user.expiresAt
    );

    // Restore Supabase session
    /*
    try {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: data.user.accessToken,
        refresh_token: data.user.refreshToken,
      });

      if (setSessionError) {
        console.error("Error setting Supabase session:", setSessionError);
        throw new Error("Failed to restore Supabase session");
      }

      console.log("New session created for:", data.user.email);
    } catch (error) {
      console.error("Failed to set Supabase session:", error);
      throw error;
    }
    */

    return data.user;
  }

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

    return response.json();
  }

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

    return response.json();
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

  // deletes image based on signed URL
  async deletePropertyImages(signedUrls: string | string[]) {
    const body = { signedUrls };

    const response = await this.authenticatedRequest(
      API_ROUTES.IMAGES.DELETE, // make sure you have this route defined
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete images");
    }

    return response.json(); // returns array of results from backend
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

  // Transfer methods
  async getTransfersByProperty(propertyId: string) {
    console.log("Fetching transfers for propertyId:", propertyId);
    const response = await this.authenticatedRequest(
      API_ROUTES.TRANSFER.GET({ action: "byProperty", id: propertyId })
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch transfers for property");
    }

    const data = await response.json();
    return data;
  }

  async getTransfersByUser(userId: string) {
    console.log("Fetching transfers for userId:", userId);
    const response = await this.authenticatedRequest(
      API_ROUTES.TRANSFER.GET({ action: "byOwner", id: userId })
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch transfers for user");
    }

    const data = await response.json();
    console.log("getTransfersByUser response data:", data);
    return data;
  }

  async initiateTransfer(
    propertyId: string,
    oldOwnerUserIds: string[],
    newOwnerUserIds: string[]
  ) {
    const response = await this.authenticatedRequest(
      API_ROUTES.TRANSFER.INITIATE,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          oldOwnerUserIds,
          newOwnerUserIds,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to initiate transfer");
    }

    const data = await response.json();
    console.log("initiateTransfer response data:", data);
    return data;
  }

  async approveTransfer(transferId: string, ownerId: { ownerId: string }) {
    const { approveTransfer } = await import(
      "../../../backend/TransferService"
    );
    try {
      const result = await approveTransfer(transferId, ownerId.ownerId);
      console.log("approveTransfer response data:", result);
      return result;
    } catch (error: any) {
      console.error("Failed to approve transfer:", error);
      throw new Error(error.message || "Failed to approve transfer");
    }
  }

  async rejectTransfer(transferId: string, ownerId: { ownerId: string }) {
    try {
      const result = await rejectTransfer(transferId, ownerId.ownerId);
      console.log("rejectTransfer response data:", result);
      return result;
    } catch (error: any) {
      console.error("Failed to reject transfer:", error);
      throw new Error(error.message || "Failed to reject transfer");
    }
  }

  async getOwnerIdByUserId(userId: string) {
    try {
      const ownerId = await getOwnerId(userId);
      console.log("getOwnerIdByUserId response:", ownerId);
      return ownerId;
    } catch (error: any) {
      console.error("Failed to get owner ID:", error);
      throw new Error(error.message || "Failed to get owner ID");
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export TokenManager for direct access if needed
export { TokenManager };
