import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from '@aws-amplify/auth/cognito';

// Validate required environment variables
const requiredEnvVars = {
    VITE_AWS_REGION: import.meta.env.VITE_AWS_REGION,
    VITE_AWS_USER_POOL_ID: import.meta.env.VITE_AWS_USER_POOL_ID,
    VITE_AWS_USER_POOL_WEB_CLIENT_ID: import.meta.env.VITE_AWS_USER_POOL_WEB_CLIENT_ID,
};

// Check if all required variables are present
Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
});

// Create a storage interface that wraps sessionStorage
const sessionStorageProvider = {
    async setItem(key: string, value: string) {
        sessionStorage.setItem(key, value);
    },
    async getItem(key: string) {
        return sessionStorage.getItem(key);
    },
    async removeItem(key: string) {
        sessionStorage.removeItem(key);
    },
    async clear() {
        sessionStorage.clear();
    }
};

// Configure token provider to use sessionStorage
cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorageProvider);

const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID,
            userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_WEB_CLIENT_ID,
            region: import.meta.env.VITE_AWS_REGION,
        },
        authenticationFlowType: 'USER_PASSWORD_AUTH',
    }
};

// Initialize Amplify
Amplify.configure(awsConfig);

console.log('AWS Amplify configured successfully');

export default awsConfig; 