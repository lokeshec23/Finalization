import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || ""; // Replace later with actual user name from auth
  const firstLetter = username ? username[0].toUpperCase() : "?";

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    handleClose();
    navigate("/login");
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#fff",
        color: "#000",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", // ✅ Enhanced bottom shadow
        borderBottom: "1px solid #e0e0e0", // ✅ Optional: subtle bordera
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Left - Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img
            src="/loandna_logo.png"
            alt="Logo"
            style={{ height: "36px", cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          />
        </Box>

        {/* Center - Navigation */}
        <Box sx={{ display: "flex", gap: 3 }}>
          <Button
            color="inherit"
            sx={{
              textTransform: "none",
              borderBottom:
                window.location.pathname === "/dashboard"
                  ? "2px solid #0f62fe"
                  : "none",
              borderRadius: 0,
              fontWeight: 500,
            }}
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            sx={{
              textTransform: "none",
              borderBottom:
                window.location.pathname === "/finalization"
                  ? "2px solid #0f62fe"
                  : "none",
              borderRadius: 0,
              fontWeight: 500,
            }}
            onClick={() => navigate("/finalization")}
          >
            Finalization
          </Button>
          <Button
            color="inherit"
            sx={{
              textTransform: "none",
              borderBottom:
                window.location.pathname === "/filter"
                  ? "2px solid #0f62fe"
                  : "none",
              borderRadius: 0,
              fontWeight: 500,
            }}
            onClick={() => navigate("/filter")}
          >
            Filter
          </Button>
        </Box>

        {/* Right - Avatar */}
        <Box>
          <IconButton onClick={handleAvatarClick}>
            <Avatar sx={{ bgcolor: "#0f62fe", fontWeight: 600 }}>
              {firstLetter}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
