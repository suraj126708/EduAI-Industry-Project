import axios from "axios";
import { auth } from "../firebase/firebase.js";

// API configuration
const local_api = "http://localhost:5000/api/";
// const production_api = 'https://your-production-api.com/api/'

const api = axios.create({
  baseURL: local_api,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to dynamically set the Authorization header with Firebase ID token
api.interceptors.request.use(
  async (config) => {
    try {
      // Get current user from Firebase Auth
      const user = auth.currentUser;

      if (user) {
        // Get fresh ID token
        const idToken = await user.getIdToken();
        config.headers.Authorization = `Bearer ${idToken}`;
      }

      // Log request details
      console.log("=== API REQUEST ===");
      console.log("URL:", config.baseURL + config.url);
      console.log("Method:", config.method?.toUpperCase());
      console.log("Headers:", config.headers);
      console.log("Data:", config.data);
      console.log("==================");

      return config;
    } catch (error) {
      console.error("Error getting Firebase ID token:", error);
      return config;
    }
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log("=== API RESPONSE SUCCESS ===");
    console.log("URL:", response.config.url);
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    console.log("Data:", response.data);
    console.log("Headers:", response.headers);
    console.log("============================");
    return response;
  },
  async (error) => {
    // Log error response
    console.error("=== API RESPONSE ERROR ===");
    console.error("URL:", error.config?.url);
    console.error("Status:", error.response?.status);
    console.error("Status Text:", error.response?.statusText);
    console.error("Error Data:", error.response?.data);
    console.error("Error Headers:", error.response?.headers);
    console.error("Error Message:", error.message);
    console.error("Error Code:", error.code);
    console.error("==========================");

    // Handle token expiration (401 Unauthorized)
    if (error.response?.status === 401) {
      try {
        // Try to refresh the token
        const user = auth.currentUser;
        if (user) {
          const newToken = await user.getIdToken(true); // Force refresh
          error.config.headers.Authorization = `Bearer ${newToken}`;

          // Retry the original request with new token
          return api.request(error.config);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Redirect to login or handle authentication failure
        // You might want to dispatch an action to clear user state
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to get current user's ID token
export const getCurrentUserToken = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error("Error getting user token:", error);
    return null;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return !!auth.currentUser;
};

// Helper function to get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Book API functions
export const bookAPI = {
  // Upload book PDF
  uploadBook: async (formData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const idToken = await user.getIdToken();

      const response = await fetch(`${local_api}books/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      return data;
    } catch (error) {
      console.error("Upload book error:", error);
      throw error;
    }
  },

  // Get all books
  getAllBooks: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await api.get(`books?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error("Get all books error:", error);
      throw error;
    }
  },

  // Get book by ID
  getBookById: async (bookId) => {
    try {
      const response = await api.get(`books/${bookId}`);
      return response.data;
    } catch (error) {
      console.error("Get book by ID error:", error);
      throw error;
    }
  },

  // Get books by filter (class and subject)
  getBooksByFilter: async (classValue, subjectValue) => {
    try {
      const response = await api.get(
        `books/filter?classValue=${classValue}&subjectValue=${subjectValue}`
      );
      return response.data;
    } catch (error) {
      console.error("Get books by filter error:", error);
      throw error;
    }
  },

  // Update book status
  updateBookStatus: async (bookId, status) => {
    try {
      const response = await api.put(`books/${bookId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error("Update book status error:", error);
      throw error;
    }
  },

  // Delete book
  deleteBook: async (bookId) => {
    try {
      const response = await api.delete(`books/${bookId}`);
      return response.data;
    } catch (error) {
      console.error("Delete book error:", error);
      throw error;
    }
  },
};

export default api;
