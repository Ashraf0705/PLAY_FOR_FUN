// frontend/src/app/space/[spaceId]/matches/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import SpaceLayout from '@/components/SpaceLayout'; // Using path alias
import { useAuth } from '@/contexts/AuthContext';     // Using path alias
import { getMatches } from '@/services/apiService';   // Using path alias
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Helper function to format only the date part (e.g., "2025-05-30" from backend)
const formatDate = (dateStr) => { // dateStr is expected as 'YYYY-MM-DD'
    if (!dateStr) return 'N/A';
    try {
        // Append a neutral time to ensure it's parsed as a date in the local timezone,
        // not potentially as UTC midnight depending on browser.
        const date = new Date(dateStr + 'T00:00:00'); 
        if (isNaN(date.getTime())) throw new Error("Invalid date string for formatDate");
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'});
    } catch (e) {
        console.error("Error formatting date:", e, "Input:", dateStr);
        return 'Invalid Date';
    }
};

// Helper function to format a full DATETIME string (e.g., "2025-05-30 12:00:00" from backend)
const formatFullDateTime = (dateTimeStr) => { // dateTimeStr is expected as 'YYYY-MM-DD HH:MM:SS'
    if (!dateTimeStr) return 'N/A';
    try {
        // new Date() will parse 'YYYY-MM-DD HH:MM:SS' as LOCAL time
        const date = new Date(dateTimeStr); 
        if (isNaN(date.getTime())) throw new Error("Invalid date string for formatFullDateTime");
        return date.toLocaleString(undefined, { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
    } catch (e) {
        console.error("Error formatting datetime:", e, "Input:", dateTimeStr);
        return 'Invalid DateTime';
    }
};

export default function MatchesPage() {
  const { authUser, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const params = useParams();
  const currentSpaceIdFromUrl = params.spaceId;

  const [matches, setMatches] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [errorMatches, setErrorMatches] = useState(null);

  const fetchMatches = useCallback(async () => {
    if (!isLoggedIn || !authUser?.space_id) {
      setErrorMatches("User not authenticated for this space."); setIsLoadingMatches(false); return;
    }
    if (authUser.space_id.toString() !== currentSpaceIdFromUrl) {
        setErrorMatches("Mismatch between authenticated space and URL space."); setIsLoadingMatches(false); return;
    }
    setIsLoadingMatches(true); setErrorMatches(null);
    try {
      const data = await getMatches(); 
      console.log("Fetched matches data:", data); // For debugging
      setMatches(data || []);
    } catch (err) {
      setErrorMatches(err.message || 'Failed to fetch matches.'); setMatches([]); console.error("Fetch matches error:", err);
    } finally {
      setIsLoadingMatches(false);
    }
  }, [isLoggedIn, authUser, currentSpaceIdFromUrl]);

  useEffect(() => {
    if (isLoggedIn && authUser?.space_id && !isAuthLoading && authUser.space_id.toString() === currentSpaceIdFromUrl) {
        fetchMatches();
    }
  }, [isLoggedIn, authUser, fetchMatches, isAuthLoading, currentSpaceIdFromUrl]);

  if (isAuthLoading) { return ( <SpaceLayout><div className="text-center py-10 text-gray-400">Authenticating user...</div></SpaceLayout> ); }
  if (!isLoggedIn || !authUser || !authUser.space_id) { return ( <SpaceLayout><div className="text-center py-10">Redirecting...</div></SpaceLayout> ); }
  if (authUser.space_id.toString() !== currentSpaceIdFromUrl && !isLoadingMatches && !isAuthLoading) { 
      // Added !isAuthLoading to prevent premature error display
      return ( <SpaceLayout><div className="form-error text-center">Unauthorized for this space.</div></SpaceLayout> ); 
    }

  return (
    <SpaceLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-3xl md:text-4xl font-bold text-indigo-400 mb-8 text-center md:text-left">
          Matches for Space: <span className="text-white">{authUser?.space_name || `ID ${currentSpaceIdFromUrl}`}</span>
        </h1>
        {isLoadingMatches && <p className="text-lg text-center text-gray-400 py-10">Loading matches...</p>}
        {errorMatches && <p className="form-error text-center py-10">Error: {errorMatches}</p>}
        {!isLoadingMatches && !errorMatches && matches.length === 0 && ( <p className="text-lg text-center text-gray-500 py-10">No matches scheduled for this space yet. The Space Admin can add them!</p> )}
        
        {!isLoadingMatches && !errorMatches && matches.length > 0 && (
          <div className="space-y-6">
            {matches.map((match) => {
              // match.prediction_deadline from backend is now 'YYYY-MM-DD HH:MM:SS' (local time string)
              // new Date() will parse this as local time.
              const deadlineDate = new Date(match.prediction_deadline);
              const deadlinePassed = new Date() > deadlineDate;
              const canPredict = (match.status === 'Upcoming' || match.status === 'PredictionOpen') && !deadlinePassed;
              
              const showPredictionClosedButton = !canPredict && 
                                                 (match.status === 'Upcoming' || match.status === 'PredictionOpen' || match.status === 'PredictionClosed') &&
                                                 deadlinePassed && 
                                                 match.status !== 'ResultAvailable' && match.status !== 'MatchDrawn' && match.status !== 'ResultPending';
              
              const showViewDetailsButton = !canPredict || 
                                             match.status === 'ResultAvailable' || 
                                             match.status === 'MatchDrawn' || 
                                             match.status === 'ResultPending';

              return (
                <div key={match.match_id} className="bg-gray-800 p-5 md:p-6 rounded-xl shadow-lg border border-gray-700 hover:border-indigo-600/50 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1 sm:mb-0">
                          {match.team1_name} <span className="text-indigo-400 mx-1 text-lg">vs</span> {match.team2_name}
                        </h2>
                        {(match.ipl_week_number || match.ipl_match_number) && (
                            <p className="text-xs text-indigo-300 font-medium">
                                {match.ipl_week_number && `Week ${match.ipl_week_number}`}
                                {match.ipl_week_number && match.ipl_match_number && ", "}
                                {match.ipl_match_number && `Match ${match.ipl_match_number}`}
                            </p>
                        )}
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full self-start sm:self-center mt-2 sm:mt-0
                      ${match.status === 'Upcoming' || match.status === 'PredictionOpen' ? 'bg-green-700 text-green-100 border border-green-500' : ''}
                      ${match.status === 'PredictionClosed' ? 'bg-yellow-700 text-yellow-100 border border-yellow-500' : ''}
                      ${match.status === 'ResultPending' ? 'bg-blue-700 text-blue-100 border border-blue-500' : ''}
                      ${match.status === 'ResultAvailable' ? 'bg-gray-600 text-gray-200 border border-gray-500' : ''}
                      ${match.status === 'MatchDrawn' ? 'bg-gray-700 text-gray-300 border border-gray-600' : ''}
                    `}>
                      {match.status.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  {/* match.match_date from backend is 'YYYY-MM-DD' */}
                  {/* match.match_time from backend is 'HH:MM:SS' */}
                  <p className="text-sm text-gray-400 mb-1">Date: {formatDate(match.match_date)} at {match.match_time?.substring(0,5) || 'N/A'}</p>
                  {/* match.prediction_deadline from backend is 'YYYY-MM-DD HH:MM:SS' */}
                  <p className="text-sm text-gray-400 mb-4">
                    Prediction Deadline: <span className={(deadlinePassed && (match.status === 'Upcoming' || match.status === 'PredictionOpen' || match.status === 'PredictionClosed')) ? "text-red-400 font-semibold" : "text-yellow-400"}>
                      {formatFullDateTime(match.prediction_deadline)}
                    </span>
                  </p>
                  
                  {match.status === 'ResultAvailable' && match.winning_team && ( <p className="text-md font-semibold text-green-400 mb-3">Winner: {match.winning_team}</p> )}
                  {match.status === 'MatchDrawn' && ( <p className="text-md font-semibold text-gray-300 mb-3">Result: Match Drawn / No Result</p> )}
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {canPredict && (
                      <Link href={`/space/${currentSpaceIdFromUrl}/matches/${match.match_id}/predict`} className="form-button inline-flex items-center justify-center w-auto bg-green-600 hover:bg-green-700 focus:ring-green-500 px-5 text-sm">
                        Predict Winner
                      </Link>
                    )}
                    {showPredictionClosedButton && (
                      <button disabled className="form-button inline-flex items-center justify-center w-auto opacity-60 cursor-not-allowed px-5 text-sm">
                        Prediction Closed
                      </button>
                    )}
                    {showViewDetailsButton && (
                      <Link href={`/space/${currentSpaceIdFromUrl}/matches/${match.match_id}/results`} className="form-button inline-flex items-center justify-center w-auto bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 px-5 text-sm">
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SpaceLayout>
  );
}