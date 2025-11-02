/**
 * Shared React Query hooks for data fetching
 * This file contains reusable query hooks that can be used across components
 * to ensure data is cached and deduplicated automatically
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/wrappers';
import { ChangeLog, Property } from '@housebookgroup/shared-types';

// Raw API response type (snake_case from backend)
export interface ChangeLogApiResponse {
  changelog_id: string;
  changelog_description: string;
  changelog_created_at: string;
  changelog_status: string;
  changelog_specifications: Record<string, any>;
  property_id: string;
  asset_description?: string;
  user_first_name?: string;
  user_last_name?: string;
  user_email?: string;
}

// Extended ChangeLog with user information (camelCase for frontend)
export interface ChangeLogWithUser extends ChangeLog {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
}

// ==================== QUERY KEYS ====================
// Centralized query keys to ensure consistency across the app
export const queryKeys = {
  // Properties
  properties: ['properties'] as const,
  property: (id: string) => ['property', id] as const,
  propertyImages: (id: string) => ['property', id, 'images'] as const,
  propertyOwners: (id: string) => ['property', id, 'owners'] as const,
  propertyJobs: (id: string) => ['property', id, 'jobs'] as const,

  // Transfers
  transfers: ['transfers'] as const,
  transfer: (id: string) => ['transfer', id] as const,
  ownerTransfers: (ownerId: string) => ['transfers', 'owner', ownerId] as const,

  // Change logs
  changeLogs: ['changeLogs'] as const,
  propertyChangeLogs: (propertyId: string) => ['changeLogs', 'property', propertyId] as const,

  // Asset and Space types
  assetTypes: ['assetTypes'] as const,
  spaceTypes: ['spaceTypes'] as const,
};

// ==================== PROPERTY QUERIES ====================

/**
 * Fetch list of all properties
 * Used in: Dashboard, PropertyManagement, MyProperties
 * Note: This fetches ALL properties - backend should filter by user role/permissions
 */
export const useProperties = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.properties,
    queryFn: async () => {
      // Backend's getPropertyList requires userId but returns all relevant properties
      // If no userId provided, use empty string (backend will handle auth context)
      const response = await apiClient.getPropertyList(userId || '');
      return response;
    },
    enabled: !!userId, // Only run if userId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch a single property by ID
 * Used in: PropertyDetail
 */
export const useProperty = (propertyId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.property(propertyId || ''),
    queryFn: async () => {
      if (!propertyId) throw new Error('Property ID is required');
      const response = await apiClient.getPropertyDetails(propertyId);
      return response;
    },
    enabled: !!propertyId, // Only run query if propertyId exists
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch property images
 * Used in: PropertyDetail
 */
export const usePropertyImages = (propertyId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.propertyImages(propertyId || ''),
    queryFn: async () => {
      if (!propertyId) throw new Error('Property ID is required');
      const response = await apiClient.getPropertyImages(propertyId);
      return response;
    },
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000, // Images don't change often, cache for 10 minutes
  });
};

/**
 * Fetch property owners
 * Used in: PropertyDetail, OldOwnerTransferDialog
 */
export const usePropertyOwners = (propertyId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.propertyOwners(propertyId || ''),
    queryFn: async () => {
      if (!propertyId) throw new Error('Property ID is required');
      const response = await apiClient.getPropertyOwners(propertyId);
      return response;
    },
    enabled: !!propertyId,
    staleTime: 3 * 60 * 1000, // Owners might change, shorter cache
  });
};

// ==================== TRANSFER QUERIES ====================

/**
 * Fetch all transfers for an owner/user
 * Used in: MyProperties, OwnerRequests
 */
export const useOwnerTransfers = (userId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.ownerTransfers(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      // Use the existing getTransfersByUser method which returns all transfers for a user
      const result = await apiClient.getTransfersByUser(userId);

      return result; // Returns { transfers: [...] }
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // Transfers are time-sensitive, cache for 1 minute
  });
};

// ==================== CHANGE LOG QUERIES ====================

/**
 * Fetch all change logs (for admin dashboard and owner dashboard)
 * Used in: Dashboard, OwnerDashboard
 * Normalizes snake_case API response to camelCase for consistency
 */
export const useChangeLogs = (propertyIds: string[]) => {
  return useQuery<ChangeLogWithUser[]>({
    queryKey: queryKeys.changeLogs,
    queryFn: async (): Promise<ChangeLogWithUser[]> => {
      if (!propertyIds || propertyIds.length === 0) {
        return []; // Return empty array if no properties
      }
      const response: ChangeLogApiResponse[] = await apiClient.getChangeLogs(propertyIds);

      // Normalize snake_case API response to camelCase
      return (response ?? []).map((c: ChangeLogApiResponse): ChangeLogWithUser => ({
        id: c.changelog_id,
        assetId: c.property_id, // Using property_id as assetId placeholder
        changeDescription: c.changelog_description,
        created_at: c.changelog_created_at,
        status: c.changelog_status as any, // Status comes as string from API
        actions: 'UPDATED' as any, // Default action
        deleted: false,
        // backend returns a plain object; shared types expect JSON — cast safely
        specifications: (c.changelog_specifications ?? {}) as unknown as JSON,
        propertyId: c.property_id,
        assetName: c.asset_description,
        changedByUserId: undefined,
        userFirstName: c.user_first_name || 'Unknown',
        userLastName: c.user_last_name || 'Unknown',
        userEmail: c.user_email || '',
      }));
    },
    enabled: !!propertyIds && propertyIds.length > 0,
    staleTime: 2 * 60 * 1000, // Change logs update frequently
  });
};

// ==================== ASSET/SPACE TYPE QUERIES ====================

