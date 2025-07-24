import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import { resetPassword } from '@aws-amplify/auth';
import AuthLayout from '../../layouts/AuthLayout';

const ForgotPasswordForm: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await resetPassword({ username: email });
            console.log('Password reset code sent to:', email);
            setSuccess(true);
            // Redirect to reset password confirmation page after a short delay
            setTimeout(() => {
                navigate('/reset-password', { state: { email } });
            }, 2000);
        } catch (error) {
            console.error('Error requesting password reset:', error);
            setError(error instanceof Error ? error.message : 'An error occurred while requesting password reset');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            mainComponent={
                <form onSubmit={handleSubmit} className="space-y-8 p-8">
                    <h2 className="text-4xl font-bold mb-4 text-center text-purple">Forgot Password</h2>
                    
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">
                                Password reset code has been sent to your email. Redirecting...
                            </span>
                        </div>
                    )}

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaEnvelope className="h-3 w-3 text-gray-400" />
                        </div>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                            className="mt-1 block w-full rounded-md border border-dark-purple pl-8 px-3 py-2 shadow-sm focus:border-primary focus:outline-none"
                            disabled={isLoading || success}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-purple text-text-secondary py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || success}
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                </form>
            }
            sideComponent={
                <div className="text-center text-white">
                    <h1 className="text-3xl font-bold mb-4">Reset Your Password</h1>
                    <p className="text-lg opacity-90">
                        Enter your email address and we'll send you a code to reset your password.
                    </p>
                </div>
            }
        />
    );
};

export default ForgotPasswordForm;