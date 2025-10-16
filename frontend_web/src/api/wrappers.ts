import {
  API_ROUTES,
  LoginParams,
  OwnerOnboardParams,
  AdminOnboardParams,
} from "./routes";
import { SignupData } from "@housebookgroup/shared-types";
import supabase from "../../../config/supabaseClient";

// Token management
class TokenManager {
  private static ACCESS_TOKEN_KEY = "housebook_access_token";
  private static EXPIRES_AT_KEY = "housebook_expires_at";

  static setTokens(
    accessToken: string,
    refreshToken: string,
    expiresAt?: number
  ) {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    if (expiresAt) {
      localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());
    }
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getExpiresAt(): number | null {
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
    return expiresAt ? parseInt(expiresAt) : null;
  }

  static clearTokens() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
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
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(API_ROUTES.AUTH.REFRESH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for refresh token
      });

      if (!response.ok) return false;

      const data = await response.json();
      TokenManager.setTokens(data.access_token, data.expires_at);
      return true;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return false;
    }
  }

  // Make authenticated request with automatic token refresh
  private async authenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Check if token needs refresh
    if (TokenManager.isTokenExpired()) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        TokenManager.clearTokens();
        console.log('✅ Tokens cleared from localStorage');
        throw new Error("Session expired. Please login again.");
      }
    }

    const accessToken = TokenManager.getAccessToken();
    if (!accessToken) {
      throw new Error("No access token found. Please login.");
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, try refreshing token once
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        const newAccessToken = TokenManager.getAccessToken();
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        });
      }
      TokenManager.clearTokens();
      throw new Error("Session expired. Please login again.");
    }

    return response;
  }

  // Authentication methods
  async login(params: LoginParams) {
    // Clear any existing sessions/tokens first to ensure fresh login
    try {
      await supabase.auth.signOut();
      TokenManager.clearTokens();
      // Clear all app-related localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('housebook_') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Error clearing previous session:", error);
      // Continue with login even if cleanup fails
    }

    const response = await fetch(API_ROUTES.AUTH.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Login failed");
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

      console.log('✅ New session created for:', data.user.email, data);
      console.log('✅ Supabase session restored');
    } catch (error) {
      console.error("Failed to set Supabase session:", error);
      throw error;
    }

    return data.user;
  }

  async signup(params: SignupData) {
    // Clear any existing sessions/tokens first to ensure fresh signup
    try {
      await supabase.auth.signOut();
      TokenManager.clearTokens();
      // Clear all app-related localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('housebook_') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
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
      credentials: "include",
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

      console.log('✅ New session created for:', data.user.email);
      console.log('✅ Supabase session restored');
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

  async logout() {
    try {
      // 1. Sign out from Supabase first to clear auth session
      const { error: supabaseError } = await supabase.auth.signOut();
      if (supabaseError) {
        console.error("Supabase signOut error:", supabaseError);
      }

      // 2. Call backend logout endpoint
      const response = await fetch(API_ROUTES.AUTH.LOGOUT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // include HttpOnly refresh token cookie
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Logout failed");
      }

      // 3. Clear all tokens and session data from localStorage
      TokenManager.clearTokens();

      // 4. Clear any other app-specific data that might be cached
      localStorage.removeItem('supabase.auth.token');

      // Clear all localStorage items related to the app (be careful not to clear third-party data)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('housebook_') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });

      return true;
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, still clear local data
      TokenManager.clearTokens();
      localStorage.clear(); // Nuclear option: clear everything
      throw error;
    }
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
      phone: data.phone
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
    const { checkOwnerExists } = await import("../../../backend/OnboardPropertyService");
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

    return response.json();
  }

  // Transfer methods
  async getTransfersByProperty(propertyId: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.TRANSFER.GET({ action: "byProperty", id: propertyId })
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch transfers for property");
    }

    const data = await response.json();
    return data
  }

  async getTransfersByUser(userId: string) {
    const { getTransfersByOwner } = await import("../../../backend/TransferService");
    const { getOwnerId } = await import("../../../backend/FetchData");

    try {
      // Convert user ID to owner ID first
      const ownerId = await getOwnerId(userId);

      // Fetch transfers with user-specific status
      const data = await getTransfersByOwner(ownerId);
      console.log("getTransfersByUser response data:", data);
      return data;
    } catch (error: any) {
      console.error("Failed to fetch transfers:", error);
      throw new Error(error.message || "Failed to fetch transfers for user");
    }
  }

  async initiateTransfer(propertyId: string, oldOwnerUserIds: string[], newOwnerUserIds: string[]) {
    const { initiateTransfer } = await import("../../../backend/TransferService");
    const { getOwnerId } = await import("../../../backend/FetchData");

    try {
      // Convert user IDs to owner IDs
      const oldOwnerIds = await Promise.all(
        oldOwnerUserIds.map(userId => getOwnerId(userId))
      );

      const newOwnerIds = await Promise.all(
        newOwnerUserIds.map(userId => getOwnerId(userId))
      );

      const result = await initiateTransfer(propertyId, oldOwnerIds, newOwnerIds);
      console.log("initiateTransfer response data:", result);
      return result;
    } catch (error: any) {
      console.error("Failed to initiate transfer:", error);
      throw new Error(error.message || "Failed to initiate transfer");
    }
  }

  async approveTransfer(transferId: string, ownerId: string) {
    const { approveTransfer } = await import("../../../backend/TransferService");
    try {
      const result = await approveTransfer(transferId, ownerId);
      console.log("approveTransfer response data:", result);
      return result;
    } catch (error: any) {
      console.error("Failed to approve transfer:", error);
      throw new Error(error.message || "Failed to approve transfer");
    }
  }

  async rejectTransfer(transferId: string, ownerId: string) {
    const { rejectTransfer } = await import("../../../backend/TransferService");
    try {
      const result = await rejectTransfer(transferId, ownerId);
      console.log("rejectTransfer response data:", result);
      return result;
    } catch (error: any) {
      console.error("Failed to reject transfer:", error);
      throw new Error(error.message || "Failed to reject transfer");
    }
  }

  async getOwnerIdByUserId(userId: string) {
    const { getOwnerId } = await import("../../../backend/FetchData");
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
