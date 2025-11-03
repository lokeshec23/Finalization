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
  const username = localStorage.getItem("username") || "";
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
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        borderBottom: "1px solid #e0e0e0",
        minHeight: 15, // ✅ Reduced height
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          // minHeight: 25, // ✅ Reduced from default 64px
          // py: 0.5, // ✅ Reduced padding
          // px: 2, // ✅ Reduced horizontal padding
        }}
      >
        {/* Left - Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <img
            src="/loandna_logo.png"
            alt="Logo"
            style={{ height: "25px", cursor: "pointer" }} // ✅ Reduced from 36px
            onClick={() => navigate("/dashboard")}
          />
        </Box>

        {/* Center - Navigation */}
        <Box sx={{ display: "flex", gap: 2 }}>
          {" "}
          {/* ✅ Reduced from gap: 3 */}
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
              fontSize: "0.875rem", // ✅ Reduced font size
              py: 0.5, // ✅ Reduced button padding
              px: 1.5, // ✅ Reduced horizontal padding
              // minHeight: 32, // ✅ Reduced button height
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
              fontSize: "0.875rem", // ✅ Reduced font size
              py: 0.5,
              px: 1.5,
              // minHeight: 32,
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
              fontSize: "0.875rem", // ✅ Reduced font size
              py: 0.5,
              px: 1.5,
              // minHeight: 32,
            }}
            onClick={() => navigate("/filter")}
          >
            Filter
          </Button>
        </Box>

        {/* Right - Avatar */}
        <Box>
          <IconButton
            onClick={handleAvatarClick}
            sx={{
              p: 0.5, // ✅ Reduced padding
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#0f62fe",
                fontWeight: 600,
                width: 30, // ✅ Reduced from 40px
                height: 30, // ✅ Reduced from 40px
                fontSize: "0.875rem", // ✅ Smaller font
              }}
            >
              {firstLetter}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{
              sx: {
                mt: 0.5,
              },
            }}
          >
            <MenuItem
              onClick={handleLogout}
              sx={{
                fontSize: "0.875rem", // ✅ Smaller menu text
                py: 0.75, // ✅ Reduced menu item padding
                px: 2,
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
