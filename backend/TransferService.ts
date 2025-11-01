import {supabase} from "../config/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

// Transfer statuses
// Database enum: transfer_status (PENDING, ACCEPTED, DECLINED)
export enum TransferStatus {
  PENDING = "PENDING",
  APPROVED = "ACCEPTED", // Note: Database uses "ACCEPTED" not "APPROVED"
  DECLINED = "DECLINED",
}

// Individual owner approval statuses
// Database enum: Transfer_Accept_Status (ACCEPTED, REJECTED, PENDING)
export enum TransferAcceptStatus {
  PENDING = "PENDING",
  APPROVED = "ACCEPTED", // Note: Database uses "ACCEPTED" not "APPROVED"
  REJECTED = "REJECTED",
}

export type TransferNewOwner = {
  transfer_id: string;
  owner_id: string;
  status: TransferAcceptStatus;
};

export type TransferOldOwner = {
  transfer_id: string;
  owner_id: string;
  status: TransferAcceptStatus;
};

/**
 * Approve a transfer for a specific owner
 * @param transferId - The transfer ID
 * @param ownerId - The owner approving the transfer
 */
export async function approveTransfer(transferId: string, ownerId: string) {
  console.log("approveTransfer called with:", { transferId, ownerId });

  // Update status in TransferOldOwners if owner exists there
  const { data: oldOwnerUpdate, error: oldOwnerError } = await supabase
    .from("TransferOldOwners")
    .update({ status: TransferAcceptStatus.APPROVED })
    .eq("transfer_id", transferId)
    .eq("owner_id", ownerId)
    .select();

  console.log("TransferOldOwners update:", {
    data: oldOwnerUpdate,
    error: oldOwnerError,
  });

  // Update status in TransferNewOwners if owner exists there
  const { data: newOwnerUpdate, error: newOwnerError } = await supabase
    .from("TransferNewOwners")
    .update({ status: TransferAcceptStatus.APPROVED })
    .eq("transfer_id", transferId)
    .eq("owner_id", ownerId)
    .select();

  console.log("TransferNewOwners update:", {
    data: newOwnerUpdate,
    error: newOwnerError,
  });

  // If both updates returned empty arrays, the owner wasn't found in either table
  console.log(oldOwnerUpdate + " _ " + newOwnerUpdate);
  if (
    (!oldOwnerUpdate || oldOwnerUpdate.length === 0) &&
    (!newOwnerUpdate || newOwnerUpdate.length === 0)
  ) {
    console.error(
      "Owner not found in either TransferOldOwners or TransferNewOwners"
    );
    throw new Error(`Owner ${ownerId} not found in transfer ${transferId}`);
  }

  // Check if ALL owners have approved (both old and new tables)
  const { data: oldOwners, error: oldOwnersError } = await supabase
    .from("TransferOldOwners")
    .select("status")
    .eq("transfer_id", transferId);

  const { data: newOwners, error: newOwnersError } = await supabase
    .from("TransferNewOwners")
    .select("status")
    .eq("transfer_id", transferId);

  console.log("Checking all approvals:", {
    oldOwners,
    oldOwnersError,
    newOwners,
    newOwnersError,
  });

  const allApproved =
    oldOwners?.every((o) => o.status === TransferAcceptStatus.APPROVED) &&
    newOwners?.every((o) => o.status === TransferAcceptStatus.APPROVED);

  console.log("All approved?", allApproved);

  if (allApproved) {
    console.log(
      "All owners approved! Updating transfer status and executing ownership change"
    );
    // Update main transfer status
    const { error: transferUpdateError } = await supabase
      .from("Transfers")
      .update({ status: TransferStatus.APPROVED })
      .eq("transfer_id", transferId);

    if (transferUpdateError) {
      console.error("Error updating transfer status:", transferUpdateError);
      throw transferUpdateError;
    }

    // Execute the actual property ownership change
    await executePropertyOwnershipChange(transferId);
  }

  return { success: true, allApproved };
}

/**
 * Reject a transfer for a specific owner (cancels entire transfer)
 * @param transferId - The transfer ID
 * @param ownerId - The owner rejecting the transfer
 */
export async function rejectTransfer(transferId: string, ownerId: string) {
  // Update status in TransferOldOwners if owner exists there
  await supabase
    .from("TransferOldOwners")
    .update({ status: TransferAcceptStatus.REJECTED })
    .eq("transfer_id", transferId)
    .eq("owner_id", ownerId);

  // Update status in TransferNewOwners if owner exists there
  await supabase
    .from("TransferNewOwners")
    .update({ status: TransferAcceptStatus.REJECTED })
    .eq("transfer_id", transferId)
    .eq("owner_id", ownerId);

  // Mark entire transfer as DECLINED
  await supabase
    .from("Transfers")
    .update({ status: TransferStatus.DECLINED })
    .eq("transfer_id", transferId);

  return { success: true };
}

/**
 * Execute the actual property ownership change
 * Called when ALL owners have approved
 */
async function executePropertyOwnershipChange(transferId: string) {
  // Get transfer details
  const { data: transfer } = await supabase
    .from("Transfers")
    .select("property_id")
    .eq("transfer_id", transferId)
    .single();

  if (!transfer) throw new Error("Transfer not found");

  // Get old owners to remove
  const { data: oldOwners } = await supabase
    .from("TransferOldOwners")
    .select("owner_id")
    .eq("transfer_id", transferId);

  // Get new owner state
  const { data: newOwners } = await supabase
    .from("TransferNewOwners")
    .select("owner_id")
    .eq("transfer_id", transferId);

  if (!oldOwners || !newOwners) throw new Error("Owner data not found");

  const propertyId = transfer.property_id;
  const oldOwnerIds = oldOwners.map((o) => o.owner_id);
  const newOwnerIds = newOwners.map((o) => o.owner_id);

  // Delete old owners from OwnerProperty
  await supabase
    .from("OwnerProperty")
    .delete()
    .eq("property_id", propertyId)
    .in("owner_id", oldOwnerIds);

  // Insert new owners into OwnerProperty
  const ownerPropertyData = newOwnerIds.map((ownerId) => ({
    property_id: propertyId,
    owner_id: ownerId,
  }));

  await supabase.from("OwnerProperty").insert(ownerPropertyData);
}
