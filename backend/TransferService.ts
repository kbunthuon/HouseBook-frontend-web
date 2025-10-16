import supabase from "../config/supabaseClient";

// Possible job statuses
export enum TransferStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    DECLINED = "DECLINED",
}

export type TransferNewOwner = {
    transfer_id: string;
    owner_id: string;
  };

export type TransferOldOwner = {
transfer_id: string;
owner_id: string;
};

import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchOldOwnerTransfers(sb: SupabaseClient, userId: string) {
  const { data, error } = await sb
    .from("Transfers")
    .select(`
      transfer_id,
      created_at,
      property_id, 
      status
    `)
    .eq("TransferOldOwners.owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // const now = Date.now();
  return (data ?? []).filter(t =>
    t.status === TransferStatus.PENDING ||
    t.status === TransferStatus.APPROVED 
    // && t.visible_until && new Date(t.visible_until).getTime() > now
    || t.status === TransferStatus.DECLINED
  );
}
