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
import { documentAPI } from "../api/documentAPI";

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

  // ✅ Check if coming from Dashboard view
  useEffect(() => {
    if (location.state?.viewMode && location.state?.fetchedDocument) {
      const {
        fetchedDocument,
        documentName,
        originalFileName,
        drillDownCategory, // ✅ NEW
        drillDownFilename, // ✅ NEW
      } = location.state;

      console.log("📥 Viewing document from Dashboard:", fetchedDocument);

      // ✅ Determine which data to show (input_data or raw_json)
      const inputData = fetchedDocument.input_data?.finalisation
        ? { finalisation: fetchedDocument.input_data.finalisation }
        : fetchedDocument.raw_json;

      setUploadedData({
        documentName: documentName || "Document",
        originalFileName: originalFileName || "Document.json",
        input_data: inputData,
        raw_json: fetchedDocument.raw_json,
        drillDownFilename: drillDownFilename, // ✅ Pass to DataViewer
      });

      // ✅ Extract categories from input_data or raw_json
      let cats = [];
      if (fetchedDocument.input_data?.finalisation) {
        cats = Object.keys(fetchedDocument.input_data.finalisation);
        console.log("📂 Categories from INPUT (input_data):", cats);
      } else if (fetchedDocument.raw_json?.finalisation) {
        cats = Object.keys(fetchedDocument.raw_json.finalisation);
        console.log("📂 Categories from OUTPUT (raw_json):", cats);
      }

      setCategories(cats);

      // ✅ Set active category based on drill-down or default
      if (drillDownCategory && cats.includes(drillDownCategory)) {
        console.log("🎯 Drill-down to category:", drillDownCategory);
        setActiveCategory(drillDownCategory);
      } else {
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

        console.log("✅ Single file upload success:", res.data);
        alert("File uploaded successfully!");

        // ✅ FIX: Fetch uploaded document and display it
        const uploadedDoc = await documentAPI.getDocumentById(
          res.data.inserted_id
        );

        console.log("📥 Fetched uploaded document:", uploadedDoc);

        // ✅ Set uploaded data to display INPUT
        setUploadedData({
          documentName: uploadedDoc.finalization_document_name || "Document",
          originalFileName: uploadedDoc.original_filename || "Document.json",
          input_data: uploadedDoc.raw_json, // For single file, raw_json is the data
          raw_json: uploadedDoc.raw_json, // For summary view
        });

        // ✅ Extract categories from raw_json.finalisation
        if (uploadedDoc.raw_json?.finalisation) {
          const cats = Object.keys(uploadedDoc.raw_json.finalisation);
          console.log("📂 Categories extracted:", cats);
          setCategories(cats);
          setActiveCategory(cats[0] || "");
        }

        // Notify dashboard in background
        window.dispatchEvent(new Event("documentUploaded"));

        // ✅ Reset upload form
        setDocName("");
        setSelectedFile(null);
        document.getElementById("file-input").value = "";
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

    // ✅ Auto-extract folder name and set it
    if (files.length > 0) {
      const path = files[0].webkitRelativePath;
      const parts = path.split("/");
      if (parts.length >= 2) {
        const extractedFolderName = parts[1]; // Second part is the folder name
        setFolderDocName(extractedFolderName);
        console.log("📁 Auto-extracted folder name:", extractedFolderName);
      }
    }
  };

  const handleOutputFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith(".json")) {
      setOutputFile(file);

      // ✅ Only extract from filename if no name set yet
      if (!folderDocName) {
        const extractedName = file.name
          .replace("_final.json", "")
          .replace(".json", "");
        setFolderDocName(extractedName);
        console.log("📄 Auto-extracted from filename:", extractedName);
      }
    } else {
      alert("Please select a valid JSON file");
    }
  };

  const handleFolderUpload = async () => {
    // ✅ Auto-extract document name if user didn't enter one
    let finalDocName = folderDocName.trim();

    if (!finalDocName && inputFiles.length > 0) {
      const path = inputFiles[0].webkitRelativePath;
      const parts = path.split("/");
      if (parts.length >= 2) {
        finalDocName = parts[1]; // Use folder name
        console.log("📁 Using auto-extracted folder name:", finalDocName);
      }
    }

    if (!finalDocName && outputFile) {
      finalDocName = outputFile.name
        .replace("_final.json", "")
        .replace(".json", "");
      console.log("📄 Using filename as document name:", finalDocName);
    }

    if (!finalDocName) {
      finalDocName = "Document"; // Final fallback
      console.log("📝 Using default name: Document");
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
      formData.append("finalization_document_name", finalDocName); // ✅ Use auto-extracted or entered name

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

      // ✅ FIX: Fetch the uploaded document and display it
      const uploadedDoc = await documentAPI.getDocumentById(
        res.data.inserted_id
      );

      console.log("📥 Fetched uploaded document:", uploadedDoc);

      // ✅ Set uploaded data to display INPUT data
      setUploadedData({
        documentName: uploadedDoc.finalization_document_name || "Document",
        originalFileName: uploadedDoc.original_filename || "Document.json",
        input_data: uploadedDoc.input_data?.finalisation
          ? { finalisation: uploadedDoc.input_data.finalisation }
          : uploadedDoc.raw_json,
        raw_json: uploadedDoc.raw_json,
      });

      // ✅ Extract categories from INPUT data
      if (uploadedDoc.input_data?.finalisation) {
        const cats = Object.keys(uploadedDoc.input_data.finalisation);
        console.log("📂 Categories from INPUT:", cats);
        setCategories(cats);
        setActiveCategory(cats[0] || "");
      } else if (uploadedDoc.raw_json?.finalisation) {
        const cats = Object.keys(uploadedDoc.raw_json.finalisation);
        console.log("📂 Categories from OUTPUT:", cats);
        setCategories(cats);
        setActiveCategory(cats[0] || "");
      }

      // Notify dashboard in background
      window.dispatchEvent(new Event("documentUploaded"));

      // ✅ Reset folder upload form
      setFolderDocName("");
      setInputFiles([]);
      setOutputFile(null);
      document.getElementById("input-folder").value = "";
      document.getElementById("output-file-input").value = "";
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

  // ✅ Count final notes from input_data (if available)
  const finalNotesCount =
    uploadedData?.input_data?.finalisation?.Note_Extraction?.filter((item) =>
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

  // ✅ If data is uploaded, show split view with INPUT data
  if (uploadedData) {
    // ✅ IMPORTANT: Use input_data.finalisation (INPUT data)
    const categoryData =
      uploadedData.input_data?.finalisation?.[activeCategory] || [];

    console.log(
      "📊 Displaying INPUT data for category:",
      activeCategory,
      categoryData
    );

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
                sx={{ fontWeight: 600, color: "#28a745" }}
              >
                📁
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {uploadedData.originalFileName}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* INPUT DATA Indicator */}
            <Alert severity="success" sx={{ py: 0, px: 1 }}>
              INPUT DATA
            </Alert>

            <Button
              variant="contained"
              size="small"
              onClick={() => {
                navigate("/finalization/summary", {
                  state: {
                    documentData: uploadedData.raw_json, // ✅ CORRECT - This is OUTPUT data
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
              View Output Summary
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
              selectedFilename={uploadedData?.drillDownFilename} // ✅ ADD THIS
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
            <Tab
              label="Single JSON File (Output)"
              sx={{ textTransform: "none" }}
            />
            <Tab
              label="Folder Structure (Input + Output)"
              sx={{ textTransform: "none" }}
            />
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
              <Alert severity="info" sx={{ mb: 2 }}>
                Upload a single output JSON file with finalisation structure
              </Alert>

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
              <Alert severity="info" sx={{ mb: 2 }}>
                Upload input folder + output file. View input data here, output
                via summary.
              </Alert>

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
