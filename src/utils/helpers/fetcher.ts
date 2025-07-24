const getAuthHeaders = () => {
  const token = sessionStorage.getItem('ID_TOKEN');
  if (!token) {
    throw new Error('Authentication token not found. Please log in again.');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const fetcher = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    headers: getAuthHeaders(),
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};