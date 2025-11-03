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
  Chip,
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
import OriginalJsonModal from "../components/OriginalJsonModal";
import CodeIcon from "@mui/icons-material/Code";

const Finalization = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Upload mode state
  // const [uploadMode, setUploadMode] = useState(0); // 0 = Single File, 1 = Folder

  // Single file upload states
  // const [docName, setDocName] = useState("");
  // const [selectedFile, setSelectedFile] = useState(null);

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
  const [originalJsonModalOpen, setOriginalJsonModalOpen] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Add new state for batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [inputFolderPath, setInputFolderPath] = useState("");
  const [outputFolderPath, setOutputFolderPath] = useState("");
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

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
        original_bm_json: fetchedDocument.original_bm_json || {}, // ✅ NEW
        drillDownFilename: drillDownFilename,
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
  // const handleFileSelect = (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   if (!file.name.endsWith(".json")) {
  //     alert("Only JSON files are allowed!");
  //     e.target.value = "";
  //     return;
  //   }

  //   setSelectedFile(file);
  // };

  // const handleSingleFileUpload = async () => {
  //   if (!selectedFile) {
  //     alert("Please select a file");
  //     return;
  //   }

  //   const username = localStorage.getItem("username");
  //   const email = localStorage.getItem("email");

  //   if (!docName.trim()) {
  //     alert("Please enter a document name");
  //     return;
  //   }

  //   if (!username || !email) {
  //     alert("User credentials not found. Please login again.");
  //     return;
  //   }

  //   setUploading(true);
  //   setUploadProgress(10);

  //   const fileReader = new FileReader();

  //   fileReader.onload = async (event) => {
  //     try {
  //       const jsonData = JSON.parse(event.target.result);
  //       setUploadProgress(30);

  //       const formData = new FormData();
  //       formData.append("username", username);
  //       formData.append("email", email);
  //       formData.append("finalization_document_name", docName.trim());
  //       formData.append("json_file", selectedFile);

  //       const res = await axios.post(
  //         "http://127.0.0.1:8000/upload_json",
  //         formData,
  //         {
  //           headers: { "Content-Type": "multipart/form-data" },
  //           onUploadProgress: (progressEvent) => {
  //             const percentCompleted = Math.round(
  //               30 + (progressEvent.loaded * 70) / progressEvent.total
  //             );
  //             setUploadProgress(percentCompleted);
  //           },
  //         }
  //       );

  //       console.log("✅ Single file upload success:", res.data);
  //       alert("File uploaded successfully!");

  //       // ✅ FIX: Fetch uploaded document and display it
  //       const uploadedDoc = await documentAPI.getDocumentById(
  //         res.data.inserted_id
  //       );

  //       console.log("📥 Fetched uploaded document:", uploadedDoc);

  //       // ✅ Set uploaded data to display INPUT
  //       setUploadedData({
  //         documentName: uploadedDoc.finalization_document_name || "Document",
  //         originalFileName: uploadedDoc.original_filename || "Document.json",
  //         input_data: uploadedDoc.raw_json, // For single file, raw_json is the data
  //         raw_json: uploadedDoc.raw_json, // For summary view
  //       });

  //       // ✅ Extract categories from raw_json.finalisation
  //       if (uploadedDoc.raw_json?.finalisation) {
  //         const cats = Object.keys(uploadedDoc.raw_json.finalisation);
  //         console.log("📂 Categories extracted:", cats);
  //         setCategories(cats);
  //         setActiveCategory(cats[0] || "");
  //       }

  //       // Notify dashboard in background
  //       window.dispatchEvent(new Event("documentUploaded"));

  //       // ✅ Reset upload form
  //       setDocName("");
  //       setSelectedFile(null);
  //       document.getElementById("file-input").value = "";
  //     } catch (err) {
  //       console.error("❌ Upload failed:", err);
  //       alert(err.response?.data?.detail || "Upload failed. Check console.");
  //     } finally {
  //       setUploading(false);
  //       setUploadProgress(0);
  //     }
  //   };

  //   fileReader.onerror = () => {
  //     alert("Failed to read file");
  //     setUploading(false);
  //     setUploadProgress(0);
  //   };

  //   fileReader.readAsText(selectedFile);
  // };

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
        // setFolderDocName(extractedFolderName);
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
        original_bm_json: uploadedDoc.original_bm_json || {}, // ✅ NEW
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
    setFolderDocName("");
    setInputFiles([]);
    setOutputFile(null);
    setUploadedData(null);
    setCategories([]);
    setActiveCategory("");
    setStatusModalOpen(false);

    const inputFolder = document.getElementById("input-folder");
    const outputInput = document.getElementById("output-file-input");

    if (inputFolder) inputFolder.value = "";
    if (outputInput) outputInput.value = "";
  };

  // Add batch upload handler
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
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("input_folder_path", inputFolderPath.trim());
      formData.append("output_folder_path", outputFolderPath.trim());
      formData.append("username", username);
      formData.append("email", email);

      setUploadProgress(30);

      const res = await axios.post(
        "http://127.0.0.1:8000/batch_process",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("✅ Batch process success:", res.data);

      setBatchResult(res.data);

      alert(
        `Batch processing completed!\n\n` +
          `✅ Successful: ${res.data.summary.successful}\n` +
          `❌ Failed: ${res.data.summary.failed}\n` +
          `⏭️ Skipped: ${res.data.summary.skipped}`
      );

      // Notify dashboard to refresh
      window.dispatchEvent(new Event("documentUploaded"));

      // Reset form
      setInputFolderPath("");
      setOutputFolderPath("");
      setBatchResult(null);

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Batch process failed:", err);
      alert(
        err.response?.data?.detail || "Batch processing failed. Check console."
      );
    } finally {
      setBatchProcessing(false);
      setUploadProgress(0);
    }
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
        {/* <Header /> */}

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
              ></Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {uploadedData.originalFileName.split("_final.json")[0] ||
                  uploadedData.originalFileName}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* INPUT DATA Indicator */}
            {/* Show Original JSON Button */}
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
                    documentData: uploadedData.raw_json, // OUTPUT for display
                    completeDocument: uploadedData, // ✅ Complete data including input_data
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
              selectedFilename={uploadedData?.drillDownFilename} // ✅ ADD THIS
              onTabChange={setActiveTabIndex} // ✅ NEW
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

        {/* Original JSON Modal */}
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

  // Upload form view
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
              Upload Finalization Document
            </Typography>
          </Box>

          {/* Mode Toggle */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant={!batchMode ? "contained" : "outlined"}
                onClick={() => setBatchMode(false)}
                fullWidth
                sx={{
                  textTransform: "none",
                  bgcolor: !batchMode ? "#0f62fe" : "transparent",
                }}
              >
                Single Upload
              </Button>
              <Button
                variant={batchMode ? "contained" : "outlined"}
                onClick={() => setBatchMode(true)}
                fullWidth
                sx={{
                  textTransform: "none",
                  bgcolor: batchMode ? "#0f62fe" : "transparent",
                }}
              >
                Batch Upload
              </Button>
            </Box>
          </Box>

          {/* Upload Progress */}
          {(uploading || batchProcessing) && (
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
                {batchProcessing ? "Processing batch..." : "Uploading..."}{" "}
                {uploadProgress}%
              </Typography>
            </Box>
          )}

          {/* Batch Upload Form */}
          {batchMode ? (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Batch Upload Process:
                </Typography>
                <Typography variant="body2">
                  • Input folder contains ZIP files (e.g., loan_app_1.zip)
                </Typography>
                <Typography variant="body2">
                  • Output folder contains final JSONs (e.g.,
                  loan_app_1_final.json)
                </Typography>
                <Typography variant="body2">
                  • System will automatically match and process all files
                </Typography>
              </Alert>

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

              {/* Batch Process Button */}
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
                {batchProcessing
                  ? "Processing Batch..."
                  : "Process Batch Upload"}
              </Button>
            </Box>
          ) : (
            /* EXISTING SINGLE UPLOAD FORM - Keep as is */
            <Box>
              {/* Document Name Field */}
              <Box sx={{ mb: 3 }}>
                {/* ... existing single upload code ... */}
              </Box>

              {/* Rest of existing single upload form */}
            </Box>
          )}

          {/* Cancel/Back Button */}
          <Button
            variant="text"
            fullWidth
            onClick={() => navigate("/dashboard")}
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
