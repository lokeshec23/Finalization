import React, { useState, useEffect } from "react";
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
  Chip, // ✅ Import Chip
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import WorkspacesIcon from "@mui/icons-material/Workspaces"; // ✅ Import icon

const Header = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "";
  const selectedTeam = localStorage.getItem("selectedTeam") || "";
  const firstLetter = username ? username[0].toUpperCase() : "?";

  // ✅ NEW: State to hold the current team
  const [currentTeam, setCurrentTeam] = useState("");

  // ✅ NEW: Read the team from localStorage on component mount
  useEffect(() => {
    debugger;
    const team = localStorage.getItem("selectedTeam");
    if (team) {
      if (team == "dd") setCurrentTeam("Due Diligence");
      else if (team == "ic") setCurrentTeam("Income Calculation");
      else setCurrentTeam(team.toUpperCase()); // e.g., 'DD' or 'IC'
    }

    // Optional: Add an event listener to update if it changes elsewhere
    const handleStorageChange = () => {
      const updatedTeam = localStorage.getItem("selectedTeam");
      setCurrentTeam(updatedTeam ? updatedTeam.toUpperCase() : "");
    };

    window.addEventListener("storage", handleStorageChange);
    // This custom event is useful if you change the team without a page reload
    window.addEventListener("teamChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("teamChanged", handleStorageChange);
    };
  }, [selectedTeam]);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("selectedTeam"); // Also clear team on logout
    handleClose();
    navigate("/login");
  };

  const handleChangeWorkspace = () => {
    handleClose();
    localStorage.removeItem("selectedTeam");
    setCurrentTeam("");
    navigate("/");
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#fff",
        color: "#000",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        borderBottom: "1px solid #e0e0e0",
        minHeight: 48,
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          minHeight: 48,
          py: 0.5,
          px: 2,
        }}
      >
        {/* Left - Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <img
            src="/loandna_logo.png"
            alt="Logo"
            style={{ height: "28px", cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          />

          {/* ✅ NEW: Current Workspace Display */}
          {currentTeam && (
            <Chip
              icon={<WorkspacesIcon />}
              label={`Workspace: ${currentTeam}`}
              variant="outlined"
              size="small"
              sx={{
                color: "#0f62fe",
                borderColor: "#0f62fe",
                fontWeight: 600,
                "& .MuiChip-icon": {
                  color: "#0f62fe",
                },
              }}
            />
          )}
        </Box>

        {/* Center - Navigation */}
        <Box sx={{ display: "flex", gap: 2 }}>
          {/* Dashboard Button */}
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
              fontSize: "0.875rem",
              py: 0.5,
              px: 1.5,
              minHeight: 32,
            }}
            onClick={() => navigate("/dashboard")}
            disabled={selectedTeam?.trim() === ""}
          >
            Dashboard
          </Button>
          {/* Finalization Button */}
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
              fontSize: "0.875rem",
              py: 0.5,
              px: 1.5,
              minHeight: 32,
            }}
            onClick={() => navigate("/finalization")}
            disabled={selectedTeam?.trim() === ""}
          >
            Finalization
          </Button>
          {/* Filter Button */}
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
              fontSize: "0.875rem",
              py: 0.5,
              px: 1.5,
              minHeight: 32,
            }}
            onClick={() => navigate("/filter")}
            disabled={selectedTeam?.trim() === ""}
          >
            Filter
          </Button>
        </Box>

        {/* Right - Avatar & Menu */}
        <Box>
          <IconButton onClick={handleAvatarClick} sx={{ p: 0.5 }}>
            <Avatar
              sx={{
                bgcolor: "#0f62fe",
                fontWeight: 600,
                width: 30,
                height: 30,
                fontSize: "0.875rem",
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
            PaperProps={{ sx: { mt: 0.5 } }}
          >
            <MenuItem
              onClick={handleChangeWorkspace}
              sx={{ fontSize: "0.875rem", py: 0.75, px: 2 }}
            >
              Change Workspace
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              sx={{ fontSize: "0.875rem", py: 0.75, px: 2 }}
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
