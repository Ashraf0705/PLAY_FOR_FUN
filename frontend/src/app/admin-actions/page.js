// frontend/src/app/admin-actions/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Not used here after moving login, but keep if needed
import { createSpace } from '@/services/apiService'; // Using alias
// adminLoginToSpace is no longer used here

export default function AdminActionsPage() {
  const router = useRouter(); // Keep if you add other actions that navigate

  const [spaceName, setSpaceName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState('');

  const handleCreateSpaceSubmit = async (e) => {
    e.preventDefault();
    setIsCreatingSpace(true);
    setCreateError(null);
    setCreateSuccess('');

    if (adminPassword !== confirmPassword) {
      setCreateError('Passwords do not match.');
      setIsCreatingSpace(false);
      return;
    }
    if (!spaceName || !adminPassword ) {
        setCreateError('Space Name and Admin Password are required.');
        setIsCreatingSpace(false);
        return;
    }

    try {
      const data = await createSpace(spaceName, adminPassword, confirmPassword);
      setCreateSuccess(`Space "${data.space_name}" created successfully! Your Join Code is: ${data.join_code}. Please save this code and your admin password securely.`);
      setSpaceName('');
      setAdminPassword('');
      setConfirmPassword('');
    } catch (err) {
      setCreateError(err.message || 'Failed to create space.');
    } finally {
      setIsCreatingSpace(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-150px)] py-12 px-4 space-y-12">
      <div className="w-full max-w-lg p-8 bg-gray-800 shadow-xl rounded-xl">
        <h2 className="text-3xl font-bold text-center text-indigo-400 mb-6">
          Create New Prediction Space
        </h2>
        <form onSubmit={handleCreateSpaceSubmit} className="space-y-6">
          <div>
            <label htmlFor="spaceName" className="block text-sm font-medium text-gray-300">Space Name</label>
            <input id="spaceName" type="text" value={spaceName} onChange={(e) => setSpaceName(e.target.value)} required className="input-field" placeholder="e.g., My Family Fun Zone" />
          </div>
          <div>
            <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-300">Admin Password</label>
            <input id="adminPassword" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required className="input-field" placeholder="Choose a strong password" />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">Confirm Admin Password</label>
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="input-field" placeholder="Re-enter password" />
          </div>
          {createError && <p className="form-error">{createError}</p>}
          {createSuccess && <p className="form-success">{createSuccess}</p>}
          <button type="submit" disabled={isCreatingSpace} className="form-button">
            {isCreatingSpace ? 'Creating Space...' : 'Create Space'}
          </button>
        </form>
        <p className="mt-8 text-sm text-center text-gray-500">
          Already have a space and need to manage it?{' '}
          <Link href="/admin-login" className="font-medium text-purple-400 hover:text-purple-300">
            Admin Login Here
          </Link>
        </p>
      </div>
       <p className="text-sm text-center text-gray-500">
            <Link href="/" className="font-medium text-indigo-400 hover:text-indigo-300">
                Back to Home
            </Link>
        </p>
    </div>
  );
}