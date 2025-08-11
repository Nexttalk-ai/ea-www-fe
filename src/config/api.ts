export const API_CONFIG = {
    BASE_URL: 'https://6h25g2ltjj.execute-api.us-west-2.amazonaws.com/dev'
} as const;

export const getApiUrl = (endpoint: string): string => {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 