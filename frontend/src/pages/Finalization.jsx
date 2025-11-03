import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  IconButton,
  Badge,
  Alert,
  LinearProgress,
} from "@mui/material";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DataViewer from "../components/DataViewer";
import NoteExtractionStatusModal from "../components/NoteExtractionStatusModal";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { documentAPI } from "../api/documentAPI";
import OriginalJsonModal from "../components/OriginalJsonModal";
import CodeIcon from "@mui/icons-material/Code";

const Finalization = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Batch upload states
  const [inputFolderPath, setInputFolderPath] = useState("");
  const [outputFolderPath, setOutputFolderPath] = useState("");
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // View mode states
  const [uploadedData, setUploadedData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [originalJsonModalOpen, setOriginalJsonModalOpen] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // ✅ Check if coming from Dashboard view
  useEffect(() => {
    if (location.state?.viewMode && location.state?.fetchedDocument) {
      const {
        fetchedDocument,
        documentName,
        originalFileName,
        drillDownCategory,
        drillDownFilename,
      } = location.state;

      console.log("📥 Viewing document from Dashboard:", fetchedDocument);

      const inputData = fetchedDocument.input_data?.finalisation
        ? { finalisation: fetchedDocument.input_data.finalisation }
        : fetchedDocument.raw_json;

      setUploadedData({
        documentName: documentName || "Document",
        originalFileName: originalFileName || "Document.json",
        input_data: inputData,
        raw_json: fetchedDocument.raw_json,
        original_bm_json: fetchedDocument.original_bm_json || {},
        drillDownFilename: drillDownFilename,
      });

      let cats = [];
      if (fetchedDocument.input_data?.finalisation) {
        cats = Object.keys(fetchedDocument.input_data.finalisation);
        console.log("📂 Categories from INPUT (input_data):", cats);
      } else if (fetchedDocument.raw_json?.finalisation) {
        cats = Object.keys(fetchedDocument.raw_json.finalisation);
        console.log("📂 Categories from OUTPUT (raw_json):", cats);
      }

      setCategories(cats);

      if (drillDownCategory && cats.includes(drillDownCategory)) {
        console.log("🎯 Drill-down to category:", drillDownCategory);
        setActiveCategory(drillDownCategory);
      } else {
        setActiveCategory(cats[0] || "");
      }
    }
  }, [location.state]);

  // Batch upload handler
  const handleBatchUpload = async () => {
    if (!inputFolderPath.trim() || !outputFolderPath.trim()) {
      alert("Please enter both folder paths");
      return;
    }

    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");

    if (!username || !email) {
      alert("User credentials not found. Please login again.");
      return;
    }

    setBatchProcessing(true);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append("input_folder_path", inputFolderPath.trim());
      formData.append("output_folder_path", outputFolderPath.trim());
      formData.append("username", username);
      formData.append("email", email);

      setUploadProgress(40);

      const res = await axios.post(
        "http://127.0.0.1:8000/batch_process",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setUploadProgress(95);

      console.log("✅ Batch process success:", res.data);

      alert(
        `Batch processing completed!\n\n` +
          `✅ Successful: ${res.data.summary.successful}\n` +
          `❌ Failed: ${res.data.summary.failed}\n` +
          `⏭️ Skipped: ${res.data.summary.skipped}`
      );

      window.dispatchEvent(new Event("documentUploaded"));

      setInputFolderPath("");
      setOutputFolderPath("");

      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Batch process failed:", err);
      alert(
        err.response?.data?.detail || "Batch processing failed. Check console."
      );
    } finally {
      setUploadProgress(100);
      setTimeout(() => {
        setBatchProcessing(false);
        setUploadProgress(0);
      }, 300);
    }
  };

  // ✅ Count final notes from input_data (if available)
  const finalNotesCount =
    uploadedData?.input_data?.finalisation?.Note_Extraction?.filter((item) =>
      item.status?.includes("Note - Final")
    ).length || 0;

  // ✅ If data is uploaded, show split view with INPUT data
  if (uploadedData) {
    const categoryData =
      uploadedData.input_data?.finalisation?.[activeCategory] || [];

    console.log(
      "📊 Displaying INPUT data for category:",
      activeCategory,
      categoryData
    );

    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Top Action Bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            borderBottom: "1px solid #e0e0e0",
            bgcolor: "#fafafa",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/dashboard")}
              variant="outlined"
              size="small"
              sx={{ textTransform: "none" }}
            >
              Back to Dashboard
            </Button>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {uploadedData.originalFileName.split("_final.json")[0] ||
                  uploadedData.originalFileName}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CodeIcon />}
              onClick={() => setOriginalJsonModalOpen(true)}
              sx={{
                textTransform: "none",
                borderColor: "#0f62fe",
                color: "#0f62fe",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#0353e9",
                  bgcolor: "#e3f2fd",
                },
              }}
            >
              Show Original JSON
            </Button>

            <Button
              variant="contained"
              size="small"
              onClick={() => {
                navigate("/finalization/summary", {
                  state: {
                    documentData: uploadedData.raw_json,
                    completeDocument: uploadedData,
                    originalFileName: uploadedData.originalFileName,
                    documentName: uploadedData.documentName,
                  },
                });
              }}
              sx={{
                textTransform: "none",
                bgcolor: "#0f62fe",
                "&:hover": { bgcolor: "#0353e9" },
              }}
            >
              Show Finalization
            </Button>

            {finalNotesCount > 0 && (
              <>
                <IconButton
                  color="primary"
                  onClick={() => setStatusModalOpen(true)}
                  sx={{
                    bgcolor: "#e3f2fd",
                    "&:hover": { bgcolor: "#bbdefb" },
                  }}
                >
                  <Badge badgeContent={finalNotesCount} color="error">
                    <AssignmentTurnedInIcon />
                  </Badge>
                </IconButton>
                <Typography variant="body2" color="text.secondary">
                  Note Status
                </Typography>
              </>
            )}
          </Box>
        </Box>

        {/* Split Layout */}
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <Box
            sx={{
              width: "25%",
              minWidth: 250,
              maxWidth: 350,
              borderRight: "1px solid #e0e0e0",
              overflow: "auto",
              bgcolor: "#fff",
            }}
          >
            <Sidebar
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </Box>

          <Box sx={{ width: "75%", overflow: "auto", bgcolor: "#f5f5f5" }}>
            <DataViewer
              categoryData={categoryData}
              categoryName={activeCategory}
              selectedFilename={uploadedData?.drillDownFilename}
              onTabChange={setActiveTabIndex}
            />
          </Box>
        </Box>

        {finalNotesCount > 0 && (
          <NoteExtractionStatusModal
            open={statusModalOpen}
            onClose={() => setStatusModalOpen(false)}
            data={uploadedData?.input_data}
          />
        )}

        <OriginalJsonModal
          open={originalJsonModalOpen}
          onClose={() => setOriginalJsonModalOpen(false)}
          jsonData={
            uploadedData?.original_bm_json?.[activeCategory]?.[activeTabIndex]
              ?.data
          }
          filename={
            uploadedData?.original_bm_json?.[activeCategory]?.[activeTabIndex]
              ?.filename || "Unknown"
          }
          category={activeCategory}
        />
      </Box>
    );
  }

  // ✅ Batch Upload Form View
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 64px)",
          bgcolor: "#f5f7fa",
          p: 3,
        }}
      >
        <Paper
          elevation={4}
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 700,
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#0f62fe",
                mb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 32 }} />
              Batch Upload Finalization
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Process multiple ZIP files with their corresponding final JSONs
            </Typography>
          </Box>

          {/* Upload Progress */}
          {batchProcessing && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  bgcolor: "#e0e0e0",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: "#0f62fe",
                  },
                }}
              />
              <Typography
                variant="body2"
                align="center"
                sx={{ mt: 1, fontWeight: 600, color: "#0f62fe" }}
              >
                Processing batch... {uploadProgress}%
              </Typography>
            </Box>
          )}

          {/* Info Alert */}
          {/* <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              📋 Batch Upload Process:
            </Typography>
            <Typography variant="body2">
              • Input folder contains ZIP files (e.g., loan_app_1.zip)
            </Typography>
            <Typography variant="body2">
              • Output folder contains final JSONs (e.g., loan_app_1_final.json)
            </Typography>
            <Typography variant="body2">
              • System will automatically match and process all files
            </Typography>
          </Alert> */}

          {/* Input Folder Path */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 600, color: "#333" }}
            >
              Input Folder Path (ZIP Files)
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g., C:\batch\input_zips or /server/batch/input_zips"
              value={inputFolderPath}
              onChange={(e) => setInputFolderPath(e.target.value)}
              variant="outlined"
              disabled={batchProcessing}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                },
              }}
              InputProps={{
                startAdornment: (
                  <Typography sx={{ mr: 1, color: "#666" }}>📁</Typography>
                ),
              }}
            />
          </Box>

          {/* Output Folder Path */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 600, color: "#333" }}
            >
              Output Folder Path (Final JSONs)
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g., C:\batch\output_jsons or /server/batch/output_jsons"
              value={outputFolderPath}
              onChange={(e) => setOutputFolderPath(e.target.value)}
              variant="outlined"
              disabled={batchProcessing}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                },
              }}
              InputProps={{
                startAdornment: (
                  <Typography sx={{ mr: 1, color: "#666" }}>📄</Typography>
                ),
              }}
            />
          </Box>

          {/* Process Button */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<CloudUploadIcon />}
            onClick={handleBatchUpload}
            disabled={
              batchProcessing ||
              !inputFolderPath.trim() ||
              !outputFolderPath.trim()
            }
            sx={{
              py: 1.8,
              bgcolor: "#0f62fe",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "1rem",
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(15, 98, 254, 0.3)",
              "&:hover": {
                bgcolor: "#0353e9",
                boxShadow: "0 6px 16px rgba(15, 98, 254, 0.4)",
              },
              "&:disabled": {
                bgcolor: "#e0e0e0",
                color: "#999",
              },
            }}
          >
            {batchProcessing ? "Processing Batch..." : "Process Batch Upload"}
          </Button>

          {/* Cancel Button */}
          <Button
            variant="text"
            fullWidth
            onClick={() => navigate("/dashboard")}
            disabled={batchProcessing}
            sx={{
              mt: 2,
              textTransform: "none",
              color: "#666",
              "&:hover": {
                bgcolor: "#f5f5f5",
              },
            }}
          >
            Cancel & Return to Dashboard
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default Finalization;
