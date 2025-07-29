import useSWR from 'swr';
import { fetcher } from '../utils/helpers/fetcher';
import { Organization } from '../services/organizationService';

import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl('/organization');

export const useOrganization = (organizationId: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? `organization-${organizationId}` : null,
    () => fetcher(`${API_BASE_URL}/get`, {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'get', 
        data: { id: organizationId } 
      })
    }),
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: true
    }
  );

  return {
    organization: data as Organization,
    isLoading,
    isError: error,
    mutate
  };
}; 