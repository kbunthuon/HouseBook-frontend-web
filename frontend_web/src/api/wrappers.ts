import { API_ROUTES, LoginParams, OwnerOnboardParams, AdminOnboardParams } from './routes';
import { SignupData } from '@housebookgroup/shared-types';

// Token management
class TokenManager {
  private static ACCESS_TOKEN_KEY = 'housebook_access_token';
  private static EXPIRES_AT_KEY = 'housebook_expires_at';

  static setTokens(accessToken: string, refreshToken: string, expiresAt?: number) {
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for refresh token
      });

      if (!response.ok) return false;

      const data = await response.json();
      TokenManager.setTokens(
        data.access_token,
        data.expires_at
      );
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
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
        throw new Error('Session expired. Please login again.');
      }
    }

    const accessToken = TokenManager.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token found. Please login.');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
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
            'Authorization': `Bearer ${newAccessToken}`,
          },
        });
      }
      TokenManager.clearTokens();
      throw new Error('Session expired. Please login again.');
    }

    return response;
  }

  // Authentication methods
  async login(params: LoginParams) {
    const response = await fetch(API_ROUTES.AUTH.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Login failed');
    }

    const data = await response.json();
    
    // Store tokens
    TokenManager.setTokens(
      data.user.accessToken,
      data.user.refreshToken,
      data.user.expiresAt
    );

    return data.user;
  }

  async signup(params: SignupData) {
    const response = await fetch(API_ROUTES.AUTH.SIGNUP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Signup failed');
    }

    const data = await response.json();
    
    // Store tokens
    TokenManager.setTokens(
      data.user.accessToken,
      data.user.refreshToken,
      data.user.expiresAt
    );

    return data.user;
  }
  

  async verifyAuth() {
    const response = await this.authenticatedRequest(API_ROUTES.AUTH.VERIFY);
    
    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    return response.json();
  }

  async logout() {
    const response = await fetch(API_ROUTES.AUTH.LOGOUT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // include HttpOnly refresh token cookie
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Logout failed');
    }

    // Clear access token from localStorage
    TokenManager.clearTokens();

    return true; // optional, indicates logout success
    }

  // User methods
  async getUserInfoByEmail(email: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.USER.INFO_BY_EMAIL(email)
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user info');
    }

    return response.json();
  }

  // Owner methods
  async getOwnerId(userId: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.OWNER.GET_ID(userId)
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch owner ID');
    }

    return response.json();
  }

  async ownerOnboardProperty(params: OwnerOnboardParams) {
    const response = await this.authenticatedRequest(
      API_ROUTES.OWNER.ONBOARD_PROPERTY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to onboard property');
    }

    return response.json();
  }

  // Admin methods
  async adminOnboardProperty(params: AdminOnboardParams) {
    const response = await this.authenticatedRequest(
      API_ROUTES.ADMIN.ONBOARD_PROPERTY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to onboard property as admin');
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
      throw new Error(error.error || 'Failed to fetch properties');
    }

    return response.json();
  }

  async getPropertyOwners(propertyId: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.OWNERS(propertyId)
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch property owners');
    }

    return response.json();
  }

  async getPropertyDetails(propertyId: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.PROPERTY.DETAILS(propertyId)
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch property details');
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
      throw new Error(error.error || 'Failed to fetch images');
    }

    return response.json();
  }

  async uploadPropertyImage(propertyId: string, file: File, description?: string) {
    const formData = new FormData();
    formData.append('propertyId', propertyId);
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await this.authenticatedRequest(
      API_ROUTES.IMAGES.UPLOAD,
      {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let browser set it with boundary
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload image');
    }

    return response.json();
  }

  // Changelog methods
  async getChangeLogs(propertyIds: string[]) {
    console.log("propertyIds being sent:", propertyIds);
    const url = API_ROUTES.CHANGELOG.GET(propertyIds);
    console.log("Fetching changelogs from:", url);
    const response = await this.authenticatedRequest(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch change logs');
    }

    return response.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export TokenManager for direct access if needed
export { TokenManager };
