import axios from "axios";
import { auth } from "../firebase/firebase.js";

// API configuration
const local_api = "http://localhost:5000/api/";
// const production_api = 'https://your-production-api.com/api/'

const api = axios.create({
  baseURL: local_api,
});

// Add request interceptor to dynamically set the Authorization header
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken();
        config.headers.Authorization = `Bearer ${idToken}`;
      }
      // Optional: Keep logs for debugging during development
      console.log("=== API REQUEST ===");
      console.log("URL:", config.baseURL + config.url);
      console.log("Method:", config.method?.toUpperCase());
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

// Add response interceptor for logging and clean error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log("=== API RESPONSE SUCCESS ===");
    console.log("Status:", response.status);
    console.log("URL:", response.config.url);
    console.log("============================");
    return response;
  },
  async (error) => {
    // Log error responses for debugging
    console.error("=== API RESPONSE ERROR ===");
    console.error("URL:", error.config?.url);
    console.error("Status:", error.response?.status);
    console.error("Error Data:", error.response?.data);
    console.error("==========================");

    // --- The Single, Correct Logic for 401 Authentication Errors ---
    const isUnauthorized = error.response?.status === 401;
    const isNotPostRequest = error.config?.method !== "post";

    // Only attempt to refresh the token and retry if the error is 401
    // AND it's a safe request (i.e., NOT a POST request).
    if (isUnauthorized && isNotPostRequest) {
      try {
        const user = auth.currentUser;
        if (user) {
          const newToken = await user.getIdToken(true); // Force refresh
          error.config.headers.Authorization = `Bearer ${newToken}`;
          // Retry the original safe request (e.g., GET) with the new token.
          return api.request(error.config);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }
    }

    // For all other errors (like 409 Conflict) or for 401 errors on POST requests,
    // immediately reject the promise. This stops any retry loops and sends the error
    // straight to your React component's .catch() block.
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
      // --- FIX: Re-throw the ORIGINAL error instead of creating a new one ---
      // This preserves all details like response status, data, etc.
      throw error;
    }
  },

  // Fetch books filtered by classId and/or subject string
  getBooks: async (params = {}) => {
    try {
      // params: { classId: string, subject: string }
      // Make GET request to the backend endpoint
      const response = await api.get("teachers/fetch-books-metadata", {
        params,
      });
      return response.data; // expected { success, data: [...] }
    } catch (error) {
      console.error("Error fetching books metadata:", error);
      throw error;
    }
  },

  // Fetch books uploaded by the current teacher
  getMyBooks: async () => {
    try {
      const response = await api.get("teachers/my-books");
      return response.data; // expected { success, data: [...] }
    } catch (error) {
      console.error("Error fetching my books:", error);
      throw error;
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

  // Get teacher assignments (classes and subjects)
  getTeacherAssignments: async (schoolId, email) => {
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append("schoolId", schoolId);
      if (email) params.append("email", email);

      const response = await api.get(
        `${local_api}teachers/assignments?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error("Get teacher assignments error:", error);
      throw error;
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
      // use shared api with auth header
      const response = await api.delete(`teachers/books/${bookId}`);
      return response.data; // { success, message, data }
    } catch (error) {
      console.error("Delete book error:", error);
      throw error;
    }
  },
};

// Question paper API functions
export const paperAPI = {
  updatePaper: async (paperId, paper) => {
    try {
      const response = await api.put(`teachers/question-papers/${paperId}`, {
        paper,
      });
      return response.data; // { success, question_paper, id }
    } catch (error) {
      console.error("Update paper error:", error);
      throw error;
    }
  },
};

export default api;
