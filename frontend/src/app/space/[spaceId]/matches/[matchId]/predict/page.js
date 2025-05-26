// frontend/src/app/space/[spaceId]/matches/[matchId]/predict/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';         // Using alias
import SpaceLayout from '@/components/SpaceLayout';       // Using alias
import { getMatches, submitPrediction, getMyPrediction } from '@/services/apiService'; // Using alias
import Link from 'next/link';

const formatFullDateTime = (dateTimeStr) => { /* ... same as before ... */
    if (!dateTimeStr) return 'N/A';
    try {
        const date = new Date(dateTimeStr);
        return date.toLocaleString([], { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return 'Invalid DateTime'; }
};

export default function PredictMatchPage() {
  const { authUser, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const params = useParams();
  const router = useRouter();

  const spaceId = params.spaceId;
  const matchId = params.matchId;

  const [matchDetails, setMatchDetails] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState('');
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchMatchAndPredictionDetails = useCallback(async () => {
    if (!isLoggedIn || !matchId || !spaceId || !authUser || authUser.space_id?.toString() !== spaceId) {
      setIsLoadingPage(false); setError("Unauthorized or invalid params for prediction."); return;
    }
    setIsLoadingPage(true); setError(null); setSuccessMessage('');
    try {
      const allMatches = await getMatches();
      const currentMatch = allMatches.find(m => m.match_id.toString() === matchId);
      if (!currentMatch) { setError("Match not found."); setIsLoadingPage(false); return; }
      setMatchDetails(currentMatch);
      const deadlineDate = new Date(currentMatch.prediction_deadline);
      const deadlinePassed = new Date() > deadlineDate;
      if (deadlinePassed || (currentMatch.status !== 'Upcoming' && currentMatch.status !== 'PredictionOpen')) {
          setError("Predictions are closed for this match.");
      }
      const myPredData = await getMyPrediction(matchId);
      if (myPredData && myPredData.predicted_winner) {
        setSelectedWinner(myPredData.predicted_winner); setCurrentPrediction(myPredData.predicted_winner);
      } else {
        setSelectedWinner(''); setCurrentPrediction(null);
      }
    } catch (err) {
      console.error("Error fetching details:", err); setError(err.message || "Failed to load details.");
    } finally {
      setIsLoadingPage(false);
    }
  }, [isLoggedIn, matchId, spaceId, authUser]);

  useEffect(() => {
    if (!isAuthLoading && isLoggedIn && spaceId && matchId) {
        fetchMatchAndPredictionDetails();
    }
  }, [fetchMatchAndPredictionDetails, isAuthLoading, isLoggedIn, spaceId, matchId]);

  const handlePredictionSubmit = async (e) => { /* ... same as before ... */
    e.preventDefault();
    if (!selectedWinner) { setError("Please select a team."); return; }
    setIsSubmitting(true); setError(null); setSuccessMessage('');
    try {
      const data = await submitPrediction(matchId, selectedWinner);
      setSuccessMessage(data.message || "Prediction submitted! Redirecting...");
      setCurrentPrediction(selectedWinner);
      setTimeout(() => { router.push(`/space/${spaceId}/matches`); }, 1500);
    } catch (err) {
      setError(err.message || "Failed to submit prediction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isLoadingPage) { return <SpaceLayout><div className="text-center py-10">Loading...</div></SpaceLayout>; }
  if (!matchDetails) { return <SpaceLayout><div className="form-error text-center py-10">{error || "Match not found."} <Link href={`/space/${spaceId}/matches`} className="text-indigo-400">Back</Link></div></SpaceLayout>; }
  
  const deadlineDate = new Date(matchDetails.prediction_deadline);
  const deadlinePassed = new Date() > deadlineDate;
  const predictionAllowed = (matchDetails.status === 'Upcoming' || matchDetails.status === 'PredictionOpen') && !deadlinePassed;

  return (
    <SpaceLayout>
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-gray-800 shadow-xl rounded-xl p-6 md:p-8">
          <Link href={`/space/${spaceId}/matches`} className="text-sm text-indigo-400 hover:underline mb-6 inline-block">← Back</Link>
          <h1 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">Make Prediction</h1>
          <h2 className="text-xl md:text-2xl font-semibold text-center text-indigo-400 mb-1">{matchDetails.team1_name} <span className="text-gray-400">vs</span> {matchDetails.team2_name}</h2>
          <p className="text-xs text-center text-gray-500 mb-2">Match: {new Date(matchDetails.match_date.split('T')[0]+'T00:00:00').toLocaleDateString([], { weekday:'long', day:'numeric', month:'long' })} at {matchDetails.match_time.substring(0,5)}</p>
          <p className={`text-xs text-center mb-6 ${predictionAllowed ? 'text-yellow-400':'text-red-400 font-semibold'}`}>Deadline: {formatFullDateTime(matchDetails.prediction_deadline)}</p>
          {!predictionAllowed ? (
             <div className="text-center py-6"><p className="text-lg text-red-400 mb-4">Predictions closed.</p>{currentPrediction && (<p className="text-md">Your prediction: <span className="font-semibold">{currentPrediction}</span></p>)}</div>
          ) : (
            <form onSubmit={handlePredictionSubmit} className="space-y-6 mt-6">
              <fieldset><legend className="text-lg text-center mb-4">Who will win?</legend>
                <div className="space-y-4 md:space-y-0 md:flex md:justify-around gap-4">
                  {[matchDetails.team1_name, matchDetails.team2_name].map((team) => (
                    <label key={team} htmlFor={`team-${team.replace(/\s+/g, '-')}`} className={`flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer w-full ${selectedWinner === team ? 'bg-indigo-600 border-indigo-400 scale-105':'bg-gray-700 border-gray-600 hover:border-indigo-500'}`}>
                      <input type="radio" id={`team-${team.replace(/\s+/g, '-')}`} name="predictedWinner" value={team} checked={selectedWinner === team} onChange={(e) => setSelectedWinner(e.target.value)} className="sr-only"/>
                      <span className={`text-xl font-bold ${selectedWinner === team ? 'text-white':'text-gray-100'}`}>{team}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {currentPrediction && (<p className="text-sm text-center text-yellow-400 mt-4">Current prediction: <span className="font-semibold">{currentPrediction}</span>. Change before deadline.</p>)}
              {error && !successMessage && <p className="form-error mt-4">{error}</p>}
              {successMessage && <p className="form-success mt-4">{successMessage}</p>}
              <button type="submit" disabled={isSubmitting || !selectedWinner || !predictionAllowed} className="form-button mt-6">
                {isSubmitting ? 'Submitting...' : (currentPrediction ? 'Update Prediction':'Submit Prediction')}
              </button>
            </form>
          )}
        </div>
      </div>
    </SpaceLayout>
  );
}