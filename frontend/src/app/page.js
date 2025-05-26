// frontend/src/app/page.js
import Link from 'next/link';
// Optional: If you want to use an icon library
// import { UsersIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';


export default function HomePage() {
  return (
    <div className="text-center py-12">
      <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
        Welcome to <span className="text-indigo-400">PlayForFun</span>!
      </h1>
      <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
        Your private hub for exciting IPL prediction contests with family and friends.
        Create your own space, invite your crew, and let the games begin!
      </p>

      <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
        <Link
          href="/join-space"
          className="w-full sm:w-auto text-lg font-semibold px-8 py-4 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Join a Space
        </Link>
        <Link
          href="/admin-actions"
          className="w-full sm:w-auto text-lg font-semibold px-8 py-4 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Admin / Create Space
        </Link>
      </div>

      {/* Optional: Feature Highlight Section */}
      <div className="mt-16 pt-10 border-t border-gray-700">
        <h2 className="text-3xl font-bold mb-8 text-gray-100">Why You'll Love It</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl transform hover:scale-105 transition-transform duration-300">
            {/* <UsersIcon className="h-12 w-12 text-indigo-400 mx-auto mb-4" /> */}
            <div className="h-12 w-12 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">👥</div>
            <h3 className="text-xl font-semibold mb-2 text-white">Private Family Fun</h3>
            <p className="text-gray-400">
              Keep your predictions and leaderboards within your trusted circle.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl transform hover:scale-105 transition-transform duration-300">
            {/* <ShieldCheckIcon className="h-12 w-12 text-green-400 mx-auto mb-4" /> */}
            <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🏆</div>
            <h3 className="text-xl font-semibold mb-2 text-white">Simple & Engaging</h3>
            <p className="text-gray-400">
              Easy-to-understand rules and point system for everyone to enjoy.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl transform hover:scale-105 transition-transform duration-300">
            {/* <SparklesIcon className="h-12 w-12 text-purple-400 mx-auto mb-4" /> */}
            <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🎉</div>
            <h3 className="text-xl font-semibold mb-2 text-white">Season-Long Excitement</h3>
            <p className="text-gray-400">
              Track progress throughout the entire IPL season with weekly and overall leaderboards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}