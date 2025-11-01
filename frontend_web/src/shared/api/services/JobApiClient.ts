import { BaseApiClient } from "./ApiClient";
import { API_ROUTES } from "../routes";

export class JobApiClient extends BaseApiClient {
 // Jobs Methods
  /**
   * Fetch jobs for a property
   */
  async fetchJobs(propertyId: string, expired?: boolean | null, last?: number | null) {
    const response = await this.authenticatedRequest(
      API_ROUTES.JOBS.FETCH_JOBS(propertyId, expired, last)
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch jobs");
    }

    const data = await response.json();
    return { jobs: data.jobs, jobAssets: data.jobAssets };
  }

  /**
   * Fetch job assets with optional details
   */
  async fetchJobAssets(jobId: string, withDetails?: boolean) {
    const response = await this.authenticatedRequest(
      API_ROUTES.JOBS.FETCH_JOB_ASSETS(jobId, withDetails)
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch job assets");
    }

    const data = await response.json();
    return data.assets;
  }

  /**
   * Create a new job with associated assets
   */
  async createJob(job: { propertyId: string; title: string; endTime?: string | null }, assetIds: string[]) {
    const response = await this.authenticatedRequest(
      API_ROUTES.JOBS.CREATE_JOB,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job, assetIds }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create job");
    }

    const data = await response.json();
    return { job: data.job, assets: data.assets };
  }

  /**
   * Update an existing job and its assets
   */
  async updateJob(job: { id: string; title: string; endTime?: string | null; pin?: string }, assetIds: string[]) {
    const response = await this.authenticatedRequest(
      API_ROUTES.JOBS.UPDATE_JOB,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job, assetIds }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update job");
    }

    const data = await response.json();
    return { job: data.job, assets: data.assets };
  }

  /**
   * Delete a job by ID
   */
  async deleteJob(jobId: string) {
    const response = await this.authenticatedRequest(
      API_ROUTES.JOBS.DELETE_JOB,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete job");
    }

    const data = await response.json();
    return data;
  }
}