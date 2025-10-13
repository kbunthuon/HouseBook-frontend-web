// backend/JobService.ts
/// <reference types="vite/client" />
import supabase from "../config/supabaseClient";

// Possible job statuses
export enum JobStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REVOKED = "REVOKED",
  DELETED = "DELETED",
}

export interface JobAsset {
  asset_id: string;
  job_id: string;
}

// Shape of a job record
export interface Job {
  id: string | null;        // May be null before insert
  property_id: string;
  tradie_id: string | null; // May be null at creation of Job
  title: string;
  status: JobStatus;
  created_at: string;       // ISOString
  end_time: string | null;  // ISOString
  expired: boolean;
  pin: string;
}

// Input filters for the query
export interface FetchJobInfoParams {
  property_id: string; // required
  tradie_id?: string | null;
  status?: JobStatus | null;
  expired?: boolean | null;
  last?: number | null;
}

/**
 * Fetches jobs for a given property with optional filters.
 * @param property_id - ID of the property (required).
 * @param tradie_id - (Optional) Filter by tradie ID.
 * @param status - (Optional) Filter by job status.
 * @param expired - (Optional) Filter by expired flag.
 * @param last - (Optional) Limit the number of jobs returned (most recent first).
 * @returns A list of Job list and JobAsset list
 */
export async function fetchJobsInfo({ property_id, tradie_id = null, status = null, expired = null, last = null }: FetchJobInfoParams): Promise<[Job[], JobAsset[]]> {
  const allJobs = await fetchJobsTable({ property_id, tradie_id, status, expired, last });

  // Fetch assets for all jobs
  const allJobAssets: JobAsset[] = [];
  for (const job of allJobs) {
    if (job.id) {
      const assets = await fetchJobAssets(job.id);
      if (assets) {
        allJobAssets.push(...assets);
      }
    }
  }

  return [allJobs, allJobAssets];
}

/**
 * Fetches jobs for a given property with optional filters.
 * @param property_id - ID of the property (required).
 * @param tradie_id - (Optional) Filter by tradie ID.
 * @param status - (Optional) Filter by job status.
 * @param expired - (Optional) Filter by expired flag.
 * @param last - (Optional) Limit the number of jobs returned (most recent first).
 * @returns A list of jobs matching the filters, ordered by creation time (newest first).
 */
