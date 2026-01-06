import axios from "axios";
import { auth } from "../firebase/firebase.js";

// API configuration
const local_api = "http://localhost:5001/api/";
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

  const response = await api.get(`auth/profile`, {
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
          onUploadProgress: options.onUploadProgress,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Upload book error:", error);
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

  // Other helpers (optional)

  // Get book by ID
  getBookById: async (bookId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      const idToken = await user.getIdToken();

      const response = await axios.get(`books/${bookId}`, {
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
  getTeacherAssignments: async (schoolId, email) => {
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append("schoolId", schoolId);
      if (email) params.append("email", email);

      // This correctly calls the TEACHER route: /api/teachers/assignments
      const response = await api.get(
        `teachers/assignments?${params.toString()}`
      );

      // Note: This returns the full axios response object.
      // Your frontend component will need to access result.data.data
      return response;
    } catch (error) {
      console.error("Get teacher assignments error:", error);
      throw error;
    }
  },
  getChapters: async (subject, classId) => {
    try {
      // Adjust the URL prefix ('/books') if your router is mounted differently (e.g., '/teacher')
      const response = await api.get(`teachers/chapters`, {
        params: {
          subject: subject,
          classId: classId,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching chapters:", error);
      // Return a safe fallback object so the UI doesn't crash
      return { success: false, message: error.message };
    }
  },
  getUploadProgress: async (progressId) => {
    try {
      const response = await api.get(`teachers/upload-progress/${progressId}`);
      return response.data; // Expected: { success: true, progress: number }
    } catch (error) {
      // Return a safe fallback so polling doesn't crash the UI
      console.warn("Progress poll failed:", error.message);
      return { success: false, progress: 0 };
    }
  },
};

// Question paper API functions
export const paperAPI = {
  generateQuestionPaper: async (paperPayload) => {
    try {
      const response = await api.post(
        "teachers/generate-question-paper",
        paperPayload
      );
      return response.data; // { success, question_paper, id }
    } catch (error) {
      console.error("Create paper error:", error);
      throw error;
    }
  },

  getMyPapers: async () => {
    try {
      const response = await api.get("teachers/my-question-papers");
      return response.data; // { success, data: [{ _id, paper, title, createdAt, ... }] }
    } catch (error) {
      console.error("Get my papers error:", error);
      throw error;
    }
  },

  getPaperById: async (paperId) => {
    try {
      const response = await api.get(`teachers/question-papers/${paperId}`);
      return response.data; // Returns { success, data: { paper object } }
    } catch (error) {
      console.error(`Get paper by ID (${paperId}) error:`, error);
      throw error;
    }
  },

  updatePaper: async (paperId, payload) => {
    try {
      // ✅ FIX: Remove { } so the payload is sent directly
      const response = await api.put(
        `teachers/question-papers/${paperId}`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Update paper error:", error);
      throw error;
    }
  },

  deletePaper: async (paperId) => {
    try {
      const response = await api.delete(`teachers/question-papers/${paperId}`);
      return response.data; // { success, message, id }
    } catch (error) {
      console.error("Delete paper error:", error);
      throw error;
    }
  },

  regenerateQuestionImage: async (payload) => {
    const response = await api.post(
      "teachers/question-paper/regenerate-image",
      {
        question: payload.question,
        prompt: payload.prompt,
        type: payload.type,
      }
    );

    return response.data;
  },
};

// --- NEW SCHOOL MANAGEMENT API FUNCTIONS ---
export const schoolService = {
  /**
   * Public endpoint for a principal to register their school.
   * @param {object} schoolData - { schoolName, schoolAddress, principalName, principalEmail, password }
   */
  registerSchool: async (schoolData) => {
    try {
      // This is a public route, so no auth token is needed.
      const response = await axios.post(
        `${local_api}schools/register`,
        schoolData
      );
      return response.data;
    } catch (error) {
      // Re-throw to be caught by the component
      throw error.response?.data || error;
    }
  },

  /**
   * Superadmin gets a list of all schools pending verification.
   */
  getPendingSchools: async () => {
    try {
      const response = await api.get("/admin/schools?status=pending");
      return response.data; // { success, data: [...] }
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Superadmin verifies a school.
   * @param {string} schoolId - The ID of the school to verify.
   */
  verifySchool: async (schoolId) => {
    try {
      const response = await api.put(`/admin/schools/verify/${schoolId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// --- NEW ADMIN DASHBOARD API FUNCTION ---
export const adminService = {
  getDashboard: async () => {
    try {
      const response = await api.get("/admin/dashboard");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getUsers: async (filters = {}) => {
    try {
      // This calls your backend endpoint: GET /api/admin/teachers
      const response = await api.get("/admin/teachers", {
        params: filters, // Axios automatically converts this to query params like ?search=...
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // --- (NEW) Function to create a teacher ---
  createUser: async (teacherData) => {
    try {
      // This calls: POST /api/admin/teachers
      const response = await api.post("/admin/teachers", teacherData);
      return response.data;
    } catch (error) {
      // We throw the whole error so the component can read the error.response.data
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      // This makes a PUT request to /api/admin/teachers/:id
      const response = await api.put(`/admin/teachers/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  /**
   * Superadmin gets a list of all schools.
   */
  getSchools: async () => {
    try {
      // This should call the new superadmin route
      const response = await api.get("/superadmin/schools");
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Superadmin creates a new school and its principal.
   * @param {object} schoolData - Contains school and principal details.
   */
  createSchoolWithPrincipal: async (schoolData) => {
    try {
      const response = await api.post("/superadmin/schools", schoolData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      const response = await api.put(`/admin/teachers/${userId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
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
  getTeacherAssignmentsforAdmin: async (schoolId, email) => {
    try {
      // Build params object properly and pass to axios
      const params = {};
      if (schoolId) params.schoolId = schoolId;
      if (email) params.email = email;

      // Use relative path (api has baseURL) and pass params
      const response = await api.get("/admin/assignments", { params });
      // Return the response.data (consistent with other API helpers)
      return response.data;
    } catch (error) {
      console.error("Get teacher assignments error:", error);
      // Preserve error details for components
      throw error.response?.data || error;
    }
  },
  removeAssignment: async (assignmentId) => {
    try {
      // This calls: DELETE /api/admin/assignments/:id
      const response = await api.delete(`/admin/assignments/${assignmentId}`);
      return response.data; // Returns { success, message, data }
    } catch (error) {
      // We throw the whole error so the component can read the error.response.data
      throw error;
    }
  },
  assignTeacher: async (assignmentData) => {
    try {
      // This calls: POST /api/admin/assignments
      const response = await api.post("/admin/assignments", assignmentData);
      return response.data; // Returns { success, data }
    } catch (error) {
      // We throw the whole error so the component can read the error.response.data
      throw error;
    }
  },
  deleteSubject: async (subjectId) => {
    try {
      // This calls: DELETE /api/admin/subjects/:id
      const response = await api.delete(`/admin/subjects/${subjectId}`);
      return response.data; // Returns { success, message, data }
    } catch (error) {
      // Throws the error to be caught by the component
      throw error;
    }
  },
  createClass: async (classData) => {
    try {
      // This calls: POST /api/admin/classes
      const response = await api.post("/admin/classes", classData);
      return response.data; // Returns { success, data }
    } catch (error) {
      // Throws the error to be caught by the component
      throw error;
    }
  },
  createSubject: async (subjectData) => {
    try {
      // This calls: POST /api/admin/subjects
      const response = await api.post("/admin/subjects", subjectData);
      return response.data; // Returns { success, data }
    } catch (error) {
      // Throws the error to be caught by the component
      throw error;
    }
  },
  deleteClass: async (classId) => {
    try {
      // Calls: DELETE /api/admin/classes/:id
      const response = await api.delete(`/admin/classes/${classId}`);
      return response.data; // Should return { success, message, data }
    } catch (error) {
      // Throws the error to be caught by the component
      throw error;
    }
  },

  getPapers: async () => {
    try {
      // Use the 'api' instance to make an authenticated GET request
      const response = await api.get("/admin/papers");

      // The AdminPapers.js component expects the full response data
      // e.g., { success: true, data: { papers: [...] } }
      return response.data;
    } catch (error) {
      console.error("Error fetching papers for admin:", error);

      // Return the error response from the server if it exists
      if (error.response && error.response.data) {
        return error.response.data; // e.g., { success: false, message: "..." }
      }

      // Fallback for network or other errors
      return {
        success: false,
        message:
          error.message || "An unknown error occurred while fetching papers.",
      };
    }
  },

  getBooksByClass: async () => {
    try {
      const response = await api.get("/admin/books-by-class");
      return response.data; // Should be { success: true, data: [...] }
    } catch (error) {
      console.error("Error fetching books by class for admin:", error);
      return error.response?.data || { success: false, message: error.message };
    }
  },

  uploadStudentExcel: async (formData) => {
    try {
      // This calls: POST /api/admin/students/uploads
      // The 'api' instance automatically adds the auth token
      const response = await api.post("/admin/students/uploads", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        // You can add an onUploadProgress callback here if you
        // want to show a loading bar in your component.
      });

      // Returns { success, message, data: { successCount, failedRows } }
      return response.data;
    } catch (error) {
      // Re-throw the error so the component can catch it
      console.error("Error uploading student Excel:", error);
      throw error.response?.data || error;
    }
  },
  getStudents: async (grade, division, rollNumber) => {
    try {
      // 🔴 FIX: Map frontend args to the specific backend query params
      const params = {
        class: grade, // Frontend 'grade'  -> Backend 'class'
        div: division, // Frontend 'division' -> Backend 'div'
      };

      if (rollNumber) {
        params.rollNumber = rollNumber;
      }

      // This calls GET /api/admin/students?class=10&div=A
      const response = await api.get("/admin/students", { params });
      return response.data; // { success, data: [...] }
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error.response?.data || error;
    }
  },
  getDashboardSuperAdmin: async () => {
    try {
      // Adjust the URL if your backend route is different (e.g., 'admin/stats')
      const response = await api.get("/admin/dashboard-stats");
      return response.data; // Expected: { success: true, data: { statistics: { ... } } }
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      throw error;
    }
  },
};

export const teacherAPI = {
  getStudentsByClass: async (grade, division, rollNumber) => {
    try {
      const params = { grade, division };
      if (rollNumber) {
        params.rollNumber = rollNumber;
      }

      const res = await api.get("/teachers/students-by-class", { params });
      return res.data;
    } catch (err) {
      console.error("Error fetching students:", err);
      throw err;
    }
  },

  getFilteredPaperGroups: async (classGrade, subject, examType, date) => {
    try {
      const res = await api.get("/teachers/my-question-papers-grouped", {
        params: { classGrade, subject },
      });
      return res.data; // Returns { success: true, data: [...] }
    } catch (err) {
      console.error("Error fetching paper groups:", err);
      throw err;
    }
  },
};

export const evaluationAPI = {
  uploadAnswerSheet: async (formData) => {
    try {
      const res = await api.post("/evaluation/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data; // Returns { success: true, data: [...] }
    } catch (err) {
      console.error("Error uploading answer sheet:", err);
      throw err;
    }
  },

  getReportById: async (id) => {
    try {
      const res = await api.get(`/evaluation/${id}`);
      return res.data; // Returns { success: true, data: {...} }
    } catch (err) {
      console.error(
        "Error fetching report:",
        err.response?.data || err.message
      );
      return err.response?.data || { success: false, message: err.message };
    }
  },

  getEvaluationsByClass: async (classGrade, division) => {
    try {
      const res = await api.get(
        `/evaluation/class/status?classGrade=${classGrade}&division=${division}`
      );
      return res.data; // Returns { success: true, data: { studentId: [...] } }
    } catch (err) {
      console.error(
        "Error fetching class evaluations:",
        err.response?.data || err.message
      );
      return err.response?.data || { success: false, message: err.message };
    }
  },

  generateSemesterReport: async (payload) => {
    try {
      // payload = { studentId, startDate, endDate }
      const res = await api.post("/evaluation/semester", payload);
      return res.data;
    } catch (err) {
      console.error("Report generation error:", err);
      return err.response?.data || { success: false, message: err.message };
    }
  },

  getSemesterReportById: async (reportId) => {
    try {
      const res = await api.get(`/evaluation/semester-report/${reportId}`);
      // Expected response: { success: true, data: { ...report object... } }
      return res.data;
    } catch (err) {
      console.error("Fetch report error:", err);
      return err.response?.data || { success: false, message: err.message };
    }
  },

  checkReportStatus: async (payload) => {
    try {
      // payload = { studentIds: [], startDate, endDate }
      const res = await api.post("/evaluation/semester/check-status", payload);
      return res.data;
    } catch (err) {
      console.error("Check status error:", err);
      return { success: false, data: {} };
    }
  },

  updateEvaluationReport: async (reportId, payload) => {
    try {
      const res = await api.put(`/evaluation/update/${reportId}`, payload);
      return res.data;
    } catch (err) {
      console.error("Update report error:", err);
      return err.response?.data || { success: false, message: err.message };
    }
  },
};

export default api;
