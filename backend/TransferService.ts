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
 * Fetch transfers for a specific user (owner) - Legacy function
 */
export async function fetchOldOwnerTransfers(
  sb: SupabaseClient,
  userId: string
) {
  const { data, error } = await sb
    .from("Transfers")
    .select(
      `
      transfer_id,
      created_at,
      property_id,
      status
    `
    )
    .eq("TransferOldOwners.owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).filter(
    (t) =>
      t.status === TransferStatus.PENDING ||
      t.status === TransferStatus.APPROVED ||
      t.status === TransferStatus.DECLINED
  );
}

/**
 * Get transfers for a specific owner with their individual status
 * @param ownerId - The owner ID to fetch transfers for
 * @returns Array of transfers with user-specific status
 */
export async function getTransfersByOwner(ownerId: string) {
  // Get all transfers where this owner is involved (either old or new)
  const { data: oldOwnerTransfers, error: oldError } = await supabase
    .from("TransferOldOwners")
    .select(
      `
      transfer_id,
      status,
      Transfers (
        transfer_id,
        property_id,
        status,
        created_at,
        Property (
          property_id,
          name,
          address
        )
      )
    `
    )
    .eq("owner_id", ownerId);

  const { data: newOwnerTransfers, error: newError } = await supabase
    .from("TransferNewOwners")
    .select(
      `
      transfer_id,
      status,
      Transfers (
        transfer_id,
        property_id,
        status,
        created_at,
        Property (
          property_id,
          name,
          address
        )
      )
    `
    )
    .eq("owner_id", ownerId);

  if (oldError) throw oldError;
  if (newError) throw newError;

  // Combine and deduplicate transfers
  const transferMap = new Map();

  // Process old owner transfers
  for (const item of oldOwnerTransfers || []) {
    const transfer = item.Transfers as any;
    if (!transfer) continue;

    transferMap.set(transfer.transfer_id, {
      transferId: transfer.transfer_id,
      propertyId: transfer.property_id,
      propertyName: (transfer.Property as any)?.name || "Unknown",
      propertyAddress: (transfer.Property as any)?.address,
      transferStatus: transfer.status,
      userStatus: item.status, // This user's status
      transferCreatedAt: transfer.created_at,
    });
  }

  // Process new owner transfers (update or add)
  for (const item of newOwnerTransfers || []) {
    const transfer = item.Transfers as any;
    if (!transfer) continue;

    if (transferMap.has(transfer.transfer_id)) {
      // User is in both tables, ensure status is the same
      const existing = transferMap.get(transfer.transfer_id);
      existing.userStatus = item.status;
    } else {
      transferMap.set(transfer.transfer_id, {
        transferId: transfer.transfer_id,
        propertyId: transfer.property_id,
        propertyName: (transfer.Property as any)?.name || "Unknown",
        propertyAddress: (transfer.Property as any)?.address,
        transferStatus: transfer.status,
        userStatus: item.status,
        transferCreatedAt: transfer.created_at,
      });
    }
  }

  // Get old and new owners for each transfer
  const transfers = Array.from(transferMap.values());

  for (const transfer of transfers) {
    // Get all old owners
    const { data: oldOwners, error: oldOwnersQueryError } = await supabase
      .from("TransferOldOwners")
      .select(
        `
        owner_id,
        status,
        Owner (
          owner_id,
          user_id,
          User (
            user_id,
            first_name,
            last_name,
            email
          )
        )
      `
      )
      .eq("transfer_id", transfer.transferId);

    if (oldOwnersQueryError) {
      console.error("Error fetching old owners:", oldOwnersQueryError);
      // Continue with empty array if there's an error
    }

    // For NEW owners
    const { data: newOwners, error: newOwnersQueryError } = await supabase
      .from("TransferNewOwners")
      .select(
        `
        owner_id,
        status,
        Owner (
          owner_id,
          user_id,
          User (
            user_id,
            first_name,
            last_name,
            email
          )
        )
      `
      )
      .eq("transfer_id", transfer.transferId);

    if (newOwnersQueryError) {
      console.error("Error fetching new owners:", newOwnersQueryError);
      // Continue with empty array if there's an error
    }

    transfer.oldOwners = (oldOwners || []).map((o: any) => ({
      ownerId: o.Owner?.owner_id,
      userId: o.Owner?.User?.user_id,
      firstName: o.Owner?.User?.first_name,
      lastName: o.Owner?.User?.last_name,
      email: o.Owner?.User?.email,
      acceptStatus: o.status,
    }));

    transfer.newOwners = (newOwners || []).map((o: any) => ({
      ownerId: o.Owner?.owner_id,
      userId: o.Owner?.User?.user_id,
      firstName: o.Owner?.User?.first_name,
      lastName: o.Owner?.User?.last_name,
      email: o.Owner?.User?.email,
      acceptStatus: o.status,
    }));
  }

  return {
    transfers: transfers.sort(
      (a, b) =>
        new Date(b.transferCreatedAt).getTime() -
        new Date(a.transferCreatedAt).getTime()
    ),
  };
}

