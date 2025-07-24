/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_AWS_REGION: "us-west-2"
    readonly VITE_AWS_USER_POOL_ID: "us-west-2_ohdv5pnFA"
    readonly VITE_AWS_USER_POOL_WEB_CLIENT_ID: "2ftjt6rbtj4ld3d8oscgtra38"
    readonly VITE_APP_TOKEN_EXPIRY: "3600"
    readonly VITE_APP_REFRESH_TOKEN_EXPIRY: "86400"
}

interface ImportMeta {
    readonly env: ImportMetaEnv
} 