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
  IconButton,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FinalizationTable from "../components/FinalizationTable";

const FinalizationSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [documentData, setDocumentData] = useState(null);
  const [documentName, setDocumentName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (location.state?.documentData) {
      const data = location.state.documentData;
      setDocumentData(data);
      setDocumentName(location.state.originalFileName || "Document");

      if (data.finalisation) {
        const cats = Object.keys(data.finalisation);
        setCategories(cats);
        setActiveCategory(cats[0] || "");
      }
    } else {
      navigate("/finalization");
    }
  }, [location.state, navigate]);

  const getFinalNotes = () => {
    if (!documentData?.finalisation?.Note_Extraction) {
      return [];
    }
    return documentData.finalisation.Note_Extraction.filter(
      (item) => item.status && item.status.includes("Note - Final")
    );
  };

  const getCategoryData = () => {
    if (!documentData?.finalisation || !activeCategory) {
      return [];
    }
    return documentData.finalisation[activeCategory] || [];
  };

  const formatCategoryName = (category) => {
    return category.replace(/_/g, " ");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
          py: 1.5,
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
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
            📄 {documentName}
          </Typography>
        </Box>
        <Chip
          label="Finalization Summary"
          color="primary"
          sx={{ fontWeight: 600, height: 28 }}
        />
      </Box>

      {/* Split Layout */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Left Sidebar - Collapsible */}
        <Paper
          elevation={0}
          sx={{
            width: sidebarOpen ? "280px" : "0px",
            minWidth: sidebarOpen ? "280px" : "0px",
            borderRight: sidebarOpen ? "1px solid #e0e0e0" : "none",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "all 0.3s ease",
          }}
        >
          <Box
            sx={{
              p: 1.5,
              bgcolor: "#0f62fe",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, fontSize: "0.95rem" }}
            >
              Categories
            </Typography>
            <Chip
              label={categories.length}
              size="small"
              sx={{
                bgcolor: "white",
                color: "#0f62fe",
                fontWeight: 700,
                height: 22,
              }}
            />
          </Box>

          <List sx={{ overflow: "auto", flex: 1, p: 1 }}>
            {categories.map((category, index) => (
              <React.Fragment key={category}>
                <ListItemButton
                  selected={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    py: 1,
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
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                </ListItemButton>
                {index < categories.length - 1 && <Divider sx={{ my: 0.5 }} />}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Toggle Sidebar Button - Small Size */}
        <IconButton
          onClick={toggleSidebar}
          size="small"
          sx={{
            position: "absolute",
            left: sidebarOpen ? "268px" : "0px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1000,
            bgcolor: "#0f62fe",
            color: "white",
            width: 24,
            height: 48,
            borderRadius: sidebarOpen ? "0 6px 6px 0" : "0 6px 6px 0",
            transition: "all 0.3s ease",
            "&:hover": {
              bgcolor: "#0353e9",
              width: 28,
            },
            "& .MuiSvgIcon-root": {
              fontSize: "1rem",
            },
          }}
        >
          {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>

        {/* Right Side - Tables */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            bgcolor: "#f8f9fa",
            p: 2,
            transition: "all 0.3s ease",
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
            <Paper
              elevation={2}
              sx={{
                p: 5,
                textAlign: "center",
                borderRadius: 2,
                border: "2px dashed #e0e0e0",
              }}
            >
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
