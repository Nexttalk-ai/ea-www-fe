import useSWR from 'swr';
import { getCurrentUser } from '@aws-amplify/auth';

export const useCurrentUser = () => {
  const { data, error, isLoading } = useSWR(
    'currentUser',
    async () => {
      const user = await getCurrentUser();
      return user?.userId;
    },
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  return {
    userId: data,
    isLoading,
    isError: error
  };
}; 