export const API_CONFIG = {
    BASE_URL: 'https://ydou4bld0c.execute-api.us-west-2.amazonaws.com/prod'
} as const;

export const getApiUrl = (endpoint: string): string => {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 