// backend/JobService.ts
/// <reference types="vite/client" />
import { apiClient } from "../frontend_web/src/api/wrappers";

export interface JobAsset {
  asset_id: string;
  job_id: string;
}

// Shape of a job record
export interface Job {
  id: string | null;        // May be null before insert
  propertyId: string;
  title: string;
  createdAt: string;       // ISOString
  endTime: string | null;  // ISOString
  expired: boolean;
  pin: string;
}

// Input filters for the query
export interface FetchJobInfoParams {
  propertyId: string; // required
  expired?: boolean | null;
  last?: number | null;
}

/**
 * Fetches jobs for a given property with optional filters.
 * @param propertyId - ID of the property (required).
 * @param expired - (Optional) Filter by expired flag.
 * @param last - (Optional) Limit the number of jobs returned (most recent first).
 * @returns A list of Job list and JobAsset list
 */
export async function fetchJobsInfo({ propertyId, expired = null, last = null }: FetchJobInfoParams): Promise<[Job[], JobAsset[]]> {
  const data = await apiClient.fetchJobs(propertyId, expired, last);
  return [data.jobs, data.jobAssets];
}

/**
 * Frontend-friendly function to create a job AND its associated assets.
 * @param job - Job data (title, propertyId, endTime etc.)
 * @param assetIds - Array of selected asset IDs
 */
export async function insertJobsInfo(job: Job, assetIds: string[]): Promise<[Job, JobAsset[] | null]> {
  const data = await apiClient.createJob(job, assetIds);
  return [data.job, data.assets];
}

/**
 * Fetches job assets for a specific job ID.
 * @param jobId - The job ID to fetch assets for
 * @returns Array of JobAsset objects
 */
export async function fetchJobAssets(jobId: string): Promise<JobAsset[]> {
  const data = await apiClient.fetchJobAssets(jobId);
  return data ?? [];
}

/**
 * Deletes a job and all its associated assets.
 * Uses database CASCADE to automatically delete related JobAssets.
 * @param jobId - ID of the job to delete
 * @returns Boolean indicating success
 */
export async function deleteJob(jobId: string): Promise<boolean> {
  const data = await apiClient.deleteJob(jobId);
  return data;
}


/**
 * Updates a job row and its associated assets in a single operation.
 * @param job - Job object with updated data
 * @param assetIds - Array of asset IDs to associate with this job
 * @returns Updated Job and JobAsset list
 */
export async function updateJobInfo(job: Job, assetIds: string[]): Promise<[Job, JobAsset[] | null]> {
  const data = await apiClient.updateJob(job, assetIds);
  return [data.job, data.assets]
}

/**
 * Helper function to generate a timestamp one hour from now.
 * @returns ISO string timestamp
 */
function oneHourFromNowISO(): string {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

/**
 * Fetches job assets with their corresponding property space and asset information.
 * Useful for populating edit forms with detailed asset information.
 * @param jobId - The job ID to fetch assets for
 * @returns Array of JobAsset objects with additional asset details
 */
export async function fetchJobAssetsWithDetails(jobId: string): Promise<any[]> {
  const data = await apiClient.fetchJobAssets(jobId, true);
  return data;
}