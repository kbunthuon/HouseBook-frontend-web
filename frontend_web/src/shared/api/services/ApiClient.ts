import { API_ROUTES } from "../routes";

export class TokenManager {
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

export class BaseApiClient {
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
  protected async authenticatedRequest(
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
}