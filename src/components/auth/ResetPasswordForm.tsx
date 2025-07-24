import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaLock, FaKey } from 'react-icons/fa';
import { confirmResetPassword } from '@aws-amplify/auth';
import AuthLayout from '../../layouts/AuthLayout';

const ResetPasswordForm: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = (location.state as any)?.email || '';

    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await confirmResetPassword({
                username: email,
                confirmationCode: code,
                newPassword: newPassword
            });
            navigate('/login', { 
                state: { 
                    message: 'Password has been reset successfully. Please login with your new password.' 
                } 
            });
        } catch (error) {
            console.error('Error resetting password:', error);
            setError(error instanceof Error ? error.message : 'An error occurred while resetting password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            mainComponent={
                <form onSubmit={handleSubmit} className="space-y-8 p-8">
                    <h2 className="text-4xl font-bold mb-4 text-center text-purple">Reset Password</h2>
                    
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
                            placeholder="Reset Code"
                            required
                            className="mt-1 block w-full rounded-md border border-dark-purple pl-8 px-3 py-2 shadow-sm focus:border-primary focus:outline-none"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaLock className="h-3 w-3 text-gray-400" />
                        </div>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New Password"
                            required
                            minLength={8}
                            className="mt-1 block w-full rounded-md border border-dark-purple pl-8 px-3 py-2 shadow-sm focus:border-primary focus:outline-none"
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-purple text-text-secondary py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            }
            sideComponent={
                <div className="text-center text-white">
                    <h1 className="text-3xl font-bold mb-4">Set New Password</h1>
                    <p className="text-lg opacity-90">
                        Enter the code sent to your email and your new password.
                    </p>
                </div>
            }
        />
    );
};

export default ResetPasswordForm; 