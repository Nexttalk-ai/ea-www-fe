import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Button from './components/ui/Button';
import Test from './pages/test';
import AuthPage from './pages/AuthPage';
import UsersPage from './pages/UsersPage';
import UserDetails from './pages/UserDetails';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import NewPasswordForm from './components/auth/NewPasswordForm';
import ResetPasswordForm from './components/auth/ResetPasswordForm';
import VerifyEmailForm from './components/auth/VerifyEmailForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RulesPage from './pages/RulesPage';
import RulePage from './pages/RulePage';
import AddRule from './pages/AddRule';
import EditRule from './pages/EditRule';
import OrganizationsPage from './pages/OrganizationsPage';
import OrganizationDetails from './pages/OrganizationDetails';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordForm />} />
      <Route path="/new-password" element={<NewPasswordForm />} />
      <Route path="/reset-password" element={<ResetPasswordForm />} />
      <Route path="/verify-email" element={<VerifyEmailForm />} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><div>Home Page <Button>Click me</Button></div></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/users/:id" element={<ProtectedRoute><UserDetails /></ProtectedRoute>} />
      <Route path="/organizations/:org_id/user/:id" element={<ProtectedRoute><UserDetails /></ProtectedRoute>} />
      <Route path="/rules" element={<ProtectedRoute><RulesPage /></ProtectedRoute>} />
      <Route path="/rules/add-rule" element={<ProtectedRoute><AddRule /></ProtectedRoute>} />
      <Route path="/rules/edit/:id" element={<ProtectedRoute><EditRule /></ProtectedRoute>} />
      <Route path="/rules/:id" element={<ProtectedRoute><RulePage /></ProtectedRoute>} />
      <Route path="/organizations" element={<ProtectedRoute><OrganizationsPage /></ProtectedRoute>} />
      <Route path="/organizations/:id" element={<ProtectedRoute><OrganizationDetails /></ProtectedRoute>} />
      <Route path="/test" element={<ProtectedRoute><Test /></ProtectedRoute>} />
    </Routes>
  );
};

export default App;
