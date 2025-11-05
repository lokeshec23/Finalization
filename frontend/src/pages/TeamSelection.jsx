import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Typography } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import FactCheckIcon from "@mui/icons-material/FactCheck";

const TeamSelection = () => {
  const navigate = useNavigate();

  const handleTeamSelect = (team) => {
    localStorage.setItem("selectedTeam", team);
    console.log(`Team selected and stored: ${team}`);
    navigate("/dashboard");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "#f5f7fa",
        p: 3,
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 700, color: "#333", mb: 5 }}>
        Select Your Workspace
      </Typography>

      {/* ✅ NEW: Flexbox container for side-by-side cards */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 4, // Space between the cards
          width: "100%",
          maxWidth: 800,
          flexWrap: "wrap", // Allows wrapping on very small screens if needed
        }}
      >
        {/* Due Diligence Card (Left) */}
        <Card
          onClick={() => handleTeamSelect("dd")}
          sx={{
            flex: 1, // Each card will take up equal space
            minWidth: 300, // Prevent cards from becoming too narrow
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "translateY(-5px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            },
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ textAlign: "center", p: 4 }}>
            <FactCheckIcon sx={{ fontSize: 60, color: "#0f62fe", mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Due Diligence
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload and manage finalization documents for due diligence
              processes.
            </Typography>
          </CardContent>
        </Card>

        {/* Income Calculator Card (Right) */}
        <Card
          onClick={() => handleTeamSelect("ic")}
          sx={{
            flex: 1, // Each card will take up equal space
            minWidth: 300, // Prevent cards from becoming too narrow
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "translateY(-5px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            },
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ textAlign: "center", p: 4 }}>
            <AccountBalanceIcon
              sx={{ fontSize: 60, color: "#28a745", mb: 2 }}
            />
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Income Calculator
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Analyze and calculate income from provided documents.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default TeamSelection;