/**
 * Fetch asset types
 * Used in: PropertyDetail
 */
export const useAssetTypes = () => {
  return useQuery({
    queryKey: queryKeys.assetTypes,
    queryFn: async () => {
      // Import from backend service since it's not in apiClient
  const { getAssetTypes } = await import('@backend/PropertyEditService');
      const response = await getAssetTypes();
      return response;
    },
    staleTime: 30 * 60 * 1000, // Asset types rarely change, cache for 30 minutes
  });
};

/**
 * Fetch space types
 * Used in: PropertyDetail
 */
export const useSpaceTypes = () => {
  return useQuery({
    queryKey: queryKeys.spaceTypes,
    queryFn: async () => {
      // Import dynamically to avoid circular dependencies
  const { fetchSpaceEnum } = await import('@backend/FetchSpaceEnum');
      const response = await fetchSpaceEnum();
      return response || [];
    },
    staleTime: 30 * 60 * 1000, // Space types rarely change
  });
};

// ==================== JOBS QUERIES ====================

/**
 * Fetch jobs for a property
 * Used in: PropertyDetail, PinTable
 */
export const usePropertyJobs = (propertyId: string | undefined) => {
  return useQuery({
    queryKey: ['jobs', propertyId],
    queryFn: async () => {
      if (!propertyId) throw new Error('Property ID is required');
  const { fetchJobsInfo } = await import('@backend/JobService');
      const [jobs, jobAssets] = await fetchJobsInfo({ propertyId });
      return { jobs, jobAssets };
    },
    enabled: !!propertyId,
    staleTime: 2 * 60 * 1000, // Jobs change frequently, 2 minute cache
  });
};

// ==================== ADMIN QUERIES ====================

/**
 * Fetch admin properties (all properties for admin dashboard)
 * Used in: Dashboard (Admin), AdminRequests
 */
export const useAdminProperties = (userId: string | undefined, userType: string) => {
  return useQuery({
    queryKey: ['adminProperties', userId, userType],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const properties = await apiClient.getAdminProperties(userId, userType);

      // Remove duplicate properties by propertyId
      const uniquePropertiesMap = new Map();
      properties?.forEach((p: any) => {
        if (!uniquePropertiesMap.has(p.propertyId)) {
          uniquePropertiesMap.set(p.propertyId, p);
        }
      });

      return Array.from(uniquePropertiesMap.values());
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Fetch all owners (for admin user management)
 * Used in: Dashboard (Admin)
 */
export const useAllOwners = () => {
  return useQuery({
    queryKey: ['allOwners'],
    queryFn: async () => {
      return await apiClient.getAllOwners();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ==================== MUTATIONS ====================

/**
 * Mutation hook for approving a changelog/edit request
 * Also updates the Asset's current_specifications with the changelog specifications
 */
export const useApproveEdit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changelogId: string) => {
      const { supabase } = await import('@config/supabaseClient');

      // First, get the changelog to retrieve asset_id and specifications
      const { data: changelog, error: fetchError } = await supabase
        .from("ChangeLog")
        .select("asset_id, specifications")
        .eq("id", changelogId)
        .single();

      if (fetchError) throw fetchError;
      if (!changelog) throw new Error("Changelog not found");

      // Update the Asset's current_specifications with the changelog specifications
      const { error: assetError } = await supabase
        .from("Assets")
        .update({ current_specifications: changelog.specifications })
        .eq("id", changelog.asset_id);

      if (assetError) throw assetError;

      // Update the ChangeLog status to ACCEPTED
      const { data, error } = await supabase
        .from("ChangeLog")
        .update({ status: "ACCEPTED" })
        .eq("id", changelogId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate changelogs to refetch updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.changeLogs });
      // Also invalidate properties to refresh the asset data
      queryClient.invalidateQueries({ queryKey: queryKeys.properties });
    },
  });
};

/**
 * Mutation hook for rejecting a changelog/edit request
 */
export const useRejectEdit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changelogId: string) => {
  const { supabase } = await import('@config/supabaseClient');
      const { data, error } = await supabase
        .from("ChangeLog")
        .update({ status: "DECLINED" })
        .eq("id", changelogId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate changelogs to refetch updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.changeLogs });
    },
  });
};

/**
 * Mutation hook for approving a transfer
 * Automatically invalidates related queries on success
 */
export const useApproveTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transferId, ownerId }: { transferId: string; ownerId: string }) => {
      return await apiClient.approveTransfer(transferId, ownerId );   // this somehow works?? should be a string, but somehow passed as {ownerId: string}
    },
    onSuccess: (_, variables) => {
      // Invalidate transfers to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      // Also invalidate properties as ownership might have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.properties });
    },
  });
};

/**
 * Mutation hook for rejecting a transfer
 */
export const useRejectTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transferId, ownerId }: { transferId: string; ownerId: string }) => {
      return await apiClient.rejectTransfer(transferId, ownerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
};

/**
 * Mutation hook for deleting a job
 */
export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
  const { deleteJob } = await import('@backend/JobService');
      return await deleteJob(jobId);
    },
    onSuccess: () => {
      // Invalidate all job queries
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

/**
 * Mutation hook for creating/updating a job
 */
export const useSaveJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ job, assetIds, isEdit }: { job: any; assetIds: string[]; isEdit: boolean }) => {
  const { insertJobsInfo, updateJobInfo } = await import('@backend/JobService');
      if (isEdit && job.id) {
        return await updateJobInfo(job, assetIds);
      } else {
        return await insertJobsInfo(job, assetIds);
      }
    },
    onSuccess: () => {
      // Invalidate all job queries
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};
