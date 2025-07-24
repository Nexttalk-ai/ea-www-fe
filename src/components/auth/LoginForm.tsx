import React, { useState } from 'react';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { getCurrentUser } from '@aws-amplify/auth';
import authService from '../../services/auth.service';
import Logo from '../ui/Logo';

type Inputs = {
  email: string;
  password: string;
};

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.signIn(data.email, data.password);
      
      if (result.requiresNewPassword) {
        navigate('/new-password', { replace: true });
        return;
      }

      // Check if email is verified
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is confirmed
      if (!user.signInDetails?.loginId) {
        navigate('/verify-email', { 
          state: { email: data.email },
          replace: true 
        });
        return;
      }
      
      // Always redirect to /users after successful login
      navigate('/users', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className="absolute top-4 left-4">
      <Logo imageSrc="/images/NextTalkLogo.png"
            size={80}
            className="flex shrink-0"
      />
    </div>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-8">
      <h2 className="text-4xl font-bold mb-4 text-center text-purple">Sign in to Next Talk</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaEnvelope className="h-3 w-3 text-gray-400" />
          </div>
          <input
            {...register("email", { required: "Email is required" })}
            id="email"
            type="email"
            placeholder="Email"
            className="mt-1 block w-full rounded-md border border-dark-purple pl-8 px-3 py-2 shadow-sm focus:border-primary focus:outline-none"
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaLock className="h-3 w-3 text-gray-400" />
          </div>
          <input
            {...register("password", { required: "Password is required" })}
            id="password"
            type="password"
            placeholder="Password"
            className="mt-1 block w-full rounded-md border border-dark-purple pl-8 px-3 py-2 shadow-sm focus:border-primary focus:outline-none"
            disabled={isLoading}
          />
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="flex justify-center">
        <Link to="/forgot-password" className="text-purple text-center mt-0">Forgot password?</Link>
      </div>

      <button
        type="submit"
        className="w-full bg-purple text-text-secondary py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
    </>
  );
};

export default LoginForm;