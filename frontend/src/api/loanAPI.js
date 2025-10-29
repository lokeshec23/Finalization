import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export const loanAPI = {
  // Upload complete loan folder
  uploadLoanFolder: async (formData) => {
    try {
      const response = await axios.post(
        `${API_BASE}/upload_loan_folder`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading loan folder:", error);
      throw error;
    }
  },

  // Get loan by ID
  getLoan: async (loanId, username = null) => {
    try {
      const params = username ? { username } : {};
      const response = await axios.get(`${API_BASE}/get_loan/${loanId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching loan:", error);
      throw error;
    }
  },

  // List all loans
  listLoans: async (username = null) => {
    try {
      const params = username ? { username } : {};
      const response = await axios.get(`${API_BASE}/list_loans`, { params });
      return response.data;
    } catch (error) {
      console.error("Error listing loans:", error);
      throw error;
    }
  },

  // Delete loan
  deleteLoan: async (loanId, username = null) => {
    try {
      const params = username ? { username } : {};
      const response = await axios.delete(`${API_BASE}/delete_loan/${loanId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting loan:", error);
      throw error;
    }
  },
};
