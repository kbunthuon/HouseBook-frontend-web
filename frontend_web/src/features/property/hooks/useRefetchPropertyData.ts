import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@hooks/useQueries';

export function useRefetchPropertyData(propertyId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.property(propertyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.propertyImages(propertyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.propertyOwners(propertyId) });
    queryClient.invalidateQueries({ queryKey: ['jobs', propertyId] });
  };
}
