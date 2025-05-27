// frontend/src/app/how-to-play/page.js
import Link from 'next/link';

export const metadata = {
  title: 'How to Play Guide | PlayForFun IPL Prediction',
  description: 'Your easy guide to creating spaces, joining, predicting, and managing your PlayForFun IPL game.',
};

// Simple text-based icons or emojis for Server Component
const AdminIcon = () => <span className="text-3xl mr-3 align-middle" role="img" aria-label="Admin Settings">🛠️</span>; // Tool emoji
const PlayerIcon = () => <span className="text-3xl mr-3 align-middle" role="img" aria-label="Player Target">🎯</span>; // Target emoji
const CreateIcon = () => <span className="text-xl mr-2 text-indigo-400" role="img" aria-label="Create">➕</span>;
const ShareIcon = () => <span className="text-xl mr-2 text-green-400" role="img" aria-label="Share">🤝</span>;
const ManageIcon = () => <span className="text-xl mr-2 text-yellow-400" role="img" aria-label="Manage">⚙️</span>;
const ResultsIcon = () => <span className="text-xl mr-2 text-blue-400" role="img" aria-label="Results">🏆</span>;
const PointsIcon = () => <span className="text-xl mr-2 text-purple-400" role="img" aria-label="Points">💯</span>;
const JoinIcon = () => <span className="text-xl mr-2 text-teal-400" role="img" aria-label="Join">🚪</span>;
const PredictIcon = () => <span className="text-xl mr-2 text-orange-400" role="img" aria-label="Predict">🔮</span>;
const TrackIcon = () => <span className="text-xl mr-2 text-pink-400" role="img" aria-label="Track">📊</span>;


export default function HowToPlayPage() {
  return (
    <div className="py-12 md:py-16 px-4">
      <div className="max-w-4xl mx-auto bg-gray-800/70 backdrop-blur-md shadow-2xl rounded-2xl p-8 md:p-12 border border-gray-700/50">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 tracking-tight">
          How to Play PlayForFun
        </h1>

        {/* Section for Admins */}
        <section className="mb-16">
          <h2 className="flex items-center text-3xl md:text-4xl font-bold text-purple-300 mb-8 border-b-2 border-purple-500/50 pb-4">
            <AdminIcon />
            For Space Admins
          </h2>
          <div className="space-y-8 text-gray-200 text-base md:text-lg leading-relaxed"> {/* Increased base text size and leading */}
            <p className="italic text-gray-400">As a Space Admin, you're in charge! Here’s your quick guide:</p>
            
            <div className="how-to-step">
              <h3 className="how-to-step-title"><CreateIcon />Create Your Space</h3>
              <p>Head to "Create Space". Pick a name for your league, set a strong admin password, and the system gives you a unique <strong className="text-yellow-300">Join Code</strong>.</p>
            </div>
            
            <div className="how-to-step">
              <h3 className="how-to-step-title"><ShareIcon />Invite Your Crew</h3>
              <p>Share that Join Code with family and friends. Only they can enter your private prediction zone!</p>
            </div>

            <div className="how-to-step">
              <h3 className="how-to-step-title"><ManageIcon />Manage Matches</h3>
              <p>In your "Admin Panel" (via the in-space navigation), go to "Manage Matches" to:</p>
              <ul className="list-disc space-y-1 pl-8 mt-2 text-gray-300">
                  <li><strong>Add Matches:</strong> Input teams, date, time, and the critical **Prediction Deadline** (Date & Time). Optionally add IPL Week/Match numbers for context.</li>
                  <li><strong>Edit/Delete:</strong> Modify or remove matches as needed.</li>
              </ul>
            </div>

            <div className="how-to-step">
              <h3 className="how-to-step-title"><ResultsIcon />Enter Match Results</h3>
              <p>Once a match finishes, go to "Admin Panel" → "Enter Match Results". Select the winner or mark it as "Drawn". This action <strong className="text-green-300">automatically calculates and updates points</strong> for everyone!</p>
            </div>
            
            <div className="how-to-step">
              <h3 className="how-to-step-title"><PointsIcon />Adjust Scores (Optional)</h3>
              <p>Need to make a manual correction? "Admin Panel" → "Manage User Scores" lets you directly set a user's **overall total points**. This change reflects only on the Overall Leaderboard.</p>
            </div>

            <div className="how-to-step">
              <h3 className="how-to-step-title">Clear Mistaken Results</h3>
              <p>Entered a wrong result? No problem! In "Manage Matches", find the resulted match and click "Clear Result". Points will be reverted, and you can re-enter the correct outcome.</p>
            </div>

             <p className="mt-6 p-4 bg-gray-700/50 border-l-4 border-indigo-500 rounded-md text-sm">
              <strong className="text-indigo-300">Admin Note:</strong> To play and predict in your own space, please join it as a regular user with a different username. Your admin login is for management only.
            </p>
          </div>
        </section>

        {/* Section for Users/Players */}
        <section className="mb-12">
          <h2 className="flex items-center text-3xl md:text-4xl font-bold text-green-300 mb-8 border-b-2 border-green-500/50 pb-4">
            <PlayerIcon />
            For Players & Family
          </h2>
          <div className="space-y-8 text-gray-200 text-base md:text-lg leading-relaxed">
            <p className="italic text-gray-400">Ready to prove you're the IPL prediction guru? Here’s how:</p>

            <div className="how-to-step">
              <h3 className="how-to-step-title"><JoinIcon />Join a Space</h3>
              <p>Get the unique "Join Code" from your Admin. Click "Join Space", enter the code and your chosen Username.</p>
            </div>
            <div className="how-to-step">
              <h3 className="how-to-step-title">Login For Next Time</h3>
              <p>Already joined? Use "Login" with the Space Join Code and your Username for that space.</p>
            </div>
            <div className="how-to-step">
              <h3 className="how-to-step-title"><PredictIcon />View Matches & Predict</h3>
              <p>The "Matches" page shows all games. For open matches, click "Predict Winner", pick your team, and submit before the deadline. You can change your pick until the deadline hits!</p>
            </div>
             <div className="how-to-step">
              <h3 className="how-to-step-title">See Predictions & Results</h3>
              <p>After a match's deadline, click "View Details" to see who predicted what. Once the admin enters the result, this page will also show the winner and your points for that match.</p>
            </div>
            <div className="how-to-step">
              <h3 className="how-to-step-title"><TrackIcon />Check Leaderboards</h3>
              <p>See where you stand! Check the "Weekly" and "Overall" Leaderboards using the navigation inside your space. Scoring is simple:</p>
              <ul className="list-disc space-y-1 pl-8 mt-2 text-gray-300 bg-gray-700/30 p-4 rounded-md">
                  <li>Correct Prediction: <strong className="text-green-400">+2 points</strong></li>
                  <li>Wrong Prediction: <strong className="text-red-400">-1 point</strong></li>
                  <li>No Prediction Submitted: <strong className="text-red-400">-1 point</strong></li>
                  <li>Match Drawn/No Result: <strong className="text-gray-400">0 points</strong></li>
              </ul>
            </div>
             <p className="mt-6 p-4 bg-gray-700/50 border-l-4 border-green-500 rounded-md text-sm">
              <strong className="text-green-300">Player Tip:</strong> Keep an eye on those prediction deadlines!
            </p>
          </div>
        </section>

        <div className="text-center mt-16">
          <Link
            href="/"
            className="form-button w-auto px-10 py-3 inline-block text-base bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}