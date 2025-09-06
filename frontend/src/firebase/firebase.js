// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import axios from "axios";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLcEbP-5jf5D1avpPzfisFrhR5h4SnuHY",
  authDomain: "odoohackathon-1b9aa.firebaseapp.com",
  projectId: "odoohackathon-1b9aa",
  storageBucket: "odoohackathon-1b9aa.firebasestorage.app",
  messagingSenderId: "1018676005477",
  appId: "1:1018676005477:web:a7dfc65c5fa5a68025148c",
  measurementId: "G-CDKBW8E75L",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure axios defaults
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
axios.defaults.baseURL = API_BASE_URL;

// Auth service class
class AuthService {
  constructor() {
    this.currentUser = null;
    this.isLoading = true;

    // Listen for auth state changes
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      this.isLoading = false;

      if (user) {
        try {
          // Get Firebase ID token
          const idToken = await user.getIdToken();

          // Set authorization header for all API requests
          axios.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;

          // Sync user with backend
          await this.syncUserWithBackend();
        } catch (error) {
          console.error("Error setting up authentication:", error);
        }
      } else {
        // Remove authorization header
        delete axios.defaults.headers.common["Authorization"];
      }
    });
  }

  // Sync user data with backend
  async syncUserWithBackend() {
    try {
      const response = await axios.get("/auth/profile");
      return response.data.data.user;
    } catch (error) {
      if (error.response?.status === 404) {
        // User doesn't exist in backend, this is normal for new users
        console.log(
          "User not found in backend, will be created on first API call"
        );
      } else {
        console.error("Error syncing user with backend:", error);
      }
      return null;
    }
  }

  // Register with email and password
  async registerWithEmail(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update profile with display name
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName,
        });
      }

      // Get fresh ID token
      const idToken = await userCredential.user.getIdToken();
      axios.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;

      return {
        success: true,
        user: userCredential.user,
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // Sign in with email and password
  async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Get ID token and set header
      const idToken = await userCredential.user.getIdToken();
      axios.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;

      return {
        success: true,
        user: userCredential.user,
      };
    } catch (error) {
      console.error("Sign in error:", error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);

      // Get ID token and set header
      const idToken = await result.user.getIdToken();
      axios.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;

      return {
        success: true,
        user: result.user,
      };
    } catch (error) {
      console.error("Google sign in error:", error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      delete axios.defaults.headers.common["Authorization"];
      return { success: true };
    } catch (error) {
      console.error("Sign out error:", error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Get ID token
  async getIdToken() {
    if (this.currentUser) {
      return await this.currentUser.getIdToken();
    }
    return null;
  }

  // API Methods for backend communication

  // Complete user registration with additional profile data
  async completeRegistration(profileData) {
    try {
      const response = await axios.post("/auth/register", profileData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Complete registration error:", error);
      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to complete registration",
      };
    }
  }

  // Get user profile from backend
  async getUserProfile() {
    try {
      const response = await axios.get("/auth/profile");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Get user profile error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to get user profile",
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await axios.put("/auth/profile", profileData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update profile",
      };
    }
  }

  // Verify token with backend
  async verifyToken() {
    try {
      const response = await axios.get("/auth/verify");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Verify token error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Token verification failed",
      };
    }
  }

  // Helper method to format error messages
  getErrorMessage(error) {
    const errorMessages = {
      "auth/user-not-found": "No account found with this email address.",
      "auth/wrong-password": "Incorrect password.",
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/weak-password": "Password should be at least 6 characters.",
      "auth/invalid-email": "Invalid email address.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/too-many-requests":
        "Too many failed attempts. Please try again later.",
      "auth/network-request-failed":
        "Network error. Please check your connection.",
      "auth/popup-closed-by-user":
        "Sign-in popup was closed before completion.",
      "auth/cancelled-popup-request": "Sign-in was cancelled.",
    };

    return (
      errorMessages[error.code] ||
      error.message ||
      "An unexpected error occurred."
    );
  }

  // Admin service methods
  adminService = {
    // Get admin dashboard data
    async getDashboard() {
      try {
        const response = await axios.get("/admin/dashboard");
        return {
          success: true,
          data: response.data.data,
        };
      } catch (error) {
        console.error("Get dashboard error:", error);
        return {
          success: false,
          error: error.response?.data?.message || "Failed to get dashboard data",
        };
      }
    },

    // Get all users with filtering
    async getUsers(filters = {}) {
      try {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
          if (filters[key]) params.append(key, filters[key]);
        });

        const response = await axios.get(`/admin/users?${params.toString()}`);
        return {
          success: true,
          data: response.data.data,
        };
      } catch (error) {
        console.error("Get users error:", error);
        return {
          success: false,
          error: error.response?.data?.message || "Failed to get users",
        };
      }
    },

    // Get user by ID
    async getUserById(userId) {
      try {
        const response = await axios.get(`/admin/users/${userId}`);
        return {
          success: true,
          data: response.data.data,
        };
      } catch (error) {
        console.error("Get user by ID error:", error);
        return {
          success: false,
          error: error.response?.data?.message || "Failed to get user",
        };
      }
    },

    // Update user role
    async updateUserRole(userId, role, reason = "") {
      try {
        const response = await axios.put(`/admin/users/${userId}/role`, {
          role,
          reason,
        });
        return {
          success: true,
          data: response.data.data,
        };
      } catch (error) {
        console.error("Update user role error:", error);
        return {
          success: false,
          error: error.response?.data?.message || "Failed to update user role",
        };
      }
    },

    // Update user status
    async updateUserStatus(userId, status, reason = "") {
      try {
        const response = await axios.put(`/admin/users/${userId}/status`, {
          status,
          reason,
        });
        return {
          success: true,
          data: response.data.data,
        };
      } catch (error) {
        console.error("Update user status error:", error);
        return {
          success: false,
          error: error.response?.data?.message || "Failed to update user status",
        };
      }
    },

    // Delete user
    async deleteUser(userId) {
      try {
        const response = await axios.delete(`/admin/users/${userId}`);
        return {
          success: true,
          data: response.data.data,
        };
      } catch (error) {
        console.error("Delete user error:", error);
        return {
          success: false,
          error: error.response?.data?.message || "Failed to delete user",
        };
      }
    },

    // Export users
    async exportUsers(filters = {}) {
      try {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
          if (filters[key]) params.append(key, filters[key]);
        });

        const response = await axios.get(`/admin/users/export?${params.toString()}`);
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        console.error("Export users error:", error);
        return {
          success: false,
          error: error.response?.data?.message || "Failed to export users",
        };
      }
    },

    // Get system statistics
    async getStats() {
      try {
        const response = await axios.get("/admin/stats");
        return {
          success: true,
          data: response.data.data,
        };
      } catch (error) {
        console.error("Get stats error:", error);
        return {
          success: false,
          error: error.response?.data?.message || "Failed to get statistics",
        };
      }
    },
  };
}

// Create and export auth service instance
export const authService = new AuthService();

// Export auth utilities
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
};
