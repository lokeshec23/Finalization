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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FinalizationTable from "../components/FinalizationTable";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";

const FinalizationSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [documentData, setDocumentData] = useState(null);
  const [documentName, setDocumentName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completeDocument, setCompleteDocument] = useState(null);

  const [inputValue1, setInputValue1] = useState("");
  const [inputValue2, setInputValue2] = useState("");
  const [validationType, setValidationType] = useState("Address");
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (location.state?.documentData) {
      const data = location.state.documentData;
      const complete = location.state.completeDocument;

      console.log("📤 OUTPUT_DATA (for Summary):", data);
      console.log("📦 Complete Document:", complete);

      setDocumentData(data);
      setCompleteDocument(complete);
      setDocumentName(location.state.originalFileName || "Document");

      if (data.finalisation) {
        const cats = Object.keys(data.finalisation);
        console.log("📂 Categories from OUTPUT (raw_json):", cats);
        setCategories(cats);
        setActiveCategory(cats[0] || "");
      } else {
        console.warn("⚠️ No finalisation found in OUTPUT data!");
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

  const handleFilenameClick = (category, filename) => {
    console.log("🔍 Drilling down to INPUT:", { category, filename });

    const fetchedDoc = {
      input_data: completeDocument?.input_data,
      raw_json: completeDocument?.raw_json || documentData,
      original_bm_json: completeDocument?.original_bm_json,
      finalization_document_name: documentName,
      original_filename: location.state?.originalFileName || documentName,
    };

    console.log("📦 Passing to Finalization:", fetchedDoc);

    navigate("/finalization", {
      state: {
        viewMode: true,
        fetchedDocument: fetchedDoc,
        documentName: documentName,
        originalFileName: location.state?.originalFileName || documentName,
        drillDownCategory: category,
        drillDownFilename: filename,
      },
    });
  };

  const handleValidationCheck = async () => {
    if (!inputValue1.trim() || !inputValue2.trim()) {
      alert("Please enter both values");
      return;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      console.log("🔍 Validating:", {
        type: validationType,
        value1: inputValue1,
        value2: inputValue2,
      });

      const formData = new FormData();
      formData.append("value1", inputValue1.trim());
      formData.append("value2", inputValue2.trim());
      formData.append("match_type", validationType);

      const response = await axios.post(
        "http://127.0.0.1:8000/validate_property",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("✅ API Response:", response.data);
      setValidationResult(response.data.is_valid);
    } catch (error) {
      console.error("❌ Validation error:", error);
      alert(
        error.response?.data?.detail ||
          "Validation failed. Check console for details."
      );
    } finally {
      setValidating(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* <Header /> */}

      {/* Top Action Bar - Reduced spacing */}
      <Box
        sx={{
          px: 2,
          py: 0.75,
          bgcolor: "#fff",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        {/* First Row - Back Button & Document Name */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 0.75,
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            variant="outlined"
            size="small"
            sx={{
              textTransform: "none",
              py: 0.25,
              fontSize: "0.875rem",
            }}
          >
            Back
          </Button>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {documentName.split(".json")[0] || documentName}
          </Typography>
        </Box>

        {/* Second Row - Validation Inputs - Full Width Layout */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Left Side - 2 Large Text Boxes */}
          <Box sx={{ display: "flex", gap: 1, flex: 1, maxWidth: "80%" }}>
            <TextField
              size="small"
              placeholder="Enter value 1"
              value={inputValue1}
              onChange={(e) => setInputValue1(e.target.value)}
              sx={{
                flex: 1,
                "& .MuiInputBase-root": {
                  height: 32,
                  fontSize: "0.875rem",
                },
              }}
            />

            <TextField
              size="small"
              placeholder="Enter value 2"
              value={inputValue2}
              onChange={(e) => setInputValue2(e.target.value)}
              sx={{
                flex: 1,
                "& .MuiInputBase-root": {
                  height: 32,
                  fontSize: "0.875rem",
                },
              }}
            />
          </Box>

          {/* Right Side - Dropdown, Check Button, Result */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={validationType}
                onChange={(e) => setValidationType(e.target.value)}
                sx={{
                  height: 32,
                  fontSize: "0.875rem",
                }}
              >
                <MenuItem value="Address">Address</MenuItem>
                <MenuItem value="Name">Name</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              size="small"
              startIcon={<CheckCircleIcon />}
              onClick={handleValidationCheck}
              disabled={
                validating || !inputValue1.trim() || !inputValue2.trim()
              }
              sx={{
                bgcolor: "#0f62fe",
                textTransform: "none",
                fontWeight: 600,
                minWidth: 80,
                height: 32,
                fontSize: "0.875rem",
                "&:hover": {
                  bgcolor: "#0353e9",
                },
              }}
            >
              {validating ? "..." : "Check"}
            </Button>

            {validationResult !== null && (
              <Chip
                label={validationResult ? "TRUE" : "FALSE"}
                color={validationResult ? "success" : "error"}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  height: 24,
                  minWidth: 60,
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Split Layout - Reduced spacing */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Left Sidebar - Reduced spacing */}
        <Paper
          elevation={0}
          sx={{
            width: sidebarOpen ? "240px" : "0px",
            minWidth: sidebarOpen ? "240px" : "0px",
            borderRight: sidebarOpen ? "1px solid #e0e0e0" : "none",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "all 0.3s ease",
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              bgcolor: "#0f62fe",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, fontSize: "0.875rem" }}
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
                height: 18,
                fontSize: "0.7rem",
              }}
            />
          </Box>

          <List sx={{ overflow: "auto", flex: 1, p: 0.5 }}>
            {categories.map((category, index) => (
              <React.Fragment key={category}>
                <ListItemButton
                  selected={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.25,
                    py: 0.5,
                    px: 1.5,
                    minHeight: 32,
                    borderLeft:
                      activeCategory === category
                        ? "3px solid #0f62fe"
                        : "3px solid transparent",
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
                        fontSize: "0.8rem",
                        lineHeight: 1.2,
                      },
                    }}
                  />
                </ListItemButton>
                {index < categories.length - 1 && <Divider sx={{ my: 0.25 }} />}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Toggle Sidebar Button - Smaller */}
        <IconButton
          onClick={toggleSidebar}
          size="small"
          sx={{
            position: "absolute",
            left: sidebarOpen ? "230px" : "0px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1000,
            bgcolor: "#0f62fe",
            color: "white",
            width: 20,
            height: 40,
            borderRadius: sidebarOpen ? "0 4px 4px 0" : "0 4px 4px 0",
            transition: "all 0.3s ease",
            "&:hover": {
              bgcolor: "#0353e9",
              width: 24,
            },
            "& .MuiSvgIcon-root": {
              fontSize: "0.875rem",
            },
          }}
        >
          {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>

        {/* Right Side - Tables with Reduced spacing */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "#f8f9fa",
            p: 1,
            gap: 0,
            transition: "all 0.3s ease",
          }}
        >
          {/* First Table - Note Final */}
          <Box sx={{ flexShrink: 0 }}>
            <FinalizationTable
              data={finalNotes}
              title="Note Extraction - Final"
              categoryName="Note_Extraction"
              isDynamic={false}
              onFilenameClick={handleFilenameClick}
            />
          </Box>

          {/* Second Table - Selected Category */}
          {activeCategory && (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <FinalizationTable
                data={categoryData}
                title={`${formatCategoryName(activeCategory)}`}
                categoryName={activeCategory}
                isDynamic={true}
                onFilenameClick={handleFilenameClick}
              />
            </Box>
          )}

          {/* Empty State */}
          {!activeCategory && (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  textAlign: "center",
                  borderRadius: 2,
                  border: "2px dashed #e0e0e0",
                }}
              >
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Select a Category
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a category from the left to view output data
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default FinalizationSummary;
