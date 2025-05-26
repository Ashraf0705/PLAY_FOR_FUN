// frontend/src/app/space/[spaceId]/admin/scores/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SpaceLayout from '@/components/SpaceLayout';
import { getOverallLeaderboard, setOverallScoreByAdmin } from '@/services/apiService';

export default function AdminManageScoresPage() {
    const { authUser, isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const spaceId = params.spaceId;

    const [usersList, setUsersList] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [pageError, setPageError] = useState(null);
    const [actionStatus, setActionStatus] = useState({ message: '', type: '', userId: null });

    const [editingUserId, setEditingUserId] = useState(null); // ID of user being edited
    const [newScoreInput, setNewScoreInput] = useState('');   // Current value in edit input

    const fetchUsersAndScores = useCallback(async () => {
        if (!isLoggedIn || !authUser?.isAdmin || authUser.space_id?.toString() !== spaceId) {
            setIsLoadingData(false); setPageError("Unauthorized to manage scores for this space."); return;
        }
        setIsLoadingData(true); setPageError(null); setActionStatus({ message: '', type: '', userId: null });
        try {
            const data = await getOverallLeaderboard(); // Fetches users with overall_total_points
            setUsersList(data || []);
        } catch (err) {
            setPageError(err.message || "Failed to fetch user scores."); setUsersList([]);
        } finally {
            setIsLoadingData(false);
        }
    }, [isLoggedIn, authUser, spaceId]);

    useEffect(() => {
        if (!isAuthLoading && isLoggedIn && authUser?.isAdmin && authUser.space_id?.toString() === spaceId) {
            fetchUsersAndScores();
        } else if (!isAuthLoading && isLoggedIn && (!authUser?.isAdmin || authUser.space_id?.toString() !== spaceId)) {
            router.replace(`/space/${spaceId}/matches`);
        }
    }, [fetchUsersAndScores, isAuthLoading, isLoggedIn, authUser, spaceId, router]);

    const handleEditScoreClick = (user) => {
        setEditingUserId(user.user_id);
        setNewScoreInput(user.overall_total_points.toString());
        setActionStatus({ message: '', type: '', userId: null }); // Clear previous user-specific messages
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setNewScoreInput('');
        setActionStatus({ message: '', type: '', userId: null }); // Clear messages on cancel
    };

    const handleSaveScore = async (userIdToUpdate) => {
        if (newScoreInput === '' || isNaN(parseInt(newScoreInput))) {
            setActionStatus({ message: "Please enter a valid number for the score.", type: 'error', userId: userIdToUpdate });
            return;
        }
        const score = parseInt(newScoreInput, 10);
        // Set loading specific to this user
        setActionStatus({ message: 'Saving score...', type: 'loading', userId: userIdToUpdate });

        try {
            const data = await setOverallScoreByAdmin(userIdToUpdate, score);
            setActionStatus({ message: data.message || "Score updated successfully!", type: 'success', userId: userIdToUpdate });
            setEditingUserId(null); // Close edit form for this user
            setNewScoreInput('');
            // Optimistically update the list or refetch
            // Refetching is simpler for now to ensure data consistency
            fetchUsersAndScores(); 
            setTimeout(() => setActionStatus({ message: '', type: '', userId: null }), 3000); // Clear message after 3s
        } catch (err) {
            setActionStatus({ message: err.message || "Failed to update score.", type: 'error', userId: userIdToUpdate });
        }
    };

    if (isAuthLoading) { return <SpaceLayout><div className="text-center py-10 text-gray-400">Loading Admin Panel...</div></SpaceLayout>; }
    if (!isLoggedIn || !authUser?.isAdmin || authUser.space_id?.toString() !== spaceId) {
        return <SpaceLayout><div className="text-center py-10 text-gray-400">Unauthorized or redirecting...</div></SpaceLayout>;
    }

    return (
        <SpaceLayout>
            <div className="p-4 md:p-6 max-w-3xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold text-indigo-400 mb-8 text-center md:text-left">Manage User Scores</h1>

                {/* Display global action status if not specific to a user during edit */}
                {actionStatus.message && !editingUserId && (
                    <div className={`p-3 rounded-md text-center mb-6 text-sm 
                        ${actionStatus.type === 'success' ? 'form-success' : ''} 
                        ${actionStatus.type === 'error' ? 'form-error' : ''}
                        ${actionStatus.type === 'loading' ? 'bg-blue-700/30 text-blue-300' : ''}
                    `}>
                        {actionStatus.message}
                    </div>
                )}

                {isLoadingData && <p className="text-center text-gray-400 py-10">Loading user scores...</p>}
                {pageError && !isLoadingData && <p className="form-error text-center py-10">{pageError}</p>}
                
                {!isLoadingData && !pageError && usersList.length === 0 && (
                    <p className="text-center text-gray-500 py-10">No users found in this space yet.</p>
                )}

                {!isLoadingData && !pageError && usersList.length > 0 && (
                    <div className="space-y-3">
                        {/* Table Header */}
                        <div className="bg-gray-700/50 p-3 rounded-t-lg shadow-md border-b border-gray-600 hidden sm:block">
                            <div className="grid grid-cols-3 gap-4 items-center font-semibold text-xs text-indigo-300 uppercase tracking-wider">
                                <span className="col-span-1">Username</span>
                                <span className="col-span-1 text-right">Current Score</span>
                                <span className="col-span-1 text-right">Actions</span>
                            </div>
                        </div>
                        {usersList.map(user => (
                            <div key={user.user_id} className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 sm:rounded-b-lg sm:border-t-0">
                                {editingUserId === user.user_id ? (
                                    // Edit Mode
                                    <div className="space-y-3">
                                        <p className="font-semibold text-white text-lg">{user.username}</p>
                                        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
                                            <input 
                                                type="number"
                                                value={newScoreInput}
                                                onChange={(e) => setNewScoreInput(e.target.value)}
                                                className="input-field py-2 w-full sm:flex-grow" // Adjusted for flex
                                                placeholder="New Score"
                                                aria-label={`New score for ${user.username}`}
                                            />
                                            <div className="flex space-x-2 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                                                <button 
                                                    onClick={() => handleSaveScore(user.user_id)} 
                                                    className="form-button text-xs px-4 py-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                                    disabled={actionStatus.type === 'loading' && actionStatus.userId === user.user_id}
                                                >
                                                    {actionStatus.type === 'loading' && actionStatus.userId === user.user_id ? 'Saving...' : 'Save'}
                                                </button>
                                                <button 
                                                    onClick={handleCancelEdit} 
                                                    className="form-button text-xs px-4 py-2 bg-gray-600 hover:bg-gray-500 w-full sm:w-auto"
                                                    disabled={actionStatus.type === 'loading' && actionStatus.userId === user.user_id}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                        {/* Display success/error specific to this user's edit attempt */}
                                        {actionStatus.userId === user.user_id && actionStatus.message && (
                                            <p className={`mt-2 text-xs text-center p-2 rounded-md ${actionStatus.type === 'success' ? 'form-success' : 'form-error'}`}>
                                                {actionStatus.message}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    // View Mode
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-center">
                                        <div className="sm:col-span-1">
                                            <span className="block sm:hidden text-xs text-indigo-300 uppercase">Player</span>
                                            <span className="text-gray-100 truncate" title={user.username}>{user.username}</span>
                                        </div>
                                        <div className="sm:col-span-1 text-right sm:text-right">
                                            <span className="block sm:hidden text-xs text-indigo-300 uppercase">Score</span>
                                            <span className="text-gray-100 font-bold">{user.overall_total_points}</span>
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 text-right mt-2 sm:mt-0">
                                            <button 
                                                onClick={() => handleEditScoreClick(user)} 
                                                className="text-xs px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                                            >
                                                Edit Score
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                 <p className="mt-10 text-sm text-center text-gray-500">
                    <Link href={`/space/${spaceId}/admin`} className="font-medium text-indigo-400 hover:text-indigo-300">
                        ← Back to Admin Dashboard
                    </Link>
                </p>
            </div>
        </SpaceLayout>
    );
}