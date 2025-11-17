import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export const filterAPI = {
  // Get all filter keys (categories)
  getFilterKeys: async () => {
    try {
      const response = await axios.get(`${API_BASE}/filter_keys`);
      return response.data;
    } catch (error) {
      console.error("Error fetching filter keys:", error);
      throw error;
    }
  },

  // Get documents by category
  getDocumentsByCategory: async (category, username = null, team) => {
    try {
      const params = { category, team };
      if (username) {
        params.username = username;
      }
      const response = await axios.get(`${API_BASE}/documents_by_category`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching documents by category:", error);
      throw error;
    }
  },
};
