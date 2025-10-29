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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
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
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

const Finalization = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Upload mode state
  const [uploadMode, setUploadMode] = useState(0); // 0 = Single File, 1 = Folder

  // Single file upload states
  const [docName, setDocName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // Folder upload states
  const [folderDocName, setFolderDocName] = useState("");
  const [inputFiles, setInputFiles] = useState([]);
  const [outputFile, setOutputFile] = useState(null);

  // Common states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedData, setUploadedData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Check if coming from Dashboard view
  useEffect(() => {
    if (location.state?.viewMode && location.state?.documentData) {
      const { documentData, documentName, originalFileName } = location.state;

      setUploadedData({
        documentName: documentName || "Document",
        originalFileName: originalFileName || "Document.json",
        raw_json: documentData,
      });

      if (documentData.finalisation) {
        const cats = Object.keys(documentData.finalisation);
        setCategories(cats);
        setActiveCategory(cats[0] || "");
      }
    }
  }, [location.state]);

  // Single file handlers
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      alert("Only JSON files are allowed!");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleSingleFileUpload = async () => {
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
    setUploadProgress(10);

    const fileReader = new FileReader();

    fileReader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        setUploadProgress(30);

        const formData = new FormData();
        formData.append("username", username);
        formData.append("email", email);
        formData.append("finalization_document_name", docName.trim());
        formData.append("json_file", selectedFile);

        const res = await axios.post(
          "http://127.0.0.1:8000/upload_json",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                30 + (progressEvent.loaded * 70) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            },
          }
        );

        console.log("✅ Upload success:", res.data);
        alert("File uploaded successfully!");

        setUploadedData({
          documentName: docName.trim(),
          originalFileName: selectedFile.name,
          raw_json: jsonData,
        });

        if (jsonData.finalisation) {
          const cats = Object.keys(jsonData.finalisation);
          setCategories(cats);
          setActiveCategory(cats[0] || "");
        }

        // Refresh dashboard
        window.dispatchEvent(new Event("documentUploaded"));
      } catch (err) {
        console.error("❌ Upload failed:", err);
        alert(err.response?.data?.detail || "Upload failed. Check console.");
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    };

    fileReader.onerror = () => {
      alert("Failed to read file");
      setUploading(false);
      setUploadProgress(0);
    };

    fileReader.readAsText(selectedFile);
  };

  // Folder upload handlers
  const handleInputFolderSelect = (e) => {
    const files = Array.from(e.target.files);
    setInputFiles(files);

    // Auto-extract document name from folder
    if (!folderDocName && files.length > 0) {
      const path = files[0].webkitRelativePath;
      const parts = path.split("/");
      if (parts.length >= 2) {
        setFolderDocName(parts[1]);
      }
    }
  };

  const handleOutputFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith(".json")) {
      setOutputFile(file);

      if (!folderDocName) {
        const extractedName = file.name.replace("_final.json", "");
        setFolderDocName(extractedName);
      }
    } else {
      alert("Please select a valid JSON file");
    }
  };

  const handleFolderUpload = async () => {
    if (!folderDocName.trim()) {
      alert("Please enter a document name");
      return;
    }

    if (inputFiles.length === 0) {
      alert("Please select input folder");
      return;
    }

    if (!outputFile) {
      alert("Please select output file");
      return;
    }

    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");

    if (!username || !email) {
      alert("User credentials not found. Please login again.");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("finalization_document_name", folderDocName.trim());

      inputFiles.forEach((file) => {
        formData.append(
          "input_files",
          file,
          file.webkitRelativePath || file.name
        );
      });

      formData.append("output_file", outputFile);

      setUploadProgress(30);

      const res = await axios.post(
        "http://127.0.0.1:8000/upload_json",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              30 + (progressEvent.loaded * 70) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      console.log("✅ Folder upload success:", res.data);
      alert("Folder uploaded successfully!");

      // Parse output file to show data
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);

          setUploadedData({
            documentName: folderDocName.trim(),
            originalFileName: outputFile.name,
            raw_json: jsonData,
          });

          if (jsonData.finalisation) {
            const cats = Object.keys(jsonData.finalisation);
            setCategories(cats);
            setActiveCategory(cats[0] || "");
          }
        } catch (err) {
          console.error("Error parsing output file:", err);
        }
      };
      reader.readAsText(outputFile);

      // Reset form
      setFolderDocName("");
      setInputFiles([]);
      setOutputFile(null);
      document.getElementById("input-folder").value = "";
      document.getElementById("output-file-input").value = "";

      // Refresh dashboard
      window.dispatchEvent(new Event("documentUploaded"));
    } catch (err) {
      console.error("❌ Folder upload failed:", err);
      alert(err.response?.data?.detail || "Upload failed. Check console.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleReset = () => {
    setDocName("");
    setSelectedFile(null);
    setFolderDocName("");
    setInputFiles([]);
    setOutputFile(null);
    setUploadedData(null);
    setCategories([]);
    setActiveCategory("");
    setStatusModalOpen(false);

    const singleInput = document.getElementById("file-input");
    const inputFolder = document.getElementById("input-folder");
    const outputInput = document.getElementById("output-file-input");

    if (singleInput) singleInput.value = "";
    if (inputFolder) inputFolder.value = "";
    if (outputInput) outputInput.value = "";
  };

  const finalNotesCount =
    uploadedData?.raw_json?.finalisation?.Note_Extraction?.filter((item) =>
      item.status?.includes("Note - Final")
    ).length || 0;

  // Group files by category for folder upload
  const filesByCategory = inputFiles.reduce((acc, file) => {
    const path = file.webkitRelativePath || file.name;
    const parts = path.split("/");
    const category = parts.length >= 3 ? parts[2] : "Uncategorized";

    if (!acc[category]) acc[category] = [];
    acc[category].push(file.name);
    return acc;
  }, {});

  // If data is uploaded, show split view
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

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                navigate("/finalization/summary", {
                  state: {
                    documentData: uploadedData.raw_json,
                    originalFileName: uploadedData.originalFileName,
                    documentName: uploadedData.documentName,
                  },
                });
              }}
              sx={{
                textTransform: "none",
                bgcolor: "#28a745",
                "&:hover": { bgcolor: "#218838" },
              }}
            >
              View Finalization
            </Button>

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
              Note Extraction Status
            </Typography>
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
            />
          </Box>
        </Box>

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
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Paper sx={{ p: 4, width: 600 }}>
          <Typography variant="h5" mb={3} sx={{ fontWeight: 600 }}>
            Upload Finalization Document
          </Typography>

          {/* Upload Mode Tabs */}
          <Tabs
            value={uploadMode}
            onChange={(e, newValue) => setUploadMode(newValue)}
            sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Single JSON File" sx={{ textTransform: "none" }} />
            <Tab label="Folder Structure" sx={{ textTransform: "none" }} />
          </Tabs>

          {/* Upload Progress */}
          {uploading && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
          )}

          {/* Single File Upload Form */}
          {uploadMode === 0 && (
            <Box>
              <TextField
                label="Document Name"
                fullWidth
                margin="normal"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
              />

              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mt: 2, textTransform: "none", py: 1.5 }}
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
                startIcon={<CloudUploadIcon />}
                sx={{
                  mt: 2,
                  bgcolor: "#0f62fe",
                  textTransform: "none",
                  py: 1.5,
                }}
                disabled={uploading || !selectedFile}
                onClick={handleSingleFileUpload}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </Box>
          )}

          {/* Folder Upload Form */}
          {uploadMode === 1 && (
            <Box>
              <TextField
                label="Document Name"
                fullWidth
                margin="normal"
                value={folderDocName}
                onChange={(e) => setFolderDocName(e.target.value)}
                helperText="Auto-extracted from folder/file name"
              />

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  1. Select Input Folder
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<FolderOpenIcon />}
                  sx={{ textTransform: "none", py: 1.5 }}
                >
                  {inputFiles.length > 0
                    ? `${inputFiles.length} files selected`
                    : "Choose Input Folder"}
                  <input
                    id="input-folder"
                    type="file"
                    hidden
                    webkitdirectory="true"
                    directory="true"
                    multiple
                    onChange={handleInputFolderSelect}
                  />
                </Button>

                {inputFiles.length > 0 && (
                  <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
                    {inputFiles.length} files from{" "}
                    {Object.keys(filesByCategory).length} categories
                  </Alert>
                )}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  2. Select Output File (final.json)
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<FolderOpenIcon />}
                  sx={{ textTransform: "none", py: 1.5 }}
                >
                  {outputFile ? outputFile.name : "Choose Output File"}
                  <input
                    id="output-file-input"
                    type="file"
                    hidden
                    accept=".json"
                    onChange={handleOutputFileSelect}
                  />
                </Button>
              </Box>

              <Button
                variant="contained"
                fullWidth
                startIcon={<CloudUploadIcon />}
                onClick={handleFolderUpload}
                disabled={uploading || inputFiles.length === 0 || !outputFile}
                sx={{
                  mt: 3,
                  bgcolor: "#0f62fe",
                  textTransform: "none",
                  py: 1.5,
                }}
              >
                {uploading ? "Uploading..." : "Upload Folder"}
              </Button>
            </Box>
          )}

          <Button
            variant="text"
            fullWidth
            onClick={() => navigate("/dashboard")}
            sx={{ mt: 1, textTransform: "none" }}
          >
            Cancel
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default Finalization;
