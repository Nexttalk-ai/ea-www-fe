import useSWR from 'swr';
import { fetcher } from '../utils/helpers/fetcher';

import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl('/user');

export const useUser = (userId: string) => {
  const { data, error, isLoading } = useSWR(
    userId ? `user-${userId}` : null,
    () => fetcher(`${API_BASE_URL}/get/${encodeURIComponent(userId)}`, {
      method: 'GET'
    }),
    { revalidateOnFocus: false }
  );

  return {
    user: data,
    isLoading,
    isError: error
  };
}; 