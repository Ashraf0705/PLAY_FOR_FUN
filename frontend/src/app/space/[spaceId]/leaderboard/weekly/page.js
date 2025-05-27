// frontend/src/app/space/[spaceId]/leaderboard/weekly/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import SpaceLayout from '@/components/SpaceLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getWeeklyLeaderboard } from '@/services/apiService';
import { useParams } from 'next/navigation';
// import Link from 'next/link'; // Not used directly in this version

export default function WeeklyLeaderboardPage() {
    const { authUser, isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const params = useParams();
    const currentSpaceIdFromUrl = params.spaceId;

    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState(null);

    const fetchLeaderboard = useCallback(async () => {
        if (!isLoggedIn || !authUser?.space_id || authUser.space_id.toString() !== currentSpaceIdFromUrl) {
             setIsLoadingData(false); setError("Unauthorized or space mismatch."); return;
        }
        setIsLoadingData(true); setError(null);
        try {
            const data = await getWeeklyLeaderboard();
            setLeaderboard(data || []);
        } catch (err) {
            setError(err.message || "Failed to fetch weekly leaderboard.");
            setLeaderboard([]);
        } finally {
            setIsLoadingData(false);
        }
    }, [isLoggedIn, authUser, currentSpaceIdFromUrl]);

    useEffect(() => {
         if (!isAuthLoading && isLoggedIn && authUser?.space_id?.toString() === currentSpaceIdFromUrl) {
            fetchLeaderboard();
        }
    }, [fetchLeaderboard, isAuthLoading, isLoggedIn, authUser, currentSpaceIdFromUrl]);

    if (isAuthLoading) { return <SpaceLayout><div className="text-center py-10 text-gray-400">Authenticating...</div></SpaceLayout>; }
    if (!isLoggedIn || !authUser || authUser.space_id?.toString() !== currentSpaceIdFromUrl) {
        return <SpaceLayout><div className="text-center py-10 form-error">Unauthorized. Redirecting...</div></SpaceLayout>;
    }

    let lastScore = null;
    let currentRank = 0;
    let playersAtCurrentRank = 0;
    const processedLeaderboard = leaderboard.map((player) => { // Removed index as it's not used in this rank logic
        if (player.weekly_points !== lastScore) {
            currentRank += (playersAtCurrentRank + 1);
            playersAtCurrentRank = 0;
            lastScore = player.weekly_points;
        } else {
            playersAtCurrentRank++;
        }
        return { ...player, rank: currentRank };
    });

    return (
        <SpaceLayout>
            <div className="max-w-3xl mx-auto p-4 md:p-8">
                <h1 className="text-4xl md:text-5xl font-bold text-indigo-400 mb-10 text-center">
                    Weekly Leaderboard
                </h1>
                {isLoadingData && <p className="text-center text-gray-400 py-10 text-lg">Loading leaderboard...</p>}
                {error && <p className="form-error text-center py-10 text-lg">{error}</p>}
                {!isLoadingData && !error && processedLeaderboard.length === 0 && (
                    <p className="text-center text-gray-500 py-10 text-lg">No scores recorded for this week yet. Predictions might be ongoing or results pending.</p>
                )}
                {!isLoadingData && !error && processedLeaderboard.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="leaderboard-table">
                            <thead>
                                <tr>{/* Ensure no leading/trailing whitespace here or comments */}
                                    <th className="w-1/6">Rank</th>
                                    <th>Player</th>
                                    <th className="w-1/4 text-right">Weekly Points</th>
                                </tr>{/* Ensure no leading/trailing whitespace here or comments */}
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {processedLeaderboard.map((player) => (
                                    <tr key={player.user_id} className={player.user_id === authUser.user_id ? 'highlighted-row' : ''}
                                    >{/* Ensure no leading/trailing whitespace here or comments */}
                                        <td className="rank-cell">{player.rank}</td>
                                        <td className={player.user_id === authUser.user_id ? 'username-cell' : ''}>{player.username}</td>
                                        <td className={`score-cell ${player.user_id === authUser.user_id ? 'text-indigo-200' : 'text-gray-100'}`}>
                                            {player.weekly_points}
                                        </td>
                                    </tr>/* Ensure no leading/trailing whitespace here or comments */
                                ))}
                            </tbody>{/* Ensure no leading/trailing whitespace here or comments */}
                        </table>
                    </div>
                )}
            </div>
        </SpaceLayout>
    );
}