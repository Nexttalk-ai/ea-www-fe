export const API_CONFIG = {
    BASE_URL: 'https://0b92iy3w84.execute-api.us-west-2.amazonaws.com/dev'
} as const;

export const getApiUrl = (endpoint: string): string => {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 