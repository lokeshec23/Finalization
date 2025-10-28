import React from "react";
import Header from "../components/Header";
import { Box, Typography } from "@mui/material";

const Dashboard = () => {
  return (
    <Box>
      <Header />
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Processed Loans</Typography>
        {/* The table will go here next */}
      </Box>
    </Box>
  );
};

export default Dashboard;
