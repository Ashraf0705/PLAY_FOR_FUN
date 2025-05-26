// frontend/src/app/space/[spaceId]/admin/page.js
'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import SpaceLayout from '@/components/SpaceLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

// Placeholder icons - you can replace these with actual SVGs or an icon library
const MatchesIcon = () => <span className="text-4xl mb-3 block">📅</span>; // Calendar emoji
const ResultsIcon = () => <span className="text-4xl mb-3 block">🏆</span>; // Trophy emoji
const ScoresIcon = () => <span className="text-4xl mb-3 block">📊</span>; // Chart emoji

export default function AdminDashboardPage() {
    const params = useParams();
    const { authUser, isLoading: isAuthLoading, isLoggedIn } = useAuth();
    const router = useRouter();
    const spaceId = params.spaceId;

    useEffect(() => {
        if (!isAuthLoading && isLoggedIn && (!authUser?.isAdmin || authUser.space_id?.toString() !== spaceId)) {
            router.replace(`/space/${spaceId}/matches`);
        }
    }, [isAuthLoading, isLoggedIn, authUser, spaceId, router]);

    if (isAuthLoading || !isLoggedIn || !authUser?.isAdmin || authUser.space_id?.toString() !== spaceId) {
        return <SpaceLayout><div className="text-center py-10 text-gray-400">Loading Admin Panel or Unauthorized...</div></SpaceLayout>;
    }

    return (
        <SpaceLayout>
            <div className="p-4 md:p-8"> {/* Increased padding */}
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-12"> {/* Increased size and margin */}
                    <span className="text-indigo-400">Admin Panel:</span> <span className="text-white">{authUser.space_name}</span>
                </h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto"> {/* Increased gap and max-width */}
                    
                    <Link href={`/space/${spaceId}/admin/matches`} className="admin-dashboard-card group">
                        <div className="admin-dashboard-card-icon-wrapper bg-blue-500/20 group-hover:bg-blue-500/30">
                            <MatchesIcon />
                        </div>
                        <h2 className="admin-dashboard-card-title text-blue-300 group-hover:text-blue-200">Manage Matches</h2>
                        <p className="admin-dashboard-card-description">Add, edit, or delete match schedules and prediction deadlines.</p>
                    </Link>
                    
                    <Link href={`/space/${spaceId}/admin/results`}  className="admin-dashboard-card group">
                        <div className="admin-dashboard-card-icon-wrapper bg-green-500/20 group-hover:bg-green-500/30">
                            <ResultsIcon />
                        </div>
                        <h2 className="admin-dashboard-card-title text-green-300 group-hover:text-green-200">Enter Match Results</h2>
                        <p className="admin-dashboard-card-description">Update outcomes and trigger all user point calculations.</p>
                    </Link>
                    
                    <Link href={`/space/${spaceId}/admin/scores`} className="admin-dashboard-card group">
                         <div className="admin-dashboard-card-icon-wrapper bg-yellow-500/20 group-hover:bg-yellow-500/30">
                            <ScoresIcon />
                        </div>
                        <h2 className="admin-dashboard-card-title text-yellow-300 group-hover:text-yellow-200">Manage User Scores</h2>
                        <p className="admin-dashboard-card-description">View and manually adjust individual user total points.</p>
                    </Link>
                </div>
            </div>
        </SpaceLayout>
    );
}