import useSWR from 'swr';
import { fetcher } from '../utils/helpers/fetcher';
import { User } from '../services/userService';

const API_BASE_URL = 'https://282x80mwdj.execute-api.us-west-2.amazonaws.com/dev/user';

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