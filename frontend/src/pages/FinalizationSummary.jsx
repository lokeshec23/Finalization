import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Button,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FinalizationTable from "../components/FinalizationTable";

const FinalizationSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [documentData, setDocumentData] = useState(null);
  const [documentName, setDocumentName] = useState("");

  useEffect(() => {
    // Get data from location state
    if (location.state?.documentData) {
      const data = location.state.documentData;
      setDocumentData(data);
      setDocumentName(location.state.originalFileName || "Document");

      // Extract categories
      if (data.finalisation) {
        const cats = Object.keys(data.finalisation);
        setCategories(cats);
        setActiveCategory(cats[0] || "");
      }
    } else {
      // No data, redirect back
      navigate("/finalization");
    }
  }, [location.state, navigate]);

  // Get Note_Extraction data with status "Note - Final"
  const getFinalNotes = () => {
    if (!documentData?.finalisation?.Note_Extraction) {
      return [];
    }
    return documentData.finalisation.Note_Extraction.filter(
      (item) => item.status && item.status.includes("Note - Final")
    );
  };

  // Get data for selected category
  const getCategoryData = () => {
    if (!documentData?.finalisation || !activeCategory) {
      return [];
    }
    return documentData.finalisation[activeCategory] || [];
  };

  const formatCategoryName = (category) => {
    return category.replace(/_/g, " ");
  };

  const finalNotes = getFinalNotes();
  const categoryData = getCategoryData();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header />

      {/* Top Action Bar */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: "#fff",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            variant="outlined"
            size="small"
            sx={{ textTransform: "none" }}
          >
            Back
          </Button>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            📄 {documentName}
          </Typography>
        </Box>
        <Chip
          label="Finalization Summary"
          color="primary"
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {/* Split Layout */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Sidebar - Categories */}
        <Paper
          elevation={0}
          sx={{
            width: "25%",
            minWidth: 250,
            maxWidth: 350,
            borderRight: "1px solid #e0e0e0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: "#0f62fe",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Categories
            </Typography>
            <Chip
              label={categories.length}
              size="small"
              sx={{
                bgcolor: "white",
                color: "#0f62fe",
                fontWeight: 700,
                height: 24,
              }}
            />
          </Box>

          <List sx={{ overflow: "auto", flex: 1, p: 1 }}>
            {categories.map((category) => (
              <ListItemButton
                key={category}
                selected={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                sx={{
                  mb: 0.5,
                  borderRadius: 1,
                  borderLeft:
                    activeCategory === category
                      ? "4px solid #0f62fe"
                      : "4px solid transparent",
                  "&.Mui-selected": {
                    bgcolor: "#e3f2fd",
                    "&:hover": {
                      bgcolor: "#bbdefb",
                    },
                  },
                }}
              >
                <ListItemText
                  primary={formatCategoryName(category)}
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontWeight: activeCategory === category ? 600 : 400,
                      fontSize: "0.95rem",
                    },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>

        {/* Right Side - Tables */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            bgcolor: "#fafafa",
            p: 3,
          }}
        >
          {/* First Table - Note Final */}
          <FinalizationTable
            data={finalNotes}
            title="Note Extraction - Final"
            categoryName="Note_Extraction"
          />

          {/* Second Table - Selected Category */}
          {activeCategory && (
            <FinalizationTable
              data={categoryData}
              title={formatCategoryName(activeCategory)}
              categoryName={activeCategory}
            />
          )}

          {/* Empty State */}
          {!activeCategory && (
            <Paper elevation={2} sx={{ p: 5, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Select a Category
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a category from the left to view detailed data
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default FinalizationSummary;
