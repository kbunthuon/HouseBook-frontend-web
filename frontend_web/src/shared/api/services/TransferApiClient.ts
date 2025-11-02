import { rejectTransfer } from "@backend/TransferService";
import { BaseApiClient } from "./ApiClient";
import { API_ROUTES } from "../routes";

export class TransferApiClient extends BaseApiClient {
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
    const { approveTransfer } = await import("@backend/TransferService");
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
}