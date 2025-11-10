import { apiClient } from "../frontend_web/src/api/wrappers";

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

