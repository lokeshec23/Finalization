import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Typography, Grid } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import FactCheckIcon from "@mui/icons-material/FactCheck";

const TeamSelection = () => {
  const navigate = useNavigate();

  const handleTeamSelect = (team) => {
    // Store the selected team in localStorage to remember the choice
    localStorage.setItem("selectedTeam", team);
    console.log(`Team selected and stored: ${team}`);
    // Navigate to the dashboard
    navigate("/dashboard");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "#f5f7fa",
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 700, color: "#333", mb: 5 }}>
        Select Your Workspace
      </Typography>
      <Grid
        container
        spacing={4}
        justifyContent="center"
        sx={{ maxWidth: 800 }}
      >
        {/* Due Diligence Card */}
        <Grid item xs={12} sm={6}>
          <Card
            onClick={() => handleTeamSelect("dd")}
            sx={{
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "scale(1.05)",
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
        </Grid>

        {/* Income Calculator Card */}
        <Grid item xs={12} sm={6}>
          <Card
            onClick={() => handleTeamSelect("ic")}
            sx={{
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "scale(1.05)",
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
                (Coming Soon) Analyze and calculate income from provided
                documents.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeamSelection;
