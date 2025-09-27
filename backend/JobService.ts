// src/services/JobService.ts
/// <reference types="vite/client" />
import supabase from "../config/supabaseClient";

// Possible job statuses
export enum JobStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REVOKED = "REVOKED",
  DELETED = "DELETED",
}

// Shape of a job record
export interface Job {
  id: string | null;       // May be null before insert
  property_id: string;
  tradie_id: string | null;// May be null at creation of Job
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

export async function fetchJobsInfo({ property_id, tradie_id = null, status = null, expired = null, last = null }: FetchJobInfoParams): Promise<Job | null> {
    /** Gets all info about all the jobs for a property. Call can be customized by giving information as below.
     * Inputs:
     *  - `property_id` : `string`
     *  - `tradie_id` : `string`
     *  - `status`: `enum(job_status)`
     *  - `expired`: `bool`
     *  - `last`: `int`
     * 
     * `property_id` is always required. `tradie_id`, `status`, `expired`, `last` can be null.
     * If only `property_id` is given, return all jobs in this property in history.
     * If `tradie_id` is given, return all jobs that this tradie has worked on for this property in history
     * If `status` is given, return all jobs for this property with a given `status`.
     * If `expired` is given, return all jobs for this property with the given `expired` value.
     * If `last` is given, return the given `last` number of jobs sorted in chornological order, newest jobs to oldest jobs.
     * If `last` is negative, return everything in history instead, the function treats the call as though `last` was not given.
     * 
     * Outputs:
     *  - a JSON object with the structure or null if it does not exist:
     *  {`id`: `string`,
     *  `property_id`: `string`,
     *  `tradie_id`: `string`,
     *  `title`: `string`,
     *  `status`: `enum(job_status)`,
     *  `created_at`: datetime,
     *  `end_time`: datetime,
     *  `expired`: `bool`,
     *  `pin`: `string`
     *  }
     */

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

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error fetching job:", error);
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return data as Job;
}


export async function insertJobAssetsTable() {
  /**
   * 
   */
}

export async function insertJobsTable(job: Job): Promise<Job | null> {
  /**
   * Inserts information into the Job table in the database.
   * Inputs:
   * - An object of Job type is unpacked and inserted to the table appropriately
   * - Includes:
   * - `property_id`: string,
   * - `title`: string,
   * - `end_time`: `string`
   * 
   * The function checks if all information that is required exists in the argument and returns an error otherwise.
   * Outputs:
   * - a JSON object with the structure or null if it does not exist:
   *  {`id`: `string`,
   *  `property_id`: `string`,
   *  `tradie_id`: `string`,
   *  `title`: `string`,
   *  `status`: `enum(job_status)`,
   *  `created_at`: datetime,
   *  `end_time`: datetime,
   *  `expired`: `bool`,
   *  `pin`: `string`
   *  }
   */

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
      end_time: job.end_time? new Date(job.end_time).toISOString() : oneHourFromNowISO(),
      expired: false, // Just created, cannot be expired
    } 
  ]).select(); // returns the inserted row

  if (error) throw new Error(error.message);
  if (!data) return null;

  // Return the inserted job
  return data[0] as Job;
}

function oneHourFromNowISO() {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

export async function insertJobsInfo() {
  /**
   * 
   */
}
