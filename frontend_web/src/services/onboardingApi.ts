import { FormData, SpaceInt, OwnerData } from "../types";

const BASE_URL = import.meta.env.VITE_BACKEND_URL; // your Render backend URL

interface OnboardResponse {
  propertyId?: string;
  error?: string;
}

export const adminOnboardProperty = async (
  ownerData: OwnerData,
  formData: FormData,
  spaces: SpaceInt[]
): Promise<OnboardResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/onboard/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ownerData, formData, spaces }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || "Failed to onboard property" };
    }

    return { propertyId: data.propertyId };
  } catch (err: any) {
    console.error("Error calling onboard API:", err);
    return { error: err.message || "Failed to onboard property" };
  }
};

export const ownerOnboardProperty = async (
  formData: FormData,
  spaces: SpaceInt[]
): Promise<{ propertyId?: string; error?: string }> => {
  try {
    const res = await fetch(`${BASE_URL}/onboard/owner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData, spaces }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || "Failed to onboard property" };
    }

    return { propertyId: data.propertyId };
  } catch (err: any) {
    return { error: err.message || "Failed to onboard property" };
  }
};
