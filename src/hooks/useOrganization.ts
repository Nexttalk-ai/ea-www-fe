import useSWR from 'swr';
import { fetcher } from '../utils/helpers/fetcher';
import { Organization } from '../services/organizationService';

const API_BASE_URL = 'https://282x80mwdj.execute-api.us-west-2.amazonaws.com/dev/organization';

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