import { 
    signIn, 
    signOut, 
    fetchAuthSession, 
    getCurrentUser,
    type AuthSession,
    confirmSignIn
} from '@aws-amplify/auth';

interface SignInResponse {
    isSignedIn: boolean;
    session: AuthSession | null;
    requiresNewPassword?: boolean;
}

interface TokenData {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    expiresIn: number;
}

class AuthService {
    private static instance: AuthService;
    private tokenExpiryTimer: NodeJS.Timeout | null = null;
    private inactivityTimer: NodeJS.Timeout | null = null;
    private readonly TOKEN_KEY = 'auth_tokens';
    private readonly INACTIVITY_TIMEOUT = 3600000; // 1 hour in milliseconds

    private constructor() {
        this.setupInactivityListener();
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    private setupInactivityListener() {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, this.resetInactivityTimer.bind(this));
        });
    }

    private resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        this.inactivityTimer = setTimeout(() => {
            this.handleInactivity();
        }, this.INACTIVITY_TIMEOUT);
    }

    private handleInactivity() {
        this.signOut();
        window.location.href = '/login';
    }

    public async signIn(email: string, password: string): Promise<SignInResponse> {
        try {
            // Clear both storages before sign in attempt
            localStorage.clear();
            sessionStorage.clear();

            // First check if user is already authenticated
            const isAlreadyAuthenticated = await this.isAuthenticated();
            console.log('isAlreadyAuthenticated', isAlreadyAuthenticated);
            if (isAlreadyAuthenticated) {
                // User is already signed in, handle accordingly
                return { isSignedIn: true, session: await fetchAuthSession() };
            }

            // If not authenticated, proceed with sign in
            const { isSignedIn, nextStep } = await signIn({ username: email, password });
            
            if (nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
                return { 
                    isSignedIn: false, 
                    session: null,
                    requiresNewPassword: true 
                };
            }

            if (!isSignedIn) {
                return { isSignedIn: false, session: null };
            }

            const user = await getCurrentUser();
            if (!user) {
                return { isSignedIn: false, session: null };
            }

            const session = await fetchAuthSession();
            if (!session?.tokens) {
                return { isSignedIn: false, session: null };
            }

            this.storeTokens(session);
            this.setupTokenRefresh(session);

            console.log('session', session);
            return { isSignedIn: true, session };
        } catch (error) {
            console.error('Error signing in:', error);
            throw this.handleAuthError(error);
        }
    }

    public async signOut(): Promise<void> {
        try {
            await signOut();
            this.clearTokens();
            this.clearTimers();
            // Clear any other auth-related data
            sessionStorage.clear();
        } catch (error) {
            console.error('Error signing out:', error);
            // Even if there's an error, clear local data
            this.clearTokens();
            this.clearTimers();
            sessionStorage.clear();
        }
    }

    private storeTokens(session: AuthSession): void {
        if (!session?.tokens) {
            console.error('No tokens found in session');
            return;
        }

        const { accessToken, idToken } = session.tokens;
        if (!accessToken || !idToken) {
            console.error('Missing required tokens');
            return;
        }

        const tokenData: TokenData = {
            accessToken: accessToken.toString(),
            idToken: idToken.toString(),
            refreshToken: '', // Refresh token not available in v6 by default
            expiresIn: accessToken.payload.exp || 0,
        };
        sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));
        sessionStorage.setItem("ID_TOKEN", idToken.toString());
    }

    private clearTokens(): void {
        sessionStorage.removeItem(this.TOKEN_KEY);
    }

    private setupTokenRefresh(session: AuthSession): void {
        if (!session?.tokens?.accessToken?.payload?.exp) {
            console.error('Invalid session for token refresh');
            return;
        }

        const expiresIn = session.tokens.accessToken.payload.exp;
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = (expiresIn - now) * 1000;

        if (this.tokenExpiryTimer) {
            clearTimeout(this.tokenExpiryTimer);
        }

        this.tokenExpiryTimer = setTimeout(async () => {
            try {
                const newSession = await fetchAuthSession();
                if (newSession?.tokens) {
                    this.storeTokens(newSession);
                    this.setupTokenRefresh(newSession);
                }
            } catch (error) {
                console.error('Error refreshing token:', error);
                this.signOut();
            }
        }, timeUntilExpiry - 60000); // Refresh 1 minute before expiry
    }

    private clearTimers(): void {
        if (this.tokenExpiryTimer) {
            clearTimeout(this.tokenExpiryTimer);
            this.tokenExpiryTimer = null;
        }
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }

    public async isAuthenticated(): Promise<boolean> {
        try {
            // Check if we have tokens in session storage
            const tokenData = sessionStorage.getItem(this.TOKEN_KEY);
            if (!tokenData) {
                return false;
            }

            // Try to get current user from Cognito
            const user = await getCurrentUser();
            if (!user) {
                this.clearTokens();
                return false;
            }

            // Verify session is still valid
            const session = await fetchAuthSession();
            if (!session?.tokens) {
                this.clearTokens();
                return false;
            }

            return true;
        } catch {
            this.clearTokens();
            return false;
        }
    }

    private handleAuthError(error: any): Error {
        console.error('Authentication error:', error);
        if (error.name === 'UserNotConfirmedException') {
            return new Error('Please confirm your email address');
        } else if (error.name === 'NotAuthorizedException') {
            return new Error('Incorrect username or password');
        } else if (error.name === 'UserNotFoundException') {
            return new Error('User not found');
        }
        return new Error('An error occurred during authentication');
    }

    public async setNewPassword(newPassword: string): Promise<void> {
        try {
            // Clear both storages before password change
            localStorage.clear();
            sessionStorage.clear();

            const { isSignedIn } = await confirmSignIn({ challengeResponse: newPassword });
            
            if (!isSignedIn) {
                throw new Error('Failed to sign in after password change');
            }

            const session = await fetchAuthSession();
            if (!session?.tokens) {
                throw new Error('No session tokens after password change');
            }

            this.storeTokens(session);
            this.setupTokenRefresh(session);
        } catch (error) {
            console.error('Error setting new password:', error);
            throw error;
        }
    }
}

export default AuthService.getInstance(); 