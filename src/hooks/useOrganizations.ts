import useSWR from 'swr';
import { fetcher } from '../utils/helpers/fetcher';
import { Organization } from '../services/organizationService';

const API_BASE_URL = 'https://282x80mwdj.execute-api.us-west-2.amazonaws.com/dev/organization';

export const useOrganizations = () => {
  const { data, error, isLoading, mutate } = useSWR(
    'organizations-list',
    () => fetcher(`${API_BASE_URL}/list`, {
      method: 'POST',
      body: JSON.stringify({ action: 'list' })
    }),
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: true
    }
  );

  return {
    organizations: data as Organization[],
    isLoading,
    isError: error,
    mutate
  };
}; 