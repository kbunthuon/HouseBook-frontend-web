// backend/JobService.ts
/// <reference types="vite/client" />
import supabase from "../config/supabaseClient";

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
  const allJobs = await fetchJobsTable({ propertyId, expired, last });

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
 * @param expired - (Optional) Filter by expired flag.
 * @param last - (Optional) Limit the number of jobs returned (most recent first).
 * @returns A list of jobs matching the filters, ordered by creation time (newest first).
 */
export async function fetchJobsTable({ propertyId, expired = null, last = null }: FetchJobInfoParams): Promise<Job[]> {
  console.log("Fetching jobs with params:", { propertyId, expired, last });
  let query = supabase.from("Jobs").select("*").eq("property_id", propertyId);

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

  const jobs = (data ?? []).map((j: any) => ({
    id: j.id,
    propertyId: j.property_id,
    title: j.title,
    createdAt: j.created_at,
    endTime: j.end_time,
    expired: j.expired,
    pin: j.pin,
  }));

  return jobs;
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
  if (!job.propertyId) throw new Error(`Missing "propertyId".`);
  if (!job.title) throw new Error(`Missing "title".`);
  // if (job.expired === undefined || job.expired === null) throw new Error(`Missing "expired".`);

  // Insert job
  const { data, error } = await supabase.from("Jobs").insert([
    {
      property_id: job.propertyId,
      title: job.title,
      end_time: job.endTime ? new Date(job.endTime).toISOString() : oneHourFromNowISO(),
      // expired: false, // Just created, cannot be expired
    } 
  ]).select(); // returns the inserted row

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  // Return the inserted job
  return data[0] as Job;
}

/**
 * Frontend-friendly function to create a job AND its associated assets.
 * @param job - Job data (title, propertyId, endTime etc.)
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
      title: job.title,
      end_time: job.endTime ? new Date(job.endTime).toISOString() : null,
      pin: job.pin,
    })
    .eq("id", job.id)
    .select();

  if (error) throw new Error(`Failed to update job: ${error.message}`);
  if (!data || data.length === 0) throw new Error("No job updated");

  // Map database response (snake_case) to Job interface (camelCase)
  const updatedJob: Job = {
    id: data[0].id,
    propertyId: data[0].property_id,
    title: data[0].title,
    createdAt: data[0].created_at,
    endTime: data[0].end_time,
    expired: data[0].expired,
    pin: data[0].pin,
  };

  return updatedJob;
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