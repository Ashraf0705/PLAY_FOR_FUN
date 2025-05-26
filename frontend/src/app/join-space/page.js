// frontend/src/app/join-space/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { joinSpace } from '@/services/apiService';   // Using alias
import { useAuth } from '@/contexts/AuthContext';     // Using alias

export default function JoinSpacePage() {
  const [joinCode, setJoinCode] = useState('');
  const [username, setUsername] = useState('');
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

    if (!joinCode.trim() || !username.trim()) {
      setError('Both Join Code and Username are required.');
      setIsLoading(false);
      return;
    }

    try {
      const userData = await joinSpace(joinCode, username);
      login(userData);
      setSuccessMessage(userData.message || 'Successfully joined space! Redirecting...');
      console.log('Join successful:', userData);
      localStorage.setItem('lastPlayForFunJoinCode', joinCode);
      router.push(`/space/${userData.space_id}/matches`);
    } catch (err) {
      setError(err.message || 'Failed to join space. Please check the code and username.');
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
          Enter the Join Code provided by your Space Admin and choose your nickname!
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="joinCode" className="block text-sm font-medium text-gray-300">Space Join Code</label>
            <input id="joinCode" name="joinCode" type="text" required value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="input-field" placeholder="e.g., FAMILY1"/>
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">Your Username/Nickname</label>
            <input id="username" name="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="input-field" placeholder="e.g., PlayerOne"/>
          </div>
          {error && <p className="form-error">{error}</p>}
          {successMessage && <p className="form-success">{successMessage}</p>}
          <div>
            <button type="submit" disabled={isLoading} className="form-button">
              {isLoading ? 'Joining...' : 'Join Space'}
            </button>
          </div>
        </form>
        <p className="mt-8 text-sm text-center text-gray-500">
          Don't have a code? Ask your family/group admin! Or{' '}
          <Link href="/" className="font-medium text-indigo-400 hover:text-indigo-300">go back home</Link>.
        </p>
      </div>
    </div>
  );
}