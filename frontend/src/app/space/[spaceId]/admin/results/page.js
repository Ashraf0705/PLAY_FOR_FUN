// frontend/src/app/space/[spaceId]/admin/results/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SpaceLayout from '@/components/SpaceLayout';
import { getAllMatchesForAdmin, enterMatchResultByAdmin } from '@/services/apiService';

const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    // Ensure the date string is treated as local by providing a full time component if only date is passed
    const dateToParse = dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00';
    return new Date(dateToParse).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function AdminEnterResultsPage() {
    const { authUser, isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const spaceId = params.spaceId;

    const [matchesAwaitingResult, setMatchesAwaitingResult] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [pageError, setPageError] = useState(null); // General page error for fetching matches
    
    // submissionStatus: { [matchId]: { isLoading: boolean, error: string|null, success: string|null, loadingAction?: string } }
    const [submissionStatus, setSubmissionStatus] = useState({});

    const fetchAdminMatches = useCallback(async () => {
        if (!isLoggedIn || !authUser?.isAdmin || authUser.space_id?.toString() !== spaceId) {
            setIsLoadingData(false); setPageError("Unauthorized."); return;
        }
        setIsLoadingData(true); setPageError(null);
        try {
            const data = await getAllMatchesForAdmin();
            const now = new Date();
            const filtered = (data || []).filter(match => {
                let matchDateTime;
                try {
                    const datePart = match.match_date.split('T')[0];
                    const timePart = match.match_time;
                    matchDateTime = new Date(`${datePart}T${timePart}`);
                } catch (e) {
                    console.warn(`Invalid date/time for match ${match.match_id}: ${match.match_date} ${match.match_time}`);
                    return false;
                }
                return (match.status !== 'ResultAvailable' && match.status !== 'MatchDrawn' && matchDateTime <= now);
            });
            setMatchesAwaitingResult(filtered);
        } catch (err) {
            setPageError(err.message || "Failed to fetch matches."); 
            setMatchesAwaitingResult([]);
        } finally {
            setIsLoadingData(false);
        }
    }, [isLoggedIn, authUser, spaceId]);

    useEffect(() => {
        if (!isAuthLoading && isLoggedIn && authUser?.isAdmin && authUser.space_id?.toString() === spaceId) {
            fetchAdminMatches();
        } else if (!isAuthLoading && isLoggedIn && (!authUser?.isAdmin || authUser.space_id?.toString() !== spaceId)) {
            router.replace(`/space/${spaceId}/matches`);
        }
    }, [fetchAdminMatches, isAuthLoading, isLoggedIn, authUser, spaceId, router]);

    const handleResultSubmit = async (matchId, resultType, winningTeam = null, actionClicked) => {
        // Set loading state specifically for this match and action
        setSubmissionStatus(prev => ({
            ...prev,
            [matchId]: { isLoading: true, error: null, success: null, loadingAction: actionClicked }
        }));

        try {
            const payload = { result_type: resultType };
            if (resultType === 'Winner') {
                if (!winningTeam) { // Should be caught by button logic if team name is dynamic
                    throw new Error("Winning team must be provided for 'Winner' result.");
                }
                payload.winning_team = winningTeam;
            }

            const data = await enterMatchResultByAdmin(matchId, payload);
            setSubmissionStatus(prev => ({ 
                ...prev, 
                [matchId]: { isLoading: false, error: null, success: data.message || "Result submitted successfully!", loadingAction: null } 
            }));
            
            // Refresh matches list after a short delay to show updated status
            // The successfully submitted match should disappear from this list.
            setTimeout(() => {
                fetchAdminMatches(); 
                // Clear the success/error message for this match after it has been refetched or disappeared
                setTimeout(() => {
                    setSubmissionStatus(prevStatus => {
                        const newStatus = {...prevStatus};
                        delete newStatus[matchId]; // Remove the entry for this matchId
                        return newStatus;
                    });
                 }, 2500); // Total time success/error message is visible if match doesn't disappear

            }, 700); // Delay before refetching to allow user to see success briefly

        } catch (err) {
            setSubmissionStatus(prev => ({ 
                ...prev, 
                [matchId]: { isLoading: false, error: err.message || "Failed to submit result.", success: null, loadingAction: null } 
            }));
        }
    };

    if (isAuthLoading) { return <SpaceLayout><div className="text-center py-10 text-gray-400">Loading Admin Panel...</div></SpaceLayout>; }
     if (!isLoggedIn || !authUser?.isAdmin || authUser.space_id?.toString() !== spaceId) {
        // This case should be handled by SpaceLayout redirecting, or the useEffect above.
        // Returning null or a loading indicator here is fine.
        return <SpaceLayout><div className="text-center py-10 text-gray-400">Unauthorized or redirecting...</div></SpaceLayout>;
    }

    return (
        <SpaceLayout>
            <div className="p-4 md:p-6 max-w-4xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold text-indigo-400 mb-8 text-center md:text-left">Enter Match Results</h1>

                {isLoadingData && <p className="text-center text-gray-400 py-10">Loading matches awaiting results...</p>}
                {pageError && <p className="form-error text-center py-10">{pageError}</p>}
                
                {!isLoadingData && !pageError && matchesAwaitingResult.length === 0 && (
                    <p className="text-center text-gray-500 py-10">No matches currently awaiting results, or all pending matches are in the future.</p>
                )}

                {!isLoadingData && !pageError && matchesAwaitingResult.length > 0 && (
                    <div className="space-y-6">
                        {matchesAwaitingResult.map(match => {
                            const currentMatchStatus = submissionStatus[match.match_id] || {};
                            const isCurrentlyLoadingAction = currentMatchStatus.isLoading;
                            const specificLoadingAction = currentMatchStatus.loadingAction;

                            return (
                                <div key={match.match_id} className="bg-gray-800 p-5 md:p-6 rounded-lg shadow-md border border-gray-700">
                                    <h2 className="text-xl font-semibold text-white mb-1">{match.team1_name} vs {match.team2_name}</h2>
                                    <p className="text-xs text-gray-400 mb-4">
                                        Match Date: {formatDateDisplay(match.match_date)} at {match.match_time.slice(0,5)} | Current Status: <span className="font-medium">{match.status}</span>
                                    </p>
                                    <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
                                        <button
                                            onClick={() => handleResultSubmit(match.match_id, 'Winner', match.team1_name, `team1won-${match.match_id}`)}
                                            disabled={isCurrentlyLoadingAction}
                                            className="form-button bg-green-600 hover:bg-green-700 focus:ring-green-500 flex-1 text-sm px-4 py-2"
                                        >
                                            {specificLoadingAction === `team1won-${match.match_id}` ? 'Submitting...' : `${match.team1_name} Won`}
                                        </button>
                                        <button
                                            onClick={() => handleResultSubmit(match.match_id, 'Winner', match.team2_name, `team2won-${match.match_id}`)}
                                            disabled={isCurrentlyLoadingAction}
                                            className="form-button bg-green-600 hover:bg-green-700 focus:ring-green-500 flex-1 text-sm px-4 py-2"
                                        >
                                            {specificLoadingAction === `team2won-${match.match_id}` ? 'Submitting...' : `${match.team2_name} Won`}
                                        </button>
                                        <button
                                            onClick={() => handleResultSubmit(match.match_id, 'Draw', null, `draw-${match.match_id}`)}
                                            disabled={isCurrentlyLoadingAction}
                                            className="form-button bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500 flex-1 text-sm px-4 py-2 text-gray-900 font-semibold"
                                        >
                                            {specificLoadingAction === `draw-${match.match_id}` ? 'Submitting...' : 'Match Drawn / No Result'}
                                        </button>
                                    </div>
                                    {/* Display error or success for THIS match card */}
                                    {currentMatchStatus.error && <p className="form-error mt-3 text-xs text-center">{currentMatchStatus.error}</p>}
                                    {currentMatchStatus.success && <p className="form-success mt-3 text-xs text-center">{currentMatchStatus.success}</p>}
                                </div>
                            );
                        })}
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