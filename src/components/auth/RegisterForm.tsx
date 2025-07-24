import React from 'react';

const RegisterForm: React.FC = () => {
  return (
    <form className="space-y-6 p-8">
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
          Activation Code
        </label>
        <input
          id="code"
          type="code"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-button-primary text-text-secondary py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors"
      >
        Create Account
      </button>
    </form>
  );
};

export default RegisterForm;