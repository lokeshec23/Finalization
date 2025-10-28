import axios from "axios";

const API = "http://localhost:8000";

export const registerUser = async (userData) => {
  const res = await axios.post(`${API}/auth/register`, userData);
  return res.data;
};

export const loginUser = async (userData) => {
  const res = await axios.post(`${API}/auth/login`, userData);
  return res.data;
};
