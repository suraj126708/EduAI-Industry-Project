import axios from "axios";
import { auth } from "../firebase/firebase.js";

// API configuration
const local_api = "http://localhost:5000/api/";
// const production_api = 'https://your-production-api.com/api/'

const api = axios.create({
  baseURL: local_api,
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

// fetch teacher profile (outside bookAPI)
export async function fetchTeacherProfile() {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const idToken = await user.getIdToken();

  const response = await api.get(`${local_api}auth/profile`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (response.data.success) return response.data.data.user;
  throw new Error("Failed to get profile");
}

// Book API functions
export const bookAPI = {
  /**
   * Upload book PDF with metadata using Axios to support progress tracking.
   * @param {FormData} formData - The form data containing the file and metadata.
   * @param {object} options - Axios config options, including onUploadProgress.
   */
  uploadBook: async (formData, options = {}) => {
    try {
      // Use the 'api' instance which has the interceptor for auth
      const response = await api.post(
        `${local_api}teachers/upload-book`, // Use relative path
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          ...options, // Spread the options, which includes onUploadProgress
        }
      );
      return response.data;
    } catch (error) {
      console.error("Upload book error:", error);
      // Re-throw a more specific error for the component to catch
      throw new Error(error.response?.data?.message || "Upload failed");
    }
  },

  // Fetch classes (admin or public)
  getClasses: async () => {
    try {
      const response = await api.get(`${local_api}admin/classes`);
      return response;
    } catch (error) {
      console.error("Get classes error:", error);
      return { data: { data: [] } };
    }
  },

  // Fetch subjects (admin or public)
  getSubjects: async () => {
    try {
      const response = await api.get(`${local_api}admin/subjects`);
      return response;
    } catch (error) {
      console.error("Get subjects error:", error);
      return { data: { data: [] } };
    }
  },

  // Other helpers (optional)

  // Get book by ID
  getBookById: async (bookId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      const idToken = await user.getIdToken();

      const response = await axios.get(`${local_api}books/${bookId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Get book by ID error:", error);
      throw error;
    }
  },

  // Update book status
  updateBookStatus: async (bookId, status) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      const idToken = await user.getIdToken();

      const response = await axios.put(
        `${local_api}books/${bookId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Update book status error:", error);
      throw error;
    }
  },

  // Delete book
  deleteBook: async (bookId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      const idToken = await user.getIdToken();

      const response = await axios.delete(`${local_api}books/${bookId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Delete book error:", error);
      throw error;
    }
  },
};

export default api;
