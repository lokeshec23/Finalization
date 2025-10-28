import React, { useState, useEffect } from "react";
import { Box, Tabs, Tab, Typography, Paper } from "@mui/material";
import DataTable from "./DataTable";

const DataViewer = ({ categoryData, categoryName }) => {
  const [activeTab, setActiveTab] = useState(0);

  // Reset tab when category changes
  useEffect(() => {
    setActiveTab(0);
  }, [categoryName]);

  if (!categoryData || categoryData.length === 0) {
    return (
      <Box
        sx={{
          p: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          bgcolor: "#fff",
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Data Available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {categoryName
            ? `No records found for ${categoryName.replace(/_/g, " ")}`
            : "Please select a category"}
        </Typography>
      </Box>
    );
  }

  const formatTabLabel = (index) => {
    return `${categoryName.replace(/_/g, " ")} ${index + 1}`;
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
      }}
    >
      {/* Tabs Header */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            bgcolor: "#fafafa",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.9rem",
              minHeight: 48,
            },
            "& .Mui-selected": {
              color: "#0f62fe",
              fontWeight: 600,
            },
          }}
        >
          {categoryData.map((_, index) => (
            <Tab key={index} label={formatTabLabel(index)} />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
        <DataTable data={categoryData[activeTab]} />
      </Box>
    </Box>
  );
};

export default DataViewer;
