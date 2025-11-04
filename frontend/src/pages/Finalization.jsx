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
import OriginalJsonModal from "../components/OriginalJsonModal";
import CodeIcon from "@mui/icons-material/Code";

const Finalization = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Tabs
  const [activeTab, setActiveTab] = useState(0); // 0 = Single Upload, 1 = Batch Upload

  // Single upload states (ZIP)
  const [zipFile, setZipFile] = useState(null);
  const [outputFile, setOutputFile] = useState(null);
  const [docName, setDocName] = useState("");

  // Batch upload states
  const [inputFolderPath, setInputFolderPath] = useState("");
  const [outputFolderPath, setOutputFolderPath] = useState("");

  // Common upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Viewer states
  const [uploadedData, setUploadedData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [originalJsonModalOpen, setOriginalJsonModalOpen] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // ✅ Handle dashboard navigation data
  useEffect(() => {
    if (location.state?.viewMode && location.state?.fetchedDocument) {
      const {
        fetchedDocument,
        documentName,
        originalFileName,
        drillDownCategory,
        drillDownFilename,
      } = location.state;

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
      } else if (fetchedDocument.raw_json?.finalisation) {
        cats = Object.keys(fetchedDocument.raw_json.finalisation);
      }

      setCategories(cats);
      setActiveCategory(
        drillDownCategory && cats.includes(drillDownCategory)
          ? drillDownCategory
          : cats[0] || ""
      );
    }
  }, [location.state]);

  // ===== SINGLE UPLOAD (ZIP) =====
  const handleSingleUpload = async () => {
    if (!zipFile) {
      alert("Please select a ZIP file");
      return;
    }
    if (!outputFile) {
      alert("Please select output JSON file");
      return;
    }

    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");

    if (!username || !email) {
      alert("User credentials not found. Please login again.");
      return;
    }

    let finalDocName = docName.trim();
    if (!finalDocName) {
      const extracted = outputFile.name
        .replace("_final.json", "")
        .replace(".json", "");
      finalDocName = extracted || "Document";
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("finalization_document_name", finalDocName);
      formData.append("input_files", zipFile); // ZIP instead of folder
      formData.append("output_file", outputFile);

      const res = await axios.post(
        "http://127.0.0.1:8000/upload_json",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      console.log("✅ Single upload success:", res.data);
      alert("ZIP uploaded successfully!");

      const uploadedDoc = await documentAPI.getDocumentById(
        res.data.inserted_id
      );

      setUploadedData({
        documentName: uploadedDoc.finalization_document_name || "Document",
        originalFileName: uploadedDoc.original_filename || "Document.json",
        input_data: uploadedDoc.input_data?.finalisation
          ? { finalisation: uploadedDoc.input_data.finalisation }
          : uploadedDoc.raw_json,
        raw_json: uploadedDoc.raw_json,
        original_bm_json: uploadedDoc.original_bm_json || {},
      });

      const cats = uploadedDoc.input_data?.finalisation
        ? Object.keys(uploadedDoc.input_data.finalisation)
        : Object.keys(uploadedDoc.raw_json?.finalisation || {});
      setCategories(cats);
      setActiveCategory(cats[0] || "");

      window.dispatchEvent(new Event("documentUploaded"));
      setZipFile(null);
      setOutputFile(null);
      setDocName("");
    } catch (err) {
      console.error("❌ Single upload failed:", err);
      alert(err.response?.data?.detail || "Upload failed. Check console.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ===== BATCH UPLOAD =====
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

    setUploading(true);
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("input_folder_path", inputFolderPath.trim());
      formData.append("output_folder_path", outputFolderPath.trim());
      formData.append("username", username);
      formData.append("email", email);

      const res = await axios.post(
        "http://127.0.0.1:8000/batch_process",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("✅ Batch process success:", res.data);
      alert(
        `Batch processing completed!\n\n` +
          `Successful: ${res.data.summary.successful}\n` +
          `Failed: ${res.data.summary.failed}\n` +
          `Skipped: ${res.data.summary.skipped}`
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
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ===== VIEW MODE =====
  const finalNotesCount =
    uploadedData?.input_data?.finalisation?.Note_Extraction?.filter((item) =>
      item.status?.includes("Note - Final")
    ).length || 0;

  if (uploadedData) {
    const categoryData =
      uploadedData.input_data?.finalisation?.[activeCategory] || [];

    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
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

            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {uploadedData.originalFileName.split("_final.json")[0] ||
                uploadedData.originalFileName}
            </Typography>
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
              onClick={() =>
                navigate("/finalization/summary", {
                  state: {
                    documentData: uploadedData.raw_json,
                    completeDocument: uploadedData,
                    originalFileName: uploadedData.originalFileName,
                    documentName: uploadedData.documentName,
                  },
                })
              }
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

  // ===== UPLOAD VIEW =====
  return (
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
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          centered
          sx={{
            mb: 3,
            "& .MuiTab-root": { fontWeight: 600, textTransform: "none" },
          }}
        >
          <Tab label="Single Upload" />
          <Tab label="Batch Upload" />
        </Tabs>

        {/* Upload progress */}
        {uploading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{
                height: 8,
                borderRadius: 1,
                bgcolor: "#e0e0e0",
                "& .MuiLinearProgress-bar": { bgcolor: "#0f62fe" },
              }}
            />
            <Typography align="center" sx={{ mt: 1, fontWeight: 600 }}>
              {activeTab === 0 ? "Uploading..." : "Processing Batch..."}{" "}
              {uploadProgress}%
            </Typography>
          </Box>
        )}

        {activeTab === 0 ? (
          <>
            {/* Single Upload Form */}
            {/* <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, mb: 2, color: "#0f62fe" }}
            >
              Upload ZIP + Output JSON
            </Typography> */}

            <TextField
              fullWidth
              label="Document Name"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Leave empty to auto-extract"
              sx={{ mb: 3 }}
            />

            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<FolderOpenIcon />}
              sx={{ mb: 3, py: 2, borderStyle: "dashed" }}
            >
              {zipFile ? `✓ ${zipFile.name}` : "Select Input ZIP File"}
              <input
                type="file"
                hidden
                accept=".zip"
                onChange={(e) => setZipFile(e.target.files[0])}
              />
            </Button>

            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<FolderOpenIcon />}
              sx={{ mb: 3, py: 2, borderStyle: "dashed" }}
            >
              {outputFile ? `✓ ${outputFile.name}` : "Select Output JSON File"}
              <input
                type="file"
                hidden
                accept=".json"
                onChange={(e) => setOutputFile(e.target.files[0])}
              />
            </Button>

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<CloudUploadIcon />}
              onClick={handleSingleUpload}
              disabled={uploading || !zipFile || !outputFile}
              sx={{
                py: 1.8,
                bgcolor: "#0f62fe",
                fontWeight: 700,
                textTransform: "none",
              }}
            >
              Upload & View Document
            </Button>
          </>
        ) : (
          <>
            {/* Batch Upload Form */}
            <TextField
              fullWidth
              label="Input Folder Path (ZIP Files)"
              value={inputFolderPath}
              onChange={(e) => setInputFolderPath(e.target.value)}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Output Folder Path (Final JSONs)"
              value={outputFolderPath}
              onChange={(e) => setOutputFolderPath(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              fullWidth
              startIcon={<CloudUploadIcon />}
              onClick={handleBatchUpload}
              disabled={
                uploading || !inputFolderPath.trim() || !outputFolderPath.trim()
              }
              sx={{
                py: 1.8,
                bgcolor: "#0f62fe",
                fontWeight: 700,
                textTransform: "none",
              }}
            >
              Process Batch Upload
            </Button>
          </>
        )}

        <Button
          variant="text"
          fullWidth
          onClick={() => navigate("/dashboard")}
          sx={{ mt: 2, color: "#666", textTransform: "none" }}
        >
          Cancel & Return to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default Finalization;
