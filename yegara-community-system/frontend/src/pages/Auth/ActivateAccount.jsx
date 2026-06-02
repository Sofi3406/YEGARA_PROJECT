import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ActivateAccount = () => {
  const { activateAccount, token } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    const storedToken = token || localStorage.getItem('token');
    if (!storedToken) {
      navigate('/login');
    }
  }, [token, navigate]);

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      return;
    }
    setIsSubmitting(true);
    try {
      await activateAccount(data.newPassword);
      navigate('/profile/edit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900">Activate your account</h1>
        <p className="text-gray-600 mt-2">Set a permanent password to complete activation.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">New password</label>
            <input
              type="password"
              className="input mt-1"
              {...register('newPassword', { required: 'New password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
            />
            {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm password</label>
            <input
              type="password"
              className="input mt-1"
              {...register('confirmPassword', { required: 'Confirm password is required' })}
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-gradient-to-r from-amber-600 to-orange-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-amber-500 hover:to-orange-600 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Activating...' : 'Activate account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActivateAccount;
