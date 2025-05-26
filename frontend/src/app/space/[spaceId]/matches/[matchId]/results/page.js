// frontend/src/app/space/[spaceId]/matches/[matchId]/results/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation'; // useRouter might be needed for other actions
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import SpaceLayout from '@/components/SpaceLayout';
import { getMatchDetailsById, getPredictionSummary } from '@/services/apiService';

const formatFullDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    try {
        const date = new Date(dateTimeStr);
        return date.toLocaleString([], { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return 'Invalid DateTime'; }
};
const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr.split('T')[0] + 'T00:00:00');
        return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return 'Invalid Date'; }
};

export default function MatchResultsPage() {
    const { authUser, isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const params = useParams();
    const router = useRouter(); // Keep for potential future use

    const spaceId = params.spaceId;
    const matchId = params.matchId;

    const [matchDetails, setMatchDetails] = useState(null);
    const [predictionSummary, setPredictionSummary] = useState(null);
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!isLoggedIn || !matchId || !spaceId || !authUser || authUser.space_id?.toString() !== spaceId) {
            setIsLoadingPage(false);
            setError("Unauthorized or invalid parameters.");
            return;
        }
        setIsLoadingPage(true);
        setError(null);
        try {
            const [matchData, summaryData] = await Promise.all([
                getMatchDetailsById(matchId),
                getPredictionSummary(matchId)
            ]);
            console.log("Fetched Match Data:", matchData); // For debugging
            console.log("Fetched Summary Data:", summaryData); // For debugging
            setMatchDetails(matchData);
            setPredictionSummary(summaryData);
        } catch (err) {
            console.error("Error fetching match details or summary:", err);
            setError(err.message || "Failed to load details for this match.");
        } finally {
            setIsLoadingPage(false);
        }
    }, [isLoggedIn, matchId, spaceId, authUser]);

    useEffect(() => {
        if (!isAuthLoading && isLoggedIn && spaceId && matchId && authUser?.space_id?.toString() === spaceId) {
            fetchData();
        }
    }, [fetchData, isAuthLoading, isLoggedIn, spaceId, matchId, authUser]); // Added authUser to dep array

    if (isAuthLoading || isLoadingPage) {
        return <SpaceLayout><div className="text-center py-20 text-gray-400">Loading match details...</div></SpaceLayout>;
    }

    if (error || !matchDetails) { // If matchDetails itself failed to load, show error
        return (
            <SpaceLayout>
                <div className="form-error text-center py-20">
                    {error || "Could not load match information."}
                    <p className="mt-4"><Link href={`/space/${spaceId}/matches`} className="text-indigo-400 hover:underline">← Back to Matches</Link></p>
                </div>
            </SpaceLayout>
        );
    }
    
    // Logic for displaying summary or waiting message
    const deadlineDate = new Date(matchDetails.prediction_deadline);
    const deadlineHasPassed = new Date() > deadlineDate;

    const shouldDisplayPredictionSummary = 
        (deadlineHasPassed || // Deadline passed (regardless of status before result)
        matchDetails.status === 'ResultAvailable' || 
        matchDetails.status === 'MatchDrawn' ||
        matchDetails.status === 'ResultPending' || // Also show if pending after deadline
        matchDetails.status === 'PredictionClosed'); // Explicitly closed

    const showWaitingMessage = 
        !deadlineHasPassed && 
        (matchDetails.status === 'Upcoming' || matchDetails.status === 'PredictionOpen');

    return (
        <SpaceLayout>
            <div className="max-w-4xl mx-auto p-4 md:p-6">
                <div className="bg-gray-800 shadow-xl rounded-xl p-6 md:p-8">
                    <Link href={`/space/${spaceId}/matches`} className="text-sm text-indigo-400 hover:underline mb-6 inline-block">← Back to Matches</Link>
                    
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                            {matchDetails.team1_name} <span className="text-indigo-400 mx-1">vs</span> {matchDetails.team2_name}
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            {formatDate(matchDetails.match_date)} at {matchDetails.match_time?.substring(0,5)}
                        </p>
                        <p className={`text-xs mt-1 ${deadlineHasPassed && (matchDetails.status === 'Upcoming' || matchDetails.status === 'PredictionOpen' || matchDetails.status === 'PredictionClosed') ? 'text-red-400 font-semibold' : 'text-yellow-400'}`}>
                            Prediction Deadline: {formatFullDateTime(matchDetails.prediction_deadline)}
                        </p>
                    </div>

                    {(matchDetails.status === 'ResultAvailable' || matchDetails.status === 'MatchDrawn') && (
                        <div className="mb-8 p-6 bg-gray-700/70 rounded-lg text-center">
                            <h2 className="text-2xl font-semibold text-indigo-300 mb-2">Match Result</h2>
                            {matchDetails.status === 'ResultAvailable' && matchDetails.winning_team && (
                                <p className="text-xl text-green-400">Winner: <span className="font-bold">{matchDetails.winning_team}</span></p>
                            )}
                            {matchDetails.status === 'MatchDrawn' && (
                                <p className="text-xl text-gray-300 font-semibold">Result: Match Drawn / No Result</p>
                            )}
                        </div>
                    )}
                     {matchDetails.status === 'ResultPending' && (
                        <div className="mb-8 p-4 bg-blue-700/30 rounded-lg text-center">
                            <p className="text-lg text-blue-300 font-semibold">Result Pending...</p>
                        </div>
                    )}

                    {/* Prediction Summary Section */}
                    {shouldDisplayPredictionSummary && predictionSummary && (
                        <div className="mt-8 pt-6 border-t border-gray-700">
                            <h2 className="text-2xl font-semibold text-center text-indigo-300 mb-6">Who Predicted What?</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="text-xl font-bold text-white mb-3 text-center border-b border-gray-600 pb-2">{predictionSummary.team1_name || matchDetails.team1_name}</h3>
                                    {predictionSummary.team1_predictors && predictionSummary.team1_predictors.length > 0 ? (
                                        <ul className="space-y-1 text-center">
                                            {predictionSummary.team1_predictors.map(name => <li key={`${name}-t1`} className="text-gray-300">{name}</li>)}
                                        </ul>
                                    ) : ( <p className="text-gray-500 text-center italic">No predictions for {predictionSummary.team1_name || matchDetails.team1_name}.</p> )}
                                </div>
                                <div className="bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="text-xl font-bold text-white mb-3 text-center border-b border-gray-600 pb-2">{predictionSummary.team2_name || matchDetails.team2_name}</h3>
                                    {predictionSummary.team2_predictors && predictionSummary.team2_predictors.length > 0 ? (
                                        <ul className="space-y-1 text-center">
                                            {predictionSummary.team2_predictors.map(name => <li key={`${name}-t2`} className="text-gray-300">{name}</li>)}
                                        </ul>
                                    ) : ( <p className="text-gray-500 text-center italic">No predictions for {predictionSummary.team2_name || matchDetails.team2_name}.</p> )}
                                </div>
                            </div>
                            {predictionSummary.not_predicted && predictionSummary.not_predicted.length > 0 && (
                                <div className="mt-4 bg-gray-700/30 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-gray-400 mb-2 text-center">Did Not Predict:</h3>
                                    <p className="text-sm text-gray-500 text-center leading-relaxed">
                                        {predictionSummary.not_predicted.join(', ')}
                                    </p>
                                </div>
                            )}
                             {predictionSummary.team1_predictors?.length === 0 && predictionSummary.team2_predictors?.length === 0 && predictionSummary.not_predicted?.length > 0 && (
                                <p className="text-center text-gray-500 mt-4 italic">No predictions were made for this match by anyone in the summary.</p>
                             )}
                        </div>
                    )}

                    {showWaitingMessage && (
                        <p className="text-center text-gray-500 mt-8 italic">
                            Prediction summary will be shown after the prediction deadline ({formatFullDateTime(matchDetails.prediction_deadline)}) has passed.
                        </p>
                    )}

                    {/* Fallback if summary should display but data is missing */}
                    {shouldDisplayPredictionSummary && !predictionSummary && !isLoadingPage && !error && (
                         <p className="text-center text-gray-500 mt-8 italic">
                            Prediction summary data is not available.
                        </p>
                    )}
                </div>
            </div>
        </SpaceLayout>
    );
}