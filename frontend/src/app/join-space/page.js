// frontend/src/app/join-space/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { joinSpace } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';

export default function JoinSpacePage() {
  const [joinCode, setJoinCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');             // New state
  const [confirmPassword, setConfirmPassword] = useState(''); // New state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');

    if (!joinCode.trim() || !username.trim() || !password || !confirmPassword) { // Added password checks
      setError('All fields (Join Code, Username, Password, Confirm Password) are required.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) { // Basic frontend length check
        setError('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
    }

    try {
      // Pass all four values to the apiService function
      const userData = await joinSpace(joinCode, username, password, confirmPassword);
      login(userData);
      setSuccessMessage(userData.message || 'Successfully joined space! Redirecting...');
      localStorage.setItem('lastPlayForFunJoinCode', joinCode);
      router.push(`/space/${userData.space_id}/matches`);
    } catch (err) {
      setError(err.message || 'Failed to join space. Please check the details.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 shadow-xl rounded-xl">
        <h1 className="text-3xl font-bold text-center text-indigo-400">
          Join a Prediction Space
        </h1>
        <p className="text-center text-gray-400">
          Enter Join Code, choose a Username, and set your Password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="joinCode" className="block text-sm font-medium text-gray-300">Space Join Code</label>
            <input id="joinCode" type="text" required value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="input-field" placeholder="e.g., FAMILY1"/>
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">Your Username/Nickname</label>
            <input id="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="input-field" placeholder="e.g., PlayerOne"/>
          </div>
          {/* New Password Fields */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Min. 6 characters"/>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">Confirm Password</label>
            <input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" placeholder="Re-enter your password"/>
          </div>

          {error && <p className="form-error">{error}</p>}
          {successMessage && <p className="form-success">{successMessage}</p>}

          <div>
            <button type="submit" disabled={isLoading} className="form-button">
              {isLoading ? 'Joining...' : 'Join Space & Create Account'}
            </button>
          </div>
        </form>
        <p className="mt-8 text-sm text-center text-gray-500">
          Already have an account in a space?{' '}
          <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300">Login Here</Link>.
        </p>
      </div>
    </div>
  );
}