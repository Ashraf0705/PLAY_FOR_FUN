// frontend/src/app/admin-login/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminLoginToSpace } from '@/services/apiService'; // Using alias
import { useAuth } from '@/contexts/AuthContext';     // Using alias

export default function AdminLoginPage() {
  const [joinCodeLogin, setJoinCodeLogin] = useState('');
  const [adminPasswordLogin, setAdminPasswordLogin] = useState('');
  const [isLoggingInAdmin, setIsLoggingInAdmin] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [loginSuccess, setLoginSuccess] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingInAdmin(true);
    setLoginError(null);
    setLoginSuccess('');

    if (!joinCodeLogin || !adminPasswordLogin) {
        setLoginError('Both Join Code and Admin Password are required.');
        setIsLoggingInAdmin(false);
        return;
    }

    try {
      const adminData = await adminLoginToSpace(joinCodeLogin, adminPasswordLogin);
      login(adminData);
      setLoginSuccess(adminData.message || 'Admin login successful! Redirecting...');
      console.log('Admin login successful:', adminData);
      router.push(`/space/${adminData.space_id}/matches`);
    } catch (err) {
      setLoginError(err.message || 'Admin login failed.');
      setIsLoggingInAdmin(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12 px-4">
      <div className="w-full max-w-md p-8 bg-gray-800 shadow-xl rounded-xl">
        <h1 className="text-3xl font-bold text-center text-purple-400 mb-6">Admin Login</h1>
        <p className="text-center text-gray-400 mb-6">Enter the Join Code and Admin Password for your Space.</p>
        <form onSubmit={handleAdminLoginSubmit} className="space-y-6">
          <div>
            <label htmlFor="joinCodeLogin" className="block text-sm font-medium text-gray-300">Space Join Code</label>
            <input id="joinCodeLogin" type="text" value={joinCodeLogin} onChange={(e) => setJoinCodeLogin(e.target.value.toUpperCase())} required className="input-field" placeholder="Enter the Space's Join Code" />
          </div>
          <div>
            <label htmlFor="adminPasswordLogin" className="block text-sm font-medium text-gray-300">Admin Password for this Space</label>
            <input id="adminPasswordLogin" type="password" value={adminPasswordLogin} onChange={(e) => setAdminPasswordLogin(e.target.value)} required className="input-field" placeholder="Enter your admin password" />
          </div>
          {loginError && <p className="form-error">{loginError}</p>}
          {loginSuccess && <p className="form-success">{loginSuccess}</p>}
          <button type="submit" disabled={isLoggingInAdmin} className="form-button bg-purple-600 hover:bg-purple-700 focus:ring-purple-500">
            {isLoggingInAdmin ? 'Logging In...' : 'Admin Login'}
          </button>
        </form>
        <p className="mt-8 text-sm text-center text-gray-500">
          Need to create a new space?{' '}
          <Link href="/admin-actions" className="font-medium text-indigo-400 hover:text-indigo-300">Create Space Here</Link>
        </p>
         <p className="mt-2 text-sm text-center text-gray-500">
            <Link href="/" className="font-medium text-indigo-400 hover:text-indigo-300">Back to Home</Link>
        </p>
      </div>
    </div>
  );
}