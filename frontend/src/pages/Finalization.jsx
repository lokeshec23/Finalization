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
} from "@mui/material";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DataViewer from "../components/DataViewer";
import NoteExtractionStatusModal from "../components/NoteExtractionStatusModal";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

const Finalization = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [docName, setDocName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // State for uploaded JSON data
  const [uploadedData, setUploadedData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");

  // Modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // ✅ Check if coming from Dashboard view
  useEffect(() => {
    if (location.state?.viewMode && location.state?.documentData) {
      const { documentData, documentName, originalFileName } = location.state;

      setUploadedData({
        documentName: documentName || "Document",
        originalFileName: originalFileName || "Document.json",
        raw_json: documentData,
      });

      // Extract categories
      if (documentData.finalisation) {
        const cats = Object.keys(documentData.finalisation);
        setCategories(cats);
        setActiveCategory(cats[0] || "");
      }
    }
  }, [location.state]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    if (!file.name.endsWith(".json")) {
      alert("Only JSON files are allowed!");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");

    if (!docName.trim()) {
      alert("Please enter a document name");
      return;
    }

    if (!username || !email) {
      alert("User credentials not found. Please login again.");
      return;
    }

    setUploading(true);

    // Read the JSON file to store in state
    const fileReader = new FileReader();

    fileReader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);

        // Upload to backend
        const formData = new FormData();
        formData.append("username", username);
        formData.append("email", email);
        formData.append("finalization_document_name", docName.trim());
        formData.append("json_file", selectedFile);

        const res = await axios.post(
          "http://127.0.0.1:8000/upload_json",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("✅ Upload success:", res.data);
        alert("File uploaded successfully!");

        // Set the uploaded data to state
        setUploadedData({
          documentName: docName.trim(),
          originalFileName: selectedFile.name,
          raw_json: jsonData,
        });

        // Extract categories
        if (jsonData.finalisation) {
          const cats = Object.keys(jsonData.finalisation);
          setCategories(cats);
          setActiveCategory(cats[0] || "");
        }
      } catch (err) {
        console.error("❌ Upload failed:", err);
        const errorMsg =
          err.response?.data?.detail || "Upload failed. Check console.";
        alert(errorMsg);
      } finally {
        setUploading(false);
      }
    };

    fileReader.onerror = () => {
      alert("Failed to read file");
      setUploading(false);
    };

    fileReader.readAsText(selectedFile);
  };

  const handleReset = () => {
    setDocName("");
    setSelectedFile(null);
    setUploadedData(null);
    setCategories([]);
    setActiveCategory("");
    setStatusModalOpen(false);
    if (document.getElementById("file-input")) {
      document.getElementById("file-input").value = "";
    }
  };

  // Count final notes
  const finalNotesCount =
    uploadedData?.raw_json?.finalisation?.Note_Extraction?.filter(
      (item) => item.status && item.status.includes("Note - Final")
    ).length || 0;

  // If data is uploaded or in view mode, show split view
  if (uploadedData) {
    const categoryData =
      uploadedData.raw_json?.finalisation?.[activeCategory] || [];

    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <Header />

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

            {/* Display original JSON filename */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "#0f62fe" }}
              >
                📄
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {uploadedData.originalFileName}
              </Typography>
            </Box>
          </Box>

          {/* Note Extraction Status Button */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              color="primary"
              onClick={() => setStatusModalOpen(true)}
              sx={{
                bgcolor: "#e3f2fd",
                "&:hover": {
                  bgcolor: "#bbdefb",
                },
              }}
            >
              <Badge badgeContent={finalNotesCount} color="error">
                <AssignmentTurnedInIcon />
              </Badge>
            </IconButton>
            {/* <Typography variant="body2" color="text.secondary">
              Note Extraction Status
            </Typography> */}
          </Box>
        </Box>

        {/* Split Layout - Full Screen */}
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left Sidebar - 25% width */}
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

          {/* Right Content - 75% width */}
          <Box
            sx={{
              width: "75%",
              overflow: "auto",
              bgcolor: "#f5f5f5",
            }}
          >
            <DataViewer
              categoryData={categoryData}
              categoryName={activeCategory}
            />
          </Box>
        </Box>

        {/* Note Extraction Status Modal */}
        <NoteExtractionStatusModal
          open={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          data={uploadedData?.raw_json}
        />
      </Box>
    );
  }

  // Upload form view
  return (
    <Box>
      <Header />
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <Paper sx={{ p: 4, width: 400 }}>
          <Typography variant="h6" mb={2}>
            Upload Finalization Document
          </Typography>

          <TextField
            label="Finalization Document Name"
            fullWidth
            margin="normal"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
          />

          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mt: 2, textTransform: "none" }}
          >
            {selectedFile ? selectedFile.name : "Choose JSON File"}
            <input
              id="file-input"
              type="file"
              hidden
              accept=".json,application/json"
              onChange={handleFileSelect}
            />
          </Button>

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2, bgcolor: "#0f62fe", textTransform: "none" }}
            disabled={uploading || !selectedFile}
            onClick={handleUpload}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>

          <Button
            variant="text"
            fullWidth
            sx={{ mt: 1, textTransform: "none" }}
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default Finalization;
