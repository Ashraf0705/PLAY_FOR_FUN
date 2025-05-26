// frontend/src/app/space/[spaceId]/admin/matches/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SpaceLayout from '@/components/SpaceLayout';
import {
    getAllMatchesForAdmin,
    addMatchByAdmin,
    updateMatchByAdmin,
    deleteMatchByAdmin,
    clearMatchResultByAdmin
} from '@/services/apiService';

// --- HELPER FUNCTIONS ---
const formatDateForInput = (isoDateString) => {
    if (!isoDateString) return '';
    return isoDateString.split('T')[0];
};

const formatTimeForInput = (timeStringOrISO) => {
    if (!timeStringOrISO) return '';
    if (timeStringOrISO.includes('T')) {
        try {
            const dateObj = new Date(timeStringOrISO);
            const hours = dateObj.getHours().toString().padStart(2, '0');
            const minutes = dateObj.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        } catch (e) {
            if (timeStringOrISO.includes(':') && timeStringOrISO.length >= 5) {
                 return timeStringOrISO.slice(0, 5);
            }
            return '';
        }
    } else if (timeStringOrISO.includes(':') && timeStringOrISO.length >= 5) {
        return timeStringOrISO.slice(0, 5);
    }
    return '';
};
// --- END HELPER FUNCTIONS ---