export async function fetchJobsTable({ property_id, tradie_id = null, status = null, expired = null, last = null }: FetchJobInfoParams): Promise<Job[]> {
  let query = supabase.from("Jobs").select("*").eq("property_id", property_id);

  if (tradie_id) {
    query = query.eq("tradie_id", tradie_id);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (expired !== null) {
    query = query.eq("expired", expired);
  }

  query = query.order("created_at", { ascending: false });

  if (last !== null && last >= 0) {
    query = query.limit(last);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching jobs:", error);
    throw new Error(error.message);
  }

  return data as Job[];
}

/**
 * Insert a list of assets associated with a given job into the JobAssets table.
 * @param jobId - The ID of the inserted job
 * @param assetIds - Array of asset IDs to associate with this job
 */
export async function insertJobAssetsTable(jobId: string, assetIds: string[]): Promise<JobAsset[] | null> {
  if (!jobId) throw new Error("Missing job ID for inserting JobAssets.");
  if (!assetIds || assetIds.length === 0) return null; // nothing to insert

  const rows = assetIds.map(asset_id => ({ job_id: jobId, asset_id }));

  const { data, error } = await supabase.from("JobAssets").insert(rows).select();

  if (error) throw new Error(`Failed to insert JobAssets: ${error.message}`);

  return data;
}

/**
 * Inserts a new job into the Jobs table.
 * @param job - Job object with required fields
 * @returns The inserted job with generated ID and PIN
 */
export async function insertJobsTable(job: Job): Promise<Job | null> {
  // Validate required fields
  if (!job.property_id) throw new Error(`Missing "property_id".`);
  if (!job.title) throw new Error(`Missing "title".`);
  if (job.expired === undefined || job.expired === null) throw new Error(`Missing "expired".`);

  // Insert job
  const { data, error } = await supabase.from("Jobs").insert([
    {
      property_id: job.property_id,
      title: job.title,
      status: JobStatus.PENDING, // Start off a job with PENDING status
      end_time: job.end_time ? new Date(job.end_time).toISOString() : oneHourFromNowISO(),
      expired: false, // Just created, cannot be expired
    } 
  ]).select(); // returns the inserted row

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  // Return the inserted job
  return data[0] as Job;
}

/**
 * Frontend-friendly function to create a job AND its associated assets.
 * @param job - Job data (title, property_id, end_time etc.)
 * @param assetIds - Array of selected asset IDs
 */
export async function insertJobsInfo(job: Job, assetIds: string[]): Promise<[Job, JobAsset[] | null]> {
  // 1. Insert job
  const insertedJob = await insertJobsTable(job);

  if (!insertedJob || !insertedJob.id) {
    throw new Error("Failed to insert job or job ID missing.");
  }

  // 2. Insert associated assets
  const assetsInserted = await insertJobAssetsTable(insertedJob.id, assetIds);

  // 3. Return the inserted job and assets
  return [insertedJob, assetsInserted];
}

/**
 * Fetches job assets for a specific job ID.
 * @param jobId - The job ID to fetch assets for
 * @returns Array of JobAsset objects
 */
export async function fetchJobAssets(jobId: string): Promise<JobAsset[]> {
  const { data, error } = await supabase
    .from("JobAssets")
    .select("*")
    .eq("job_id", jobId);

  if (error) {
    console.error("Error fetching job assets:", error);
    throw new Error(error.message);
  }

  return data ?? [];
}

/**
 * Deletes a job and all its associated assets.
 * Uses database CASCADE to automatically delete related JobAssets.
 * @param jobId - ID of the job to delete
 * @returns Boolean indicating success
 */
export async function deleteJob(jobId: string): Promise<boolean> {
  try {
    // Delete the job (JobAssets should be deleted automatically via CASCADE)
    const { error: jobError } = await supabase
      .from("Jobs")
      .delete()
      .eq("id", jobId);

    if (jobError) {
      console.error("Error deleting job:", jobError.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Unexpected error deleting job:", err);
    return false;
  }
}

/**
 * Updates a single job row.
 * Updates all fields except `id` and `created_at`.
 * @param job - Job object with updated data
 * @returns Updated job object
 */
export async function updateJobTable(job: Job): Promise<Job> {
  if (!job.id) throw new Error("Job ID is required for update.");

  const { data, error } = await supabase
    .from("Jobs")
    .update({
      tradie_id: job.tradie_id,
      title: job.title,
      status: job.status,
      end_time: job.end_time ? new Date(job.end_time).toISOString() : null,
      expired: job.expired,
      pin: job.pin,
    })
    .eq("id", job.id)
    .select();

  if (error) throw new Error(`Failed to update job: ${error.message}`);
  if (!data || data.length === 0) throw new Error("No job updated");

  return data[0] as Job;
}

/**
 * Updates the assets associated with a job by replacing all existing associations.
 * Uses UPSERT to avoid primary key conflicts.
 * @param jobId - ID of the job
 * @param assetIds - Array of asset IDs to associate
 * @returns Array of JobAsset rows
 */
export async function upsertJobAssets(jobId: string, assetIds: string[]): Promise<JobAsset[] | null> {
  if (!jobId) throw new Error("Job ID is required for upserting assets.");

  try {
    // First, let's try to delete existing assets for this job
    console.log(`Deleting existing assets for job_id: ${jobId}`);
    const { error: deleteError } = await supabase
      .from("JobAssets")
      .delete()
      .eq("job_id", jobId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      throw new Error(`Failed to delete old job assets: ${deleteError.message}`);
    }

    // If no new assets to insert, return null
    if (!assetIds || assetIds.length === 0) {
      console.log("No assets to insert, returning null");
      return null;
    }

    // Remove duplicates and prepare rows
    const uniqueAssetIds = [...new Set(assetIds)];
    console.log(`Inserting ${uniqueAssetIds.length} unique assets:`, uniqueAssetIds);
    
    const rows = uniqueAssetIds.map(asset_id => ({ 
      job_id: jobId, 
      asset_id: asset_id 
    }));

    // Use upsert to handle any potential conflicts
    const { data, error: upsertError } = await supabase
      .from("JobAssets")
      .upsert(rows, { 
        onConflict: 'job_id,asset_id',
        ignoreDuplicates: false 
      })
      .select();

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      throw new Error(`Failed to upsert job assets: ${upsertError.message}`);
    }

    console.log("Successfully upserted job assets:", data);
    return data || [];
    
  } catch (error) {
    console.error("Error in upsertJobAssets:", error);
    throw error;
  }
}

/**
 * Updates a job row and its associated assets in a single operation.
 * @param job - Job object with updated data
 * @param assetIds - Array of asset IDs to associate with this job
 * @returns Updated Job and JobAsset list
 */
export async function updateJobInfo(job: Job, assetIds: string[]): Promise<[Job, JobAsset[] | null]> {
  if (!job.id) throw new Error("Job ID is required for update.");

  // 1. Update the job row
  const updatedJob = await updateJobTable(job);

  // 2. Update associated assets
  const updatedAssets = await upsertJobAssets(updatedJob.id!, assetIds);

  return [updatedJob, updatedAssets];
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
  const { data, error } = await supabase
    .from("JobAssets")
    .select(`
      asset_id,
      job_id,
      Assets!inner(asset_id, type, description, space_id),
      Assets!inner.Spaces!inner(space_id, name)
    `)
    .eq("job_id", jobId);

  if (error) {
    console.error("Error fetching job assets with details:", error);
    throw new Error(error.message);
  }

  return data ?? [];
}