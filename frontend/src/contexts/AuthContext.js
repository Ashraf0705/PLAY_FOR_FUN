// frontend/src/contexts/AuthContext.js
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Keep useRouter for this redirect

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); // For redirecting on logout

  useEffect(() => {
    const storedUser = localStorage.getItem('playforfun_auth_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.token && parsedUser.space_id && parsedUser.user_id) {
            setAuthUser(parsedUser);
        } else {
            console.warn("Invalid stored user data, removing.");
            localStorage.removeItem('playforfun_auth_user');
        }
      } catch (e) {
        console.error("Error parsing stored user data", e);
        localStorage.removeItem('playforfun_auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    console.log("AuthContext: login called with", userData);
    setAuthUser(userData);
    localStorage.setItem('playforfun_auth_user', JSON.stringify(userData));
  };

  const logout = () => { 
    // The backend API call to clear HttpOnly cookie is handled in Header.js before this context function is called.
    console.log("AuthContext: logout called. Clearing frontend state and redirecting to HOME.");
    setAuthUser(null);
    localStorage.removeItem('playforfun_auth_user');
    router.push('/'); // <<<< ENSURE THIS IS REDIRECTING TO HOMEPAGE '/'
  };

  const value = {
    authUser,
    isLoading,
    isLoggedIn: !!authUser,
    isAdmin: authUser?.isAdmin || false,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};