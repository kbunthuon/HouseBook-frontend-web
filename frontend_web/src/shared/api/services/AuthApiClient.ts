import { supabase } from "@config/supabaseClient";
import { SignupData } from "@housebookgroup/shared-types";
import { TokenManager } from "api/wrappers";
import { BaseApiClient } from "./ApiClient";
import { API_ROUTES, LoginParams } from "../routes";

export class AuthApiClient extends BaseApiClient {

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
    
    
        return data.user;
      }
}