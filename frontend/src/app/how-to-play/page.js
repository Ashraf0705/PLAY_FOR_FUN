// frontend/src/app/how-to-play/page.js
// NO 'use client'; directive at the top

import Link from 'next/link';
// Optional: If you were to use Next.js Image component for static images not in /public,
// you might need to import it, but for images in /public, standard <img> or next/image works.
// For this page, since we don't have dynamic image sources from props/state,
// and if you are using <img> tags or simple text icons, 'use client' is not strictly needed
// unless some child component down the tree requires it.
// However, to use `next/image` for optimized images from the public folder,
// it doesn't inherently make this a client component.

// Metadata is exported directly from Server Components
export const metadata = {
  title: 'How to Play | PlayForFun IPL Prediction',
  description: 'Learn how to create spaces, join, predict, and manage your PlayForFun IPL prediction game.',
};

// Placeholder icons as simple text/emoji for Server Component compatibility without extra libraries
const AdminIcon = () => <span className="text-3xl md:text-4xl mr-3 align-middle" role="img" aria-label="Admin Gear">⚙️</span>;
const PlayerIcon = () => <span className="text-3xl md:text-4xl mr-3 align-middle" role="img" aria-label="Player Trophy">🏆</span>;


export default function HowToPlayPage() {
  return (
    <div className="py-10 px-4">
      <div className="max-w-4xl mx-auto bg-gray-800 shadow-xl rounded-2xl p-8 md:p-12 border border-gray-700"> {/* Added border and more rounding */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-indigo-400 tracking-tight"> {/* Adjusted font and tracking */}
          How to Play PlayForFun
        </h1>

        {/* Section for Admins */}
        <section className="mb-16"> {/* Increased bottom margin */}
          <h2 className="flex items-center text-3xl font-bold text-purple-300 mb-6 border-b-2 border-purple-500/50 pb-3"> {/* Increased font, flex for icon */}
            <AdminIcon />
            For Space Admins
          </h2>
          <div className="space-y-5 text-gray-300 leading-relaxed prose prose-lg prose-invert max-w-none"> {/* Increased prose size */}
            <p>As a Space Admin, you are the master of your private prediction league! Here's your journey:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong>Create a Space:</strong> Navigate to "Create Space". Give your space a cool name and set a secure admin password. The system will generate a unique "Join Code" for you.</li>
              <li><strong>Share the Join Code:</strong> Share this Join Code with the family and friends you want to invite to your space. Only those with the code can join.</li>
              <li><strong>Manage Matches:</strong> Go to your "Admin Panel" (link appears in navigation once logged in as admin), then "Manage Matches". Here you can:
                <ul className="list-disc space-y-1 pl-6 mt-2">
                  <li>Add Matches: Enter team names, match date/time, and the crucial **Prediction Deadline Date & Time**. Optionally add IPL Week/Match numbers.</li>
                  <li>Edit Matches: Modify details of existing matches.</li>
                  <li>Delete Matches: Remove matches.</li>
                </ul>
              </li>
              <li><strong>Enter Match Results:</strong> After a match, go to "Admin Panel" → "Enter Match Results". Select the winner or mark as "Drawn/No Result". This automatically calculates points for all users!</li>
              <li><strong>Manage User Scores (Optional):</strong> In "Admin Panel" → "Manage User Scores", you can manually adjust a user's **overall total points**. This only affects the Overall Leaderboard.</li>
              <li><strong>Clear Mistaken Results:</strong> Entered a wrong result? Go to "Admin Panel" → "Manage Matches". For resulted matches, a "Clear Result" button will appear. This reverts points and resets the match for re-entry.</li>
              <li><strong>Admin Role:</strong> As an Admin, you manage the game. To play and predict in your own space, please join it as a regular user with a different username.</li>
            </ul>
          </div>
        </section>

        {/* Section for Users/Players */}
        <section className="mb-12">
          <h2 className="flex items-center text-3xl font-bold text-green-300 mb-6 border-b-2 border-green-500/50 pb-3">
            <PlayerIcon />
            For Players & Family
          </h2>
          <div className="space-y-5 text-gray-300 leading-relaxed prose prose-lg prose-invert max-w-none">
            <p>Ready to show off your prediction skills? Here’s how to get in on the fun:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong>Join a Space:</strong> Get the "Join Code" from your Admin. Go to "Join Space", enter the code and your Username/Nickname.</li>
              <li><strong>Login (Next Time):</strong> Use "Login" with the Space Join Code and your Username for that space.</li>
              <li><strong>View Matches:</strong> Once in, see upcoming matches and their prediction deadlines.</li>
              <li><strong>Make Predictions:</strong> For open matches, click "Predict Winner", select a team, and submit before the deadline! You can update your pick until the deadline.</li>
              <li><strong>See Who Predicted What:</strong> After a match's deadline, click "View Details" to see a summary of everyone's predictions (no spoilers before the deadline!).</li>
              <li><strong>View Results:</strong> Once the admin enters the result, "View Details" will show the winner and how points were awarded.</li>
              <li><strong>Track Your Standing:</strong> Check the "Weekly" and "Overall" Leaderboards to see your rank! Scoring is simple:
                <ul className="list-disc space-y-1 pl-6 mt-2">
                  <li>Correct Prediction: +2 points</li>
                  <li>Wrong Prediction: -1 point</li>
                  <li>No Prediction Submitted: -1 point</li>
                  <li>Match Drawn/No Result: 0 points</li>
                </ul>
              </li>
              <li><strong>Have Fun!</strong> That's the main goal!</li>
            </ul>
          </div>
        </section>

        <div className="text-center mt-16"> {/* Increased margin */}
          <Link
            href="/"
            className="form-button w-auto px-10 py-3 inline-block text-base" // Made button slightly larger
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}