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
  id: string;
  property_id: string;
  tradie_id: string | null;
  title: string;
  status: JobStatus;
  created_at: string;
  end_time: string | null;
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
 * Gets all info about all the jobs for a property. 
 */
export async function fetchJobInfo({property_id, tradie_id = null, status = null, expired = null, last = null}: FetchJobInfoParams): Promise<Job[]> {
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
     * 
     * Outputs:
     *  - a JSON object with the structure:
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

  if (last !== null) {
    query = query.limit(last);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching jobs:", error);
    throw new Error(error.message);
  }

  return data as Job[];
}
