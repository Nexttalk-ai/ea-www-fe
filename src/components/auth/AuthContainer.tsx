import React from 'react';
import LoginForm from './LoginForm';
import AuthLayout from '@/layouts/AuthLayout';
import AuthSideSection from './AuthSideSection';

const AuthContainer: React.FC = () => {
    return (
        <AuthLayout 
            mainComponent={<LoginForm />} 
            sideComponent={
                <AuthSideSection>
                    <h1 className="text-3xl font-bold mb-4">Welcome to Login Page</h1>
                    <p className="text-lg opacity-90">Sign in to access your account</p>
                </AuthSideSection>
            } 
        />
    );
};

export default AuthContainer;