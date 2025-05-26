// frontend/src/components/Header.js
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUserApi } from '@/services/apiService';
// Optional: If you want to use an icon for a user menu later
// import { ChevronDownIcon } from '@heroicons/react/20/solid'; // Example

export default function Header() {
  const { authUser, isLoggedIn, logout: contextLogout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await logoutUserApi();
      } catch (error) {
        console.error("Failed to call backend logout API:", error);
      }
      contextLogout();
    }
  };

  // Base classes for navigation links
  const navLinkBase = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ease-in-out";
  const navLinkIdle = "text-gray-300 hover:bg-gray-700 hover:text-white";
  // const navLinkActive = "bg-indigo-600 text-white shadow-md"; // If you want to highlight active based on path

  // Base classes for button-like links
  const buttonLinkBase = "px-4 py-2 text-sm font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75";


  return (
    <header className="bg-gray-800 shadow-lg sticky top-0 z-50 border-b border-gray-700/50"> {/* Added subtle bottom border */}
      <nav className="container mx-auto px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center"> {/* Reduced py slightly, adjusted px */}
        {/* Brand/Logo */}
        <div className="flex items-center">
          <Link href="/" className="text-3xl md:text-4xl font-extrabold text-white hover:text-indigo-300 transition-colors duration-300 ease-in-out transform hover:scale-105 inline-block">
            PlayForFun
          </Link>
        </div>

        {/* Navigation Links - Grouped for better responsive behavior */}
        <div className="flex items-center space-x-3 md:space-x-4 mt-2 md:mt-0"> {/* Consistent spacing */}
          <Link href="/about" className={`${navLinkBase} ${navLinkIdle}`}>
            About
          </Link>
          <Link href="/how-to-play" className={`${navLinkBase} ${navLinkIdle}`}>
            How to Play
          </Link>

          {!isLoggedIn ? (
            <>
              <Link href="/join-space" className={`${navLinkBase} ${navLinkIdle}`}>
                Join
              </Link>
              <Link href="/login" className={`${navLinkBase} ${navLinkIdle}`}>
                Login
              </Link>
              <Link
                href="/admin-actions" // Create Space
                className={`${buttonLinkBase} bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500`}
              >
                Create Space
              </Link>
              <Link
                href="/admin-login"
                className={`${buttonLinkBase} bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500`}
              >
                Admin Login
              </Link>
            </>
          ) : (
            <>
              <div className="text-sm text-indigo-300 items-center flex mr-3"> {/* Added margin-right */}
                <span>Hi, <span className="font-semibold text-white">{authUser.username}</span>!</span>
                {authUser.space_name && <span className="ml-1 text-xs text-gray-400 hidden sm:inline">(Space: {authUser.space_name})</span>} {/* Hide space name on very small screens */}
                {authUser.isAdmin && <span className="ml-2 text-xs font-bold text-purple-400 py-0.5 px-1.5 bg-purple-800/60 rounded">ADMIN</span>}
              </div>
              <button
                onClick={handleLogout}
                className={`${buttonLinkBase} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}