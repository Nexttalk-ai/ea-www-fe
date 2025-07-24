import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaKey } from 'react-icons/fa';
import { confirmSignUp } from '@aws-amplify/auth';
import AuthLayout from '../../layouts/AuthLayout';

const VerifyEmailForm: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = (location.state as any)?.email || '';

    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await confirmSignUp({
                username: email,
                confirmationCode: code
            });
            navigate('/login', { 
                state: { 
                    message: 'Email verified successfully. Please login with your credentials.' 
                } 
            });
        } catch (error) {
            console.error('Error verifying email:', error);
            setError(error instanceof Error ? error.message : 'An error occurred while verifying email');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            mainComponent={
                <form onSubmit={handleSubmit} className="space-y-8 p-8">
                    <h2 className="text-4xl font-bold mb-4 text-center text-purple">Verify Email</h2>
                    
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaKey className="h-3 w-3 text-gray-400" />
                        </div>
                        <input
                            id="code"
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Verification Code"
                            required
                            className="mt-1 block w-full rounded-md border border-dark-purple pl-8 px-3 py-2 shadow-sm focus:border-primary focus:outline-none"
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-purple text-text-secondary py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>
            }
            sideComponent={
                <div className="text-center text-white">
                    <h1 className="text-3xl font-bold mb-4">Verify Your Email</h1>
                    <p className="text-lg opacity-90">
                        Enter the verification code sent to your email address.
                    </p>
                </div>
            }
        />
    );
};

export default VerifyEmailForm; 