// frontend/src/components/InSpaceNav.js
'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function InSpaceNav() {
  const params = useParams();
  const pathname = usePathname();
  const { authUser } = useAuth();

  const spaceId = params?.spaceId; // Use optional chaining for safety

  // If spaceId is not available from params (e.g., if this component is somehow rendered outside a dynamic space route)
  // or if authUser is not yet loaded, we might not want to render anything or render a fallback.
  // However, SpaceLayout should ideally prevent rendering InSpaceNav if authUser or spaceId is missing.
  if (!spaceId || !authUser) return null;

  const navItems = [
    { name: 'Matches', href: `/space/${spaceId}/matches` },
    { name: 'Weekly Leaderboard', href: `/space/${spaceId}/leaderboard/weekly` },
    { name: 'Overall Leaderboard', href: `/space/${spaceId}/leaderboard/overall` },
  ];

  // Conditionally add Admin Panel link if the user is an admin of the current space
  if (authUser.isAdmin && authUser.space_id?.toString() === spaceId.toString()) {
    navItems.push({ name: 'Admin Panel', href: `/space/${spaceId}/admin` });
  }

  return (
    <nav className="bg-gray-700/60 backdrop-blur-sm shadow-lg rounded-lg mb-6 sticky top-[70px] sm:top-[80px] z-40 py-2"> {/* Adjusted top for main header height */}
      <div className="container mx-auto px-2 sm:px-4 flex flex-wrap justify-center sm:justify-start items-center gap-x-2 gap-y-2 sm:gap-x-3">
        {navItems.map((item) => {
          // Check if the current pathname *starts with* the item's href for active state,
          // especially useful if there are sub-routes like /admin/matches
          const isActive = pathname === item.href || (item.href !== `/space/${spaceId}/matches` && pathname.startsWith(item.href)) || (pathname === `/space/${spaceId}` && item.name === 'Matches');


          return (
            <Link
              key={item.name}
              href={item.href}
              className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105
                ${isActive
                  ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400 ring-opacity-50'
                  : 'text-gray-300 hover:bg-gray-600/70 hover:text-white'
                }
              `}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}