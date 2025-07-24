import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import AuthLayout from '../../layouts/AuthLayout';
import { FaLock } from 'react-icons/fa';
import authService from '../../services/auth.service';

type Inputs = {
  newPassword: string;
  confirmPassword: string;
};

const NewPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<Inputs>({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (data.newPassword !== data.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      await authService.setNewPassword(data.newPassword);
      navigate('/users', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set new password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      mainComponent={
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-8">
          <h2 className="text-4xl font-bold mb-4 text-center text-purple">Set New Password</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-3 w-3 text-gray-400" />
              </div>
              <input
                {...register("newPassword", { 
                  required: "New password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters"
                  }
                })}
                id="newPassword"
                type="password"
                placeholder="New Password"
                className="mt-1 block w-full rounded-md border border-dark-purple pl-8 px-3 py-2 shadow-sm focus:border-primary focus:outline-none"
                disabled={isLoading}
              />
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-3 w-3 text-gray-400" />
              </div>
              <input
                {...register("confirmPassword", { 
                  required: "Please confirm your password",
                  validate: value => value === newPassword || "Passwords do not match"
                })}
                id="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                className="mt-1 block w-full rounded-md border border-dark-purple pl-8 px-3 py-2 shadow-sm focus:border-primary focus:outline-none"
                disabled={isLoading}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple hover:bg-dark-purple focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isLoading ? 'Setting Password...' : 'Set New Password'}
          </button>
        </form>
      }
      sideComponent
    />
  );
};

export default NewPasswordForm;