/**
 * Initiate a new property transfer
 * @param propertyId - The property being transferred
 * @param allOldOwnerIds - ALL current owners (A, B, C)
 * @param newOwnerStateIds - Remaining owners + new owners (C, D, E)
 */
export async function initiateTransfer(
  propertyId: string,
  allOldOwnerIds: string[],
  newOwnerStateIds: string[]
) {
  console.log("initiateTransfer called with:", {
    propertyId,
    allOldOwnerIds,
    newOwnerStateIds,
  });

  // 1. Check if there's already a pending transfer for this property
  const { data: existingTransfer } = await supabase
    .from("Transfers")
    .select("transfer_id, status")
    .eq("property_id", propertyId)
    .eq("status", TransferStatus.PENDING)
    .maybeSingle();

  if (existingTransfer) {
    throw new Error(
      "A pending transfer already exists for this property. Please complete or cancel the existing transfer first."
    );
  }

  // 2. Verify all old owners actually own this property
  const { data: currentOwnership, error: ownershipError } = await supabase
    .from("OwnerProperty")
    .select("owner_id")
    .eq("property_id", propertyId);

  if (ownershipError) {
    console.error("Error checking property ownership:", ownershipError);
    throw new Error("Failed to verify property ownership");
  }

  const currentOwnerIds = (currentOwnership || []).map((o) => o.owner_id);

  // Check that all provided old owners actually own the property
  const invalidOldOwners = allOldOwnerIds.filter(
    (id) => !currentOwnerIds.includes(id)
  );
  if (invalidOldOwners.length > 0) {
    throw new Error(
      `The following owners do not own this property: ${invalidOldOwners.join(
        ", "
      )}`
    );
  }

  // Check that all current owners are included in allOldOwnerIds
  const missingOldOwners = currentOwnerIds.filter(
    (id) => !allOldOwnerIds.includes(id)
  );
  if (missingOldOwners.length > 0) {
    throw new Error("All current owners must be included in the transfer");
  }

  const { data: transfer, error: transferError } = await supabase
    .from("Transfers")
    .insert({
      property_id: propertyId,
      status: TransferStatus.PENDING,
    })
    .select()
    .single();

  if (transferError) {
    console.error("Error creating transfer:", transferError);
    throw transferError;
  }

  console.log("Transfer created:", transfer);

  // Insert all old owners into TransferOldOwners
  const oldOwnersData = allOldOwnerIds.map((ownerId) => ({
    transfer_id: transfer.transfer_id,
    owner_id: ownerId,
    status: TransferAcceptStatus.PENDING,
  }));

  console.log("Inserting old owners:", oldOwnersData);

  const { data: oldOwnersResult, error: oldOwnersError } = await supabase
    .from("TransferOldOwners")
    .insert(oldOwnersData)
    .select();

  if (oldOwnersError) {
    console.error("Error inserting old owners:", oldOwnersError);
    throw oldOwnersError;
  }

  console.log("Old owners inserted:", oldOwnersResult);

  // Insert new owner state into TransferNewOwners
  const newOwnersData = newOwnerStateIds.map((ownerId) => ({
    transfer_id: transfer.transfer_id,
    owner_id: ownerId,
    status: TransferAcceptStatus.PENDING,
  }));

  console.log("Inserting new owners:", newOwnersData);

  const { data: newOwnersResult, error: newOwnersError } = await supabase
    .from("TransferNewOwners")
    .insert(newOwnersData)
    .select();

  if (newOwnersError) {
    console.error("Error inserting new owners:", newOwnersError);
    throw newOwnersError;
  }

  console.log("New owners inserted:", newOwnersResult);

  return transfer;
}

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
