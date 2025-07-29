import useSWR from 'swr';
import { fetcher } from '../utils/helpers/fetcher';

import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl('');

export const useUser = (userId: string) => {
  const { data, error, isLoading } = useSWR(
    userId ? `user-${userId}` : null,
    () => fetcher(`${API_BASE_URL}/user/get?id=${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'get', data: { id: userId } })
    }),
    { revalidateOnFocus: false }
  );

  return {
    user: data,
    isLoading,
    isError: error
  };
}; 