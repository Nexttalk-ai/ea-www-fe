import useSWR from 'swr';
import { fetcher } from '../utils/helpers/fetcher';
import { Organization } from '../services/organizationService';

import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl('/organization');

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