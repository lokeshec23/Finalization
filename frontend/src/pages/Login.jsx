import React, { useState } from "react";
import {
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  Paper,
} from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/auth";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(form);
      localStorage.setItem("token", res.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "#f4f4f4",
      }}
      // style={{ backgroundImage: "url('/auth_page_bg.png')" }}
    >
      <Paper elevation={3} sx={{ p: 4, width: 380 }}>
        <Typography variant="h5" mb={2} fontWeight={600}>
          Login
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            margin="normal"
            fullWidth
            required
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            margin="normal"
            fullWidth
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2, bgcolor: "#0f62fe" }}
          >
            Login
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 2 }}>
          Don’t have an account? <Link to="/register">Register</Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
