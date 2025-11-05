import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

// ✅ Helper to get team from storage
const getTeam = () => localStorage.getItem("selectedTeam");

export const documentAPI = {
  listDocuments: async (username = null) => {
    try {
      const params = { team: getTeam() }; // ✅ Add team
      if (username) params.username = username;
      const response = await axios.get(`${API_BASE}/list_json`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }
  },

  // Get single document by ID
  getDocument: async (documentId) => {
    try {
      const response = await axios.get(`${API_BASE}/get_json/${documentId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching document:", error);
      throw error;
    }
  },

  // ✅ NEW: Get document by ID (alias for clarity)
  getDocumentById: async (documentId) => {
    try {
      const params = { team: getTeam() }; // ✅ Add team
      const response = await axios.get(`${API_BASE}/get_json/${documentId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching document by ID:", error);
      throw error;
    }
  },

  // Get document by filename
  getDocumentByFilename: async (filename, username = null) => {
    try {
      const params = { filename, team: getTeam() }; // ✅ Add team
      if (username) params.username = username;
      const response = await axios.get(`${API_BASE}/get_json_by_filename`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching document by filename:", error);
      throw error;
    }
  },

  // Delete document
  deleteDocument: async (documentId) => {
    try {
      const params = { team: getTeam() }; // ✅ Add team
      const response = await axios.delete(
        `${API_BASE}/delete_json/${documentId}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  },
};
