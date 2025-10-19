// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { adminService } from "../utils/api";

const AuthContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Get user profile from backend
          const profileResult = await authService.getUserProfile();
          if (profileResult.success) {
            setUserProfile(profileResult.data.user);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Role-based access control helpers
  const hasRole = (requiredRole) => {
    if (!userProfile) return false;
    return userProfile.role === requiredRole;
  };

  const hasAnyRole = (roles) => {
    if (!userProfile) return false;
    return roles.includes(userProfile.role);
  };

  // --- NEW ROLE-BASED ACCESS CONTROL HELPERS ---
  const isSuperAdmin = () => userProfile?.role === "superadmin";
  const isPrincipal = () => userProfile?.role === "principal";
  const isTeacher = () => userProfile?.role === "teacher";

  // A helper to check if the user is any kind of admin
  const isAnyAdmin = () => isSuperAdmin() || isPrincipal();

  const value = {
    user,
    userProfile,
    loading,
    // Authentication methods
    signIn: authService.signInWithEmail.bind(authService),
    signUp: authService.registerWithEmail.bind(authService),
    signInWithGoogle: authService.signInWithGoogle.bind(authService),
    signOut: authService.signOut.bind(authService),
    completeRegistration: authService.completeRegistration.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
    getUserProfile: authService.getUserProfile.bind(authService),
    refreshProfile: async () => {
      const result = await authService.getUserProfile();
      if (result.success) {
        setUserProfile(result.data.user);
      }
      return result;
    },
    // Role-based access control methods
    hasRole,
    hasAnyRole,
    isAnyAdmin,
    isSuperAdmin,
    isTeacher,
    isPrincipal,
    // Admin-specific methods
    adminService: adminService,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
