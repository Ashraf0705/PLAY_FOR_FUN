// frontend/src/app/login/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { userLoginToSpace } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';

export default function UserLoginPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // New state for password
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { login } = useAuth();

  useEffect(() => {
    const lastJoinCode = localStorage.getItem('lastPlayForFunJoinCode');
    if (lastJoinCode) {
      setJoinCode(lastJoinCode);
    }
  }, []);

  const handleUserLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');

    if (!joinCode.trim() || !username.trim() || !password) { // Added password check
      setError('All fields (Join Code, Username, Password) are required.');
      setIsLoading(false);
      return;
    }

    try {
      // Pass password to the apiService function
      const userData = await userLoginToSpace(joinCode, username, password);
      login(userData);
      setSuccessMessage(userData.message || 'Login successful! Redirecting...');
      localStorage.setItem('lastPlayForFunJoinCode', joinCode);
      router.push(`/space/${userData.space_id}/matches`);
    } catch (err) {
      setError(err.message || 'Login failed. Please check details and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 shadow-xl rounded-xl">
        <h1 className="text-3xl font-bold text-center text-green-400">
          Login to Your Space
        </h1>
         <p className="text-center text-gray-400 mb-6">
          Enter your Space Join Code, Username, and Password.
        </p>
        <form onSubmit={handleUserLoginSubmit} className="space-y-6">
          <div>
            <label htmlFor="joinCode" className="block text-sm font-medium text-gray-300">Space Join Code</label>
            <input id="joinCode" type="text" required value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="input-field" placeholder="e.g., FAMILY1"/>
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">Your Username/Nickname</label>
            <input id="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="input-field" placeholder="e.g., PlayerOne"/>
          </div>
          {/* New Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Enter your password"/>
          </div>

          {error && <p className="form-error">{error}</p>}
          {successMessage && <p className="form-success">{successMessage}</p>}

          <div>
            <button type="submit" disabled={isLoading} className="form-button bg-green-600 hover:bg-green-700 focus:ring-green-500">
              {isLoading ? 'Logging In...' : 'Login'}
            </button>
          </div>
        </form>
        <p className="mt-8 text-sm text-center text-gray-500">
          New to a space or first time here?{' '}
          <Link href="/join-space" className="font-medium text-indigo-400 hover:text-indigo-300">
            Join a Space Here
          </Link>
        </p>
         <p className="mt-2 text-sm text-center text-gray-500">
            <Link href="/" className="font-medium text-indigo-400 hover:text-indigo-300">
                Back to Home
            </Link>
        </p>
      </div>
    </div>
  );
}