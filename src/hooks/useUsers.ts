import useSWR from 'swr';
import { fetcher } from '../utils/helpers/fetcher';
import { User } from '../services/userService';

import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl('/user');

export const useUsers = () => {
  const { data, error, isLoading, mutate } = useSWR(
    'users-list',
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
    users: data as User[],
    isLoading,
    isError: error,
    mutate
  };
}; 