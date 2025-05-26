// frontend/src/components/SpaceLayout.js
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import InSpaceNav from './InSpaceNav';

export default function SpaceLayout({ children }) {
  const { authUser, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const spaceIdFromUrl = params?.spaceId;

  useEffect(() => {
    // console.log("SpaceLayout useEffect triggered. Pathname:", pathname, "isLoggedIn:", isLoggedIn, "isAuthLoading:", isAuthLoading, "authUser:", authUser);

    if (isAuthLoading) {
      // console.log("SpaceLayout: Auth is loading, skipping redirect checks.");
      return;
    }

    // Only apply protection logic if we are on a path that is *supposed* to be protected by SpaceLayout
    // Public paths like '/', '/login', '/about' should not trigger this redirect logic from SpaceLayout.
    const isProtectedPathAttempt = pathname.startsWith('/space/'); // Basic check, refine if needed

    if (isProtectedPathAttempt) {
      if (!isLoggedIn || !authUser || !authUser.space_id) {
        console.log(`SpaceLayout: Protected path (${pathname}) access attempt without full auth, redirecting to /login.`);
        router.replace('/login');
        return;
      }
      
      if (spaceIdFromUrl && authUser.space_id.toString() !== spaceIdFromUrl) {
          console.warn(`SpaceLayout: Auth space ID (${authUser.space_id}) does not match URL space ID (${spaceIdFromUrl}) on protected path. Redirecting to login.`);
          router.replace('/login');
          return;
      }
    }
    // If it's not a protected path attempt (e.g., router is already moving to '/'), SpaceLayout does nothing.
    // console.log("SpaceLayout: Path is not /space/ or auth checks passed for protected path.");

  }, [isLoggedIn, authUser, isAuthLoading, router, pathname, spaceIdFromUrl]);

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-100">
        <p className="text-xl text-gray-400">Authenticating...</p>
      </div>
    );
  }

  // If we are on a protected path but conditions for rendering content are not met (e.g., after logout, before redirect completes)
  // return null to prevent flashing content. The useEffect should handle the redirect.
  const isCurrentlyOnSpacePath = pathname.startsWith('/space/');
  if (isCurrentlyOnSpacePath) {
      if (!isLoggedIn || !authUser || !authUser.space_id) {
          return null; 
      }
      if (spaceIdFromUrl && authUser.space_id.toString() !== spaceIdFromUrl) {
          return null;
      }
  }


  return (
    <div className="space-specific-layout w-full flex flex-col">
      {isCurrentlyOnSpacePath && <div className="container mx-auto px-4 pt-3 md:pt-4"> <InSpaceNav /> </div>}
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}