export default function AdminManageMatchesPage() {
    const { authUser, isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const spaceId = params.spaceId;

    const [matches, setMatches] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [actionStatus, setActionStatus] = useState({ message: '', type: '' });

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentMatch, setCurrentMatch] = useState(null);

    const [team1Name, setTeam1Name] = useState('');
    const [team2Name, setTeam2Name] = useState('');
    const [matchDate, setMatchDate] = useState('');
    const [matchTime, setMatchTime] = useState('');
    const [predDeadlineDate, setPredDeadlineDate] = useState('');
    const [predDeadlineTime, setPredDeadlineTime] = useState('');
    const [iplWeekNumber, setIplWeekNumber] = useState('');
    const [iplMatchNumber, setIplMatchNumber] = useState('');
    const [matchStatus, setMatchStatus] = useState('Upcoming');

    const [formError, setFormError] = useState(''); // Specifically for form errors
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);

    const fetchAdminMatches = useCallback(async () => {
        if (!isLoggedIn || !authUser?.isAdmin || authUser.space_id?.toString() !== spaceId) {
            setIsLoadingData(false); setError("Unauthorized to manage matches for this space."); return;
        }
        setIsLoadingData(true); setError(null); setActionStatus({ message: '', type: '' });
        try {
            const data = await getAllMatchesForAdmin();
            setMatches(data || []);
        } catch (err) {
            setError(err.message || "Failed to fetch matches."); setMatches([]);
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

    const resetForm = () => {
        setTeam1Name(''); setTeam2Name('');
        setMatchDate(''); setMatchTime('');
        setPredDeadlineDate(''); setPredDeadlineTime('');
        setIplWeekNumber(''); setIplMatchNumber('');
        setMatchStatus('Upcoming');
        setIsEditing(false); setCurrentMatch(null);
        setFormError('');
    };

    const handleShowAddForm = () => { resetForm(); setIsEditing(false); setIsFormVisible(true); setActionStatus({ message: '', type: '' }); };
    const handleShowEditForm = (match) => {
        resetForm(); setIsEditing(true); setCurrentMatch(match);
        setTeam1Name(match.team1_name); setTeam2Name(match.team2_name);
        setMatchDate(match.match_date); setMatchTime(formatTimeForInput(match.match_time));
        const deadline = new Date(match.prediction_deadline);
        setPredDeadlineDate(formatDateForInput(deadline.toISOString()));
        setPredDeadlineTime(formatTimeForInput(deadline.toISOString()));
        setIplWeekNumber(match.ipl_week_number || ''); setIplMatchNumber(match.ipl_match_number || '');
        setMatchStatus(match.status);
        setIsFormVisible(true); setActionStatus({ message: '', type: '' });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmittingForm(true); setFormError(''); setActionStatus({ message: '', type: '' });
        const formattedMatchTime = matchTime.length === 5 ? `${matchTime}:00` : matchTime;
        const formattedPredDeadlineTime = predDeadlineTime.length === 5 ? `${predDeadlineTime}:00` : predDeadlineTime;
        const payload = {
            match_date: matchDate, match_time: formattedMatchTime, team1_name: team1Name, team2_name: team2Name,
            prediction_deadline_date: predDeadlineDate, prediction_deadline_time: formattedPredDeadlineTime,
            ipl_week_number: iplWeekNumber === '' ? null : parseInt(iplWeekNumber, 10),
            ipl_match_number: iplMatchNumber === '' ? null : parseInt(iplMatchNumber, 10),
        };
        if (isEditing) payload.status = matchStatus;

        try {
            let successMsg = '';
            if (isEditing && currentMatch) {
                const data = await updateMatchByAdmin(currentMatch.match_id, payload);
                successMsg = data.message || "Match updated successfully!";
            } else {
                const data = await addMatchByAdmin(payload);
                successMsg = data.message || "Match added successfully!";
            }
            setActionStatus({ message: successMsg, type: 'success' }); // Use actionStatus for form success
            fetchAdminMatches();
            setTimeout(() => { setIsFormVisible(false); resetForm(); }, 1500);
        } catch (err) {
            setFormError(err.message || "Operation failed. Check all fields, especially dates and times.");
        } finally {
            setIsSubmittingForm(false);
        }
    };

    const handleDeleteMatch = async (matchIdToDelete) => {
        if (window.confirm("Are you sure you want to delete this match? This also deletes all related predictions.")) {
            setIsLoadingData(true); setActionStatus({ message: '', type: '' });
            try {
                await deleteMatchByAdmin(matchIdToDelete);
                setActionStatus({ message: "Match deleted successfully.", type: 'success' });
                fetchAdminMatches();
            } catch (err) {
                setActionStatus({ message: err.message || "Failed to delete match.", type: 'error' });
            } finally {
                setIsLoadingData(false);
                setTimeout(() => setActionStatus({ message: '', type: '' }), 3000);
            }
        }
    };

    const handleClearResult = async (matchIdToClear) => {
        if (window.confirm("Are you sure you want to clear the result for this match? Points awarded will be reverted, and the match will become available for result entry again.")) {
            setIsLoadingData(true); setActionStatus({ message: '', type: '' });
            try {
                const data = await clearMatchResultByAdmin(matchIdToClear);
                setActionStatus({ message: data.message || "Match result cleared successfully.", type: 'success' });
                fetchAdminMatches();
            } catch (err) {
                setActionStatus({ message: err.message || "Failed to clear match result.", type: 'error' });
            } finally {
                setIsLoadingData(false);
                setTimeout(() => setActionStatus({ message: '', type: '' }), 3000);
            }
        }
    };
    
    if (isAuthLoading || (!isLoggedIn && !isAuthLoading)) {
        return <SpaceLayout><div className="text-center py-10 text-gray-400">Loading Admin Panel...</div></SpaceLayout>;
    }

    return (
        <SpaceLayout>
            <div className="p-4 md:p-6 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-indigo-400">Manage Matches</h1>
                    {!isFormVisible && (
                        <button onClick={handleShowAddForm} className="form-button bg-green-600 hover:bg-green-700 focus:ring-green-500 w-auto px-5 text-sm">
                            + Add New Match
                        </button>
                    )}
                </div>

                {/* Global Action Status Display - Shown when form is NOT visible */}
                {actionStatus.message && !isFormVisible && (
                    <div className={`p-3 rounded-md text-center mb-6 text-sm ${actionStatus.type === 'success' ? 'form-success' : 'form-error'}`}>
                        {actionStatus.message}
                    </div>
                )}

                {isFormVisible && (
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8 border border-gray-700">
                        <h2 className="text-xl font-semibold text-white mb-6 border-b border-gray-700 pb-3">
                            {isEditing ? `Editing Match: ${currentMatch?.team1_name || '...'} vs ${currentMatch?.team2_name || '...'}` : "Add New Match"}
                        </h2>
                        <form onSubmit={handleFormSubmit} className="space-y-5">
                            {/* Team Names */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="team1Name" className="block text-sm font-medium text-gray-300 mb-1">Team 1</label>
                                    <input type="text" id="team1Name" value={team1Name} onChange={e => setTeam1Name(e.target.value)} className="input-field" required placeholder="e.g., Team Red" />
                                </div>
                                <div>
                                    <label htmlFor="team2Name" className="block text-sm font-medium text-gray-300 mb-1">Team 2</label>
                                    <input type="text" id="team2Name" value={team2Name} onChange={e => setTeam2Name(e.target.value)} className="input-field" required placeholder="e.g., Team Blue" />
                                </div>
                            </div>
                            {/* Match Date & Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="matchDate" className="block text-sm font-medium text-gray-300 mb-1">Match Date</label>
                                    <input type="date" id="matchDate" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="input-field" required />
                                </div>
                                <div>
                                    <label htmlFor="matchTime" className="block text-sm font-medium text-gray-300 mb-1">Match Time (HH:MM)</label>
                                    <input type="time" id="matchTime" value={matchTime} onChange={e => setMatchTime(e.target.value)} className="input-field" required />
                                </div>
                            </div>
                            {/* Prediction Deadline Date & Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="predDeadlineDate" className="block text-sm font-medium text-gray-300 mb-1">Prediction Deadline Date</label>
                                    <input type="date" id="predDeadlineDate" value={predDeadlineDate} onChange={e => setPredDeadlineDate(e.target.value)} className="input-field" required />
                                </div>
                                <div>
                                    <label htmlFor="predDeadlineTime" className="block text-sm font-medium text-gray-300 mb-1">Prediction Deadline Time (HH:MM)</label>
                                    <input type="time" id="predDeadlineTime" value={predDeadlineTime} onChange={e => setPredDeadlineTime(e.target.value)} className="input-field" required />
                                </div>
                            </div>
                            {/* IPL Week and Match Number */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="iplWeekNumber" className="block text-sm font-medium text-gray-300 mb-1">IPL Week Number (Optional)</label>
                                    <input type="number" id="iplWeekNumber" value={iplWeekNumber} onChange={e => setIplWeekNumber(e.target.value)} className="input-field" placeholder="e.g., 3" min="1"/>
                                </div>
                                <div>
                                    <label htmlFor="iplMatchNumber" className="block text-sm font-medium text-gray-300 mb-1">IPL Match Number (Optional)</label>
                                    <input type="number" id="iplMatchNumber" value={iplMatchNumber} onChange={e => setIplMatchNumber(e.target.value)} className="input-field" placeholder="e.g., 15" min="1"/>
                                </div>
                            </div>
                            
                            {/* Match Status (Only for Editing) */}
                            {isEditing && (
                                <div>
                                    <label htmlFor="matchStatus" className="block text-sm font-medium text-gray-300 mb-1">Match Status</label>
                                    <select id="matchStatus" value={matchStatus} onChange={e => setMatchStatus(e.target.value)} className="input-field">
                                        <option value="Upcoming">Upcoming</option>
                                        <option value="PredictionOpen">Prediction Open</option>
                                        <option value="PredictionClosed">Prediction Closed</option>
                                        <option value="ResultPending">Result Pending</option>
                                    </select>
                                </div>
                            )}

                            {/* Form specific error or success from form submission */}
                            {formError && <p className="form-error mt-3">{formError}</p>}
                            {actionStatus.message && actionStatus.type === 'success' && isFormVisible && <p className="form-success mt-3">{actionStatus.message}</p>}
                            
                            <div className="flex space-x-3 pt-3">
                                <button type="submit" disabled={isSubmittingForm} className="form-button flex-1">
                                    {isSubmittingForm ? 'Saving...' : (isEditing ? 'Update Match Details' : 'Add Match to Schedule')}
                                </button>
                                <button type="button" onClick={() => { setIsFormVisible(false); resetForm(); setActionStatus({ message: '', type: '' }); }} className="form-button flex-1 bg-gray-600 hover:bg-gray-500 focus:ring-gray-400">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Existing Matches List */}
                {isLoadingData && !isFormVisible && <p className="text-center text-gray-400 py-10">Loading matches...</p>}
                {/* Show general error for list if form is not visible or if error is not formError */}
                {error && !isFormVisible && <p className="form-error text-center py-10">{error}</p>} 
                
                {!isLoadingData && !error && matches.length === 0 && !isFormVisible && (
                    <p className="text-center text-gray-500 py-10">No matches found for this space. Click "+ Add New Match" to get started.</p>
                )}

                {!isLoadingData && !error && matches.length > 0 && (
                    <div className="space-y-3 mt-2">
                        {!isFormVisible && <h3 className="text-lg font-semibold text-gray-200 mb-3">Existing Matches</h3> } {/* Hide if form is open for cleaner UI */}
                        {matches.map(match => (
                            <div key={match.match_id} className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-3 border border-gray-700">
                                <div className="flex-grow">
                                    <h4 className="text-md font-semibold text-white">{match.team1_name} vs {match.team2_name}</h4>
                                    <p className="text-xs text-gray-400">
                                        Match: {formatDateForInput(match.match_date)} at {formatTimeForInput(match.match_time)}
                                        {match.ipl_week_number && ` (W:${match.ipl_week_number}${match.ipl_match_number ? `, M:${match.ipl_match_number}` : ''})`}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Deadline: {new Date(match.prediction_deadline).toLocaleString([], {month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Status: <span className="font-medium text-gray-300">{match.status}</span> | ID: {match.match_id}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 flex-shrink-0 mt-2 sm:mt-0 self-start sm:self-center">
                                    <button onClick={() => handleShowEditForm(match)} className="text-xs px-3 py-1.5 rounded bg-yellow-500 hover:bg-yellow-600 text-black font-medium transition-colors">Edit</button>
                                    {(match.status === 'ResultAvailable' || match.status === 'MatchDrawn') && (
                                        <button 
                                            onClick={() => handleClearResult(match.match_id)} 
                                            className="text-xs px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-700 text-white font-medium"
                                        >
                                            Clear Result
                                        </button>
                                    )}
                                    <button onClick={() => handleDeleteMatch(match.match_id)} className="text-xs px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">Delete</button>
                                </div>